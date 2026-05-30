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

    const baseBonus = configMap.daily_bonus_base || 100;
    const increment = configMap.daily_bonus_increment || 50;
    const maxDays = configMap.daily_bonus_max_days || 7;

    // Get current streak and last claim
    const { data: lastBonus } = await supabase
      .from('daily_bonuses')
      .select('*')
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    let streak = 1;

    if (lastBonus) {
      const lastClaim = new Date(lastBonus.claimed_at);
      const hoursDiff = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        return new Response(JSON.stringify({ error: 'Already claimed today' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (hoursDiff < 48) {
        streak = Math.min((lastBonus.streak_count || 1) + 1, maxDays);
      } else {
        streak = 1; // Reset streak
      }
    }

    // Calculate bonus
    const coinsAwarded = baseBonus + (streak - 1) * increment;

    // Get current balance
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

    // Record daily bonus
    await supabase
      .from('daily_bonuses')
      .insert({
        user_id: user.id,
        streak_count: streak,
        coins_awarded: coinsAwarded,
      });

    // Update profile
    await supabase
      .from('profiles')
      .update({
        coins: balanceAfter,
        total_earned: profile.total_earned + coinsAwarded,
        streak: streak,
        last_daily_bonus: now.toISOString(),
      })
      .eq('id', user.id);

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'DAILY_BONUS',
        amount: coinsAwarded,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Daily bonus - Day ${streak}`,
      });

    // Process referral commission
    const { data: referral } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', user.id)
      .single();

    if (referral?.referred_by) {
      const commissionRate = (configMap.referral_commission_percent || 10) / 100;
      const commission = Math.floor(coinsAwarded * commissionRate);

      if (commission > 0) {
        // Add commission to referrer
        const { data: referrer } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', referral.referred_by)
          .single();

        if (referrer) {
          await supabase
            .from('profiles')
            .update({
              coins: referrer.coins + commission,
            })
            .eq('id', referral.referred_by);

          // Record commission
          await supabase
            .from('referral_commissions')
            .insert({
              referrer_id: referral.referred_by,
              referred_id: user.id,
              source_type: 'BONUS',
              commission_rate: commissionRate,
              commission_amount: commission,
            });

          // Update referral total
          await supabase
            .from('referrals')
            .update({
              total_commission: supabase.rpc('increment', { amount: commission }),
            })
            .eq('referrer_id', referral.referred_by)
            .eq('referred_id', user.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      streak_count: streak,
      coins_awarded: coinsAwarded,
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
