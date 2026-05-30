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
    const { taskId, proofUrl, proofText } = body;

    // Get task
    const { data: task } = await supabase
      .from('simple_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('active', true)
      .single();

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already submitted
    const { data: existing } = await supabase
      .from('task_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already submitted this task' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check max submissions
    if (task.max_submissions > 0 && task.current_submissions >= task.max_submissions) {
      return new Response(JSON.stringify({ error: 'Task submission limit reached' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate proof based on type
    if (task.proof_type === 'URL' && !proofUrl) {
      return new Response(JSON.stringify({ error: 'URL proof required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (task.proof_type === 'TEXT' && !proofText) {
      return new Response(JSON.stringify({ error: 'Text proof required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create submission
    const { data: submission, error: createError } = await supabase
      .from('task_submissions')
      .insert({
        user_id: user.id,
        task_id: taskId,
        proof_url: proofUrl || '',
        proof_text: proofText || '',
        status: task.proof_type === 'NONE' ? 'approved' : 'pending',
        coins_awarded: task.proof_type === 'NONE' ? task.reward_coins : 0,
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: 'Failed to submit task' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auto-approve for NONE proof type
    if (task.proof_type === 'NONE') {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins, total_earned')
        .eq('id', user.id)
        .single();

      if (profile) {
        const balanceBefore = profile.coins;
        const balanceAfter = balanceBefore + task.reward_coins;

        // Update profile
        await supabase
          .from('profiles')
          .update({
            coins: balanceAfter,
            total_earned: profile.total_earned + task.reward_coins,
          })
          .eq('id', user.id);

        // Record transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'TASK_REWARD',
            amount: task.reward_coins,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            description: `Task: ${task.title}`,
            related_entity_id: submission.id,
          });

        // Process referral commission
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('referred_by')
          .eq('id', user.id)
          .single();

        if (userProfile?.referred_by) {
          const { data: configs } = await supabase
            .from('admin_configs')
            .select('key, value')
            .eq('key', 'referral_commission_percent')
            .maybeSingle();

          const commissionRate = configs ? parseInt(configs.value) / 100 : 0.1;
          const commission = Math.floor(task.reward_coins * commissionRate);

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
                  source_type: 'TASK',
                  source_id: submission.id,
                  commission_rate: commissionRate,
                  commission_amount: commission,
                });
            }
          }
        }
      }
    }

    // Update task submission count
    await supabase
      .from('simple_tasks')
      .update({
        current_submissions: task.current_submissions + 1,
      })
      .eq('id', taskId);

    return new Response(JSON.stringify({
      success: true,
      submission,
      auto_approved: task.proof_type === 'NONE',
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
