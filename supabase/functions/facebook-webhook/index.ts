import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERIFY_TOKEN = Deno.env.get('FB_VERIFY_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // --- Facebook webhook verification (GET) ---
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // --- Incoming lead notification (POST) ---
  if (req.method === 'POST') {
    const body = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    try {
      for (const entry of body.entry ?? []) {
        const pageId = String(entry.id)

        for (const change of entry.changes ?? []) {
          if (change.field !== 'leadgen') continue

          const leadgenId = change.value?.leadgen_id
          if (!leadgenId) continue

          const { data: stores, error: storeErr } = await supabase
            .from('stores')
            .select('id, facebook_page_token')
            .eq('facebook_page_id', pageId)
            .limit(1)

          if (storeErr || !stores?.length) {
            console.error('No store found for Facebook page:', pageId, storeErr)
            continue
          }

          const stores_filtered = stores

          const storeId = stores_filtered[0].id
          const pageToken = stores_filtered[0].facebook_page_token.replace(/\s+/g, '')

          const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time&access_token=${pageToken}`
          )
          const fbLead = await fbRes.json()

          if (!fbRes.ok) {
            console.error('Facebook Graph API error:', fbLead)
            continue
          }

          const fields: Record<string, string> = {}
          for (const f of fbLead.field_data ?? []) {
            fields[f.name] = f.values?.[0] ?? ''
          }

          const fullName =
            fields['full_name'] ||
            `${fields['first_name'] || ''} ${fields['last_name'] || ''}`.trim()

          await supabase.from('leads').insert({
            store_id: storeId,
            name: fullName || 'Unknown',
            email: fields['email'] || '',
            phone: fields['phone_number'] || fields['phone'] || '',
            source: 'Facebook Lead Ad',
            status: 'New',
          })
        }
      }
    } catch (err) {
      console.error('Unhandled error:', err)
    }

    return new Response('OK', { status: 200 })
  }

  return new Response('Method Not Allowed', { status: 405 })
})
