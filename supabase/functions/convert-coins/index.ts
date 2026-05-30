import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { coins } = body;

    if (!coins || coins <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
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

    const exchangeRate = configMap.exchange_rate || 10000;
    const feePercent = configMap.conversion_fee_percent || 5;

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins, cash_balance')
      .eq('id', user.id)
      .single();

    if (!profile || profile.coins < coins) {
      return new Response(JSON.stringify({ error: 'Insufficient coins' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate conversion
    const grossUSD = coins / exchangeRate;
    const feeUSD = grossUSD * (feePercent / 100);
    const netUSD = grossUSD - feeUSD;
    const netCents = Math.floor(netUSD * 100);

    const coinsBefore = profile.coins;
    const coinsAfter = coinsBefore - coins;
    const cashBefore = profile.cash_balance;
    const cashAfter = cashBefore + netCents;

    // Update profile
    await supabase
      .from('profiles')
      .update({
        coins: coinsAfter,
        cash_balance: cashAfter,
      })
      .eq('id', user.id);

    // Record coin transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'CONVERT_FROM_COINS',
        amount: -coins,
        balance_before: coinsBefore,
        balance_after: coinsAfter,
        description: `Converted to $${netUSD.toFixed(2)} cash (${feePercent}% fee)`,
      });

    // Record cash transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'CONVERT_TO_CASH',
        amount: netCents,
        balance_before: cashBefore,
        balance_after: cashAfter,
        description: `Converted from ${coins} coins`,
      });

    return new Response(JSON.stringify({
      success: true,
      coins_converted: coins,
      gross_usd: grossUSD,
      fee_usd: feeUSD,
      net_usd: netUSD,
      new_coin_balance: coinsAfter,
      new_cash_balance: cashAfter,
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
