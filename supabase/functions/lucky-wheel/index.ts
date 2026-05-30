import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const WHEEL_PRIZES = [
  { type: 'coins', amount: 0, weight: 20 },
  { type: 'coins', amount: 50, weight: 25 },
  { type: 'coins', amount: 100, weight: 20 },
  { type: 'coins', amount: 150, weight: 15 },
  { type: 'coins', amount: 200, weight: 10 },
  { type: 'coins', amount: 300, weight: 5 },
  { type: 'coins', amount: 500, weight: 3 },
  { type: 'coins', amount: 1000, weight: 2 },
];

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
    const { clientSeed } = body;

    // Check if already spun today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: lastSpin } = await supabase
      .from('lucky_wheel_spins')
      .select('spun_at')
      .eq('user_id', user.id)
      .gte('spun_at', today.toISOString())
      .maybeSingle();

    if (lastSpin) {
      return new Response(JSON.stringify({ error: 'Already spun today' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate server seed
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let serverSeed = '';
    for (let i = 0; i < 64; i++) {
      serverSeed += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const fullSeed = serverSeed + (clientSeed || '');
    const random = seededRandom(fullSeed);

    // Weighted random selection
    const totalWeight = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let randomVal = random * totalWeight;
    let selectedPrize = WHEEL_PRIZES[0];
    let selectedIndex = 0;

    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      randomVal -= WHEEL_PRIZES[i].weight;
      if (randomVal <= 0) {
        selectedPrize = WHEEL_PRIZES[i];
        selectedIndex = i;
        break;
      }
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins, total_earned')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const balanceBefore = profile.coins;
    const balanceAfter = balanceBefore + selectedPrize.amount;

    // Record spin
    await supabase
      .from('lucky_wheel_spins')
      .insert({
        user_id: user.id,
        prize_type: selectedPrize.type,
        prize_amount: selectedPrize.amount,
        server_seed: serverSeed,
        result_index: selectedIndex,
      });

    // Update profile if won
    if (selectedPrize.amount > 0) {
      await supabase
        .from('profiles')
        .update({
          coins: balanceAfter,
          total_earned: profile.total_earned + selectedPrize.amount,
          last_wheel_spin: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'WHEEL_SPIN',
          amount: selectedPrize.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: 'Daily lucky wheel spin',
        });
    } else {
      await supabase
        .from('profiles')
        .update({
          last_wheel_spin: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return new Response(JSON.stringify({
      success: true,
      prize_type: selectedPrize.type,
      prize_amount: selectedPrize.amount,
      result_index: selectedIndex,
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
