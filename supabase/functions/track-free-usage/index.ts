import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FREE_LIMIT = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Hash the IP so we never store raw IPs
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const ipHash = await hashIp(ip);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (req.method === 'GET') {
      // Return current count for this IP
      const { data } = await supabase
        .from('free_usage_logs')
        .select('session_count')
        .eq('ip_hash', ipHash)
        .maybeSingle();

      const count = data?.session_count ?? 0;
      return new Response(
        JSON.stringify({ count, limited: count >= FREE_LIMIT }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (req.method === 'POST') {
      // Upsert: increment session count
      const { data: existing } = await supabase
        .from('free_usage_logs')
        .select('id, session_count')
        .eq('ip_hash', ipHash)
        .maybeSingle();

      let newCount: number;

      if (existing) {
        newCount = existing.session_count + 1;
        await supabase
          .from('free_usage_logs')
          .update({ session_count: newCount, last_seen: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        newCount = 1;
        await supabase.from('free_usage_logs').insert({
          ip_hash: ipHash,
          session_count: 1,
        });
      }

      return new Response(
        JSON.stringify({ count: newCount, limited: newCount >= FREE_LIMIT }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('IP_HASH_SALT', 'ku-salt-2026'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
