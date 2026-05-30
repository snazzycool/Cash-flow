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
    const { amount, method, walletAddress, bankName, bankAccountNumber, bankAccountName } = body;

    // Get configs
    const { data: configs } = await supabase
      .from('admin_configs')
      .select('key, value');

    const configMap: Record<string, number> = {};
    configs?.forEach(c => configMap[c.key] = parseInt(c.value));

    const minWithdrawal = (configMap.min_withdrawal_usd || 10) * 100;

    if (!amount || amount < minWithdrawal) {
      return new Response(JSON.stringify({ error: `Minimum withdrawal is $${minWithdrawal / 100}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('cash_balance, email_verified, kyc_verified')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (profile.cash_balance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient cash balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!profile.email_verified) {
      return new Response(JSON.stringify({ error: 'Email verification required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const kycRequired = configMap.kyc_required_usd * 100;
    if (amount > kycRequired && !profile.kyc_verified) {
      return new Response(JSON.stringify({ error: 'KYC verification required for this amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate fee based on method
    const feeMap: Record<string, number> = {
      USDT_TRC20: 100,
      USDT_ERC20: 500,
      USDC: 500,
      XRP: 100,
      BTC: 200,
      ETH: 500,
      NIGERIAN_BANK: 200,
      GREY_BANK: 300,
    };
    const fee = feeMap[method] || 100;

    // Create withdrawal request
    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount,
        fee,
        method,
        wallet_address: walletAddress || '',
        bank_name: bankName || '',
        bank_account_number: bankAccountNumber || '',
        bank_account_name: bankAccountName || '',
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: 'Failed to create withdrawal request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Deduct from balance
    await supabase
      .from('profiles')
      .update({
        cash_balance: profile.cash_balance - amount,
      })
      .eq('id', user.id);

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'WITHDRAW',
        amount: -amount,
        balance_before: profile.cash_balance,
        balance_after: profile.cash_balance - amount,
        description: `Withdrawal via ${method}`,
        related_entity_id: withdrawal.id,
      });

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'WITHDRAWAL',
        title: 'Withdrawal Request Created',
        message: `Your withdrawal of $${(amount / 100).toFixed(2)} is being processed.`,
        data: { withdrawal_id: withdrawal.id },
      });

    return new Response(JSON.stringify({
      success: true,
      withdrawal,
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
