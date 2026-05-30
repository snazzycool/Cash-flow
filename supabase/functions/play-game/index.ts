import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Provably fair: Generate server seed and hash
async function generateServerSeed(): Promise<{ seed: string; hash: string }> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let seed = '';
  for (let i = 0; i < 64; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { seed, hash };
}

// Generate random number from seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 10000) / 10000;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { gameType, betAmount, params, clientSeed } = body;

    if (!gameType || !betAmount || betAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins, total_wagered, total_won, total_lost')
      .eq('id', user.id)
      .single();

    if (!profile || profile.coins < betAmount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get configs
    const { data: configs } = await supabase
      .from('admin_configs')
      .select('key, value');

    const configMap: Record<string, number> = {};
    configs?.forEach(c => configMap[c.key] = parseInt(c.value));

    // Generate server seed
    const { seed, hash } = await generateServerSeed();
    const fullSeed = seed + (clientSeed || '');

    // Play game based on type
    let result: any = {};
    let win = false;
    let payout = 0;
    let rtp = 0;

    const random = seededRandom(fullSeed);

    switch (gameType) {
      case 'DICE': {
        const target = params.target;
        const overUnder = params.overUnder;
        const roll = Math.floor(random * 100);

        if (overUnder === 'over') {
          win = roll > target;
        } else {
          win = roll < target;
        }

        // Calculate payout based on probability (house edge ~1%)
        const winChance = overUnder === 'over' ? (100 - target) / 100 : target / 100;
        const multiplier = 0.99 / winChance;
        payout = win ? Math.floor(betAmount * multiplier) : 0;
        rtp = configMap.rtp_dice || 95;

        result = { roll, target, overUnder, multiplier: win ? multiplier : 0 };
        break;
      }

      case 'COIN_FLIP': {
        const choice = params.choice;
        const outcome = random < 0.5 ? 'heads' : 'tails';
        win = choice === outcome;
        payout = win ? Math.floor(betAmount * 1.98) : 0;
        rtp = configMap.rtp_coin_flip || 99;

        result = { outcome, choice };
        break;
      }

      case 'PICK_CARD': {
        const cardIndex = params.cardIndex;
        // 52 cards: 4 aces (10x), 12 face cards (3x), 36 number cards (lose)
        const drawnCard = Math.floor(random * 52) + 1;

        if (drawnCard <= 4) {
          // Ace - 10x
          payout = betAmount * 10;
          win = true;
        } else if (drawnCard <= 16) {
          // Face card - 3x
          payout = betAmount * 3;
          win = true;
        } else {
          payout = 0;
          win = false;
        }

        rtp = configMap.rtp_pick_card || 90;
        result = { drawnCard, cardIndex, cardType: drawnCard <= 4 ? 'ace' : drawnCard <= 16 ? 'face' : 'number' };
        break;
      }

      case 'LUCKY_WHEEL': {
        // 12 segments: 1x10, 1x5, 2x2, 3x1.5, 5x0 (lose)
        const segments = [10, 5, 2, 2, 1.5, 1.5, 1.5, 0, 0, 0, 0, 0];
        const segmentIndex = Math.floor(random * 12);
        const multiplier = segments[segmentIndex];

        win = multiplier > 0;
        payout = win ? Math.floor(betAmount * multiplier) : 0;
        rtp = configMap.rtp_lucky_wheel || 85;

        result = { segmentIndex, multiplier };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown game type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Calculate new balance
    const balanceBefore = profile.coins;
    const balanceAfter = balanceBefore - betAmount + payout;

    // Record game round
    await supabase
      .from('game_rounds')
      .insert({
        user_id: user.id,
        game_type: gameType,
        bet_amount: betAmount,
        game_params: params,
        server_seed: seed,
        server_seed_hash: hash,
        client_seed: clientSeed || '',
        result,
        payout,
        win,
        rtp,
      });

    // Update profile
    await supabase
      .from('profiles')
      .update({
        coins: balanceAfter,
        total_wagered: profile.total_wagered + betAmount,
        total_won: profile.total_won + (win ? payout : 0),
        total_lost: profile.total_lost + (win ? 0 : betAmount),
      })
      .eq('id', user.id);

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: win ? 'GAME_WIN' : 'GAME_LOSS',
        amount: win ? payout : -betAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `${gameType} - ${win ? 'Won' : 'Lost'}`,
      });

    return new Response(JSON.stringify({
      success: true,
      result,
      win,
      payout,
      balance: balanceAfter,
      server_seed_hash: hash,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
