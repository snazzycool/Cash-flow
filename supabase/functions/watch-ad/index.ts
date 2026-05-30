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

    // Get configs
    const { data: configs } = await supabase
      .from('admin_configs')
      .select('key, value');

    const configMap: Record<string, number> = {};
    configs?.forEach(c => configMap[c.key] = parseInt(c.value));

    const maxDailyAds = configMap.max_daily_ads || 10;
    const minReward = configMap.ad_reward_min || 50;
    const maxReward = configMap.ad_reward_max || 200;

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAds } = await supabase
      .from('ad_watches')
      .select('id')
      .eq('user_id', user.id)
      .gte('watched_at', today);

    if ((todayAds?.length || 0) >= maxDailyAds) {
      return new Response(JSON.stringify({ error: 'Daily ad limit reached' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Random reward between min and max
    const coinsAwarded = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;

    // Get current profile
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
    const balanceAfter = balanceBefore + coinsAwarded;

    // Record ad watch
    await supabase
      .from('ad_watches')
      .insert({
        user_id: user.id,
        coins_awarded: coinsAwarded,
        ad_provider: 'internal',
      });

    // Update profile
    await supabase
      .from('profiles')
      .update({
        coins: balanceAfter,
        total_earned: profile.total_earned + coinsAwarded,
      })
      .eq('id', user.id);

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'AD_REWARD',
        amount: coinsAwarded,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: 'Rewarded video ad',
      });

    // Process referral commission
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', user.id)
      .single();

    if (userProfile?.referred_by) {
      const commissionRate = (configMap.referral_commission_percent || 10) / 100;
      const commission = Math.floor(coinsAwarded * commissionRate);

      if (commission > 0) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', userProfile.referred_by)
          .single();

        if (referrer) {
          await supabase
            .from('profiles')
            .update({ coins: referrer.coins + commission })
            .eq('id', userProfile.referred_by);

          await supabase
            .from('referral_commissions')
            .insert({
              referrer_id: userProfile.referred_by,
              referred_id: user.id,
              source_type: 'AD',
              commission_rate: commissionRate,
              commission_amount: commission,
            });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      coins_awarded: coinsAwarded,
      ads_watched_today: (todayAds?.length || 0) + 1,
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
