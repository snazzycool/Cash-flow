import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DEPOSIT_WALLETS: Record<string, string> = {
  USDT_TRC20: 'TXyz123456789DEMOADDRESSxxxxxxxxxx',
  USDT_ERC20: '0xDemo123456789DEMOADDRESSxxxxxxxx',
  USDC: '0xDemo123456789DEMOADDRESSxxxxxxxx',
  XRP: 'rDemo123456789DEMOADDRESSxxxxxxxxxx',
  BTC: 'bc1qDemo123456789DEMOADDRESSxxxxxxxx',
  ETH: '0xDemo123456789DEMOADDRESSxxxxxxxx',
};

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
    const { packId, method, walletAddress } = body;

    // Get coin pack
    const { data: pack } = await supabase
      .from('coin_packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (!pack) {
      return new Response(JSON.stringify({ error: 'Invalid coin pack' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create deposit order
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data: order, error: createError } = await supabase
      .from('deposit_orders')
      .insert({
        user_id: user.id,
        amount_usd: pack.price_usd,
        coins: pack.coins,
        bonus_coins: pack.bonus_coins,
        method,
        wallet_address: walletAddress,
        payment_address: DEPOSIT_WALLETS[method] || '',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: 'Failed to create deposit order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      order,
      payment_address: DEPOSIT_WALLETS[method],
      amount_usd: pack.price_usd,
      expires_in: 3600,
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
