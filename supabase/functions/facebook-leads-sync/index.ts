import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Look back 2 hours to catch anything the webhook missed
const LOOKBACK_SECONDS = 2 * 60 * 60

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  console.log('[fb-sync] starting')

  // Fetch all stores with Facebook configured
  const { data: stores, error: storeErr } = await supabase
    .from('stores')
    .select('id, facebook_page_id, facebook_page_token')
    .not('facebook_page_id', 'is', null)
    .neq('facebook_page_id', '')
    .not('facebook_page_token', 'is', null)
    .neq('facebook_page_token', '')

  if (storeErr || !stores?.length) {
    console.log('[fb-sync] no stores configured for Facebook:', storeErr)
    return new Response('OK', { status: 200 })
  }

  console.log(`[fb-sync] checking ${stores.length} store(s)`)

  const since = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS

  for (const store of stores) {
    const pageToken = store.facebook_page_token.replace(/\s+/g, '')
    const pageId = store.facebook_page_id

    console.log(`[fb-sync] store ${store.id}, page ${pageId}`)

    // Fetch all lead forms for this page
    const formsRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?fields=id,name&access_token=${pageToken}`
    )
    const formsData = await formsRes.json()

    if (!formsRes.ok) {
      console.error(`[fb-sync] failed to fetch forms for page ${pageId}:`, formsData)
      continue
    }

    const forms: { id: string; name: string }[] = formsData.data ?? []
    console.log(`[fb-sync] found ${forms.length} form(s) for page ${pageId}`)

    for (const form of forms) {
      // Fetch recent leads from this form since our lookback window
      const leadsRes = await fetch(
        `https://graph.facebook.com/v19.0/${form.id}/leads?fields=id,field_data,created_time&since=${since}&access_token=${pageToken}`
      )
      const leadsData = await leadsRes.json()

      if (!leadsRes.ok) {
        console.error(`[fb-sync] failed to fetch leads for form ${form.id}:`, leadsData)
        continue
      }

      const fbLeads: { id: string; field_data: { name: string; values: string[] }[]; created_time: string }[] =
        leadsData.data ?? []

      if (!fbLeads.length) continue

      console.log(`[fb-sync] form "${form.name}" (${form.id}): ${fbLeads.length} lead(s) in window`)

      for (const fbLead of fbLeads) {
        const fields: Record<string, string> = {}
        for (const f of fbLead.field_data ?? []) {
          fields[f.name] = f.values?.[0] ?? ''
        }

        const fullName =
          fields['full_name'] ||
          `${fields['first_name'] || ''} ${fields['last_name'] || ''}`.trim()

        // Upsert using facebook_leadgen_id to avoid duplicates with webhook inserts
        const { error: upsertErr } = await supabase.from('leads').upsert(
          {
            store_id: store.id,
            facebook_leadgen_id: fbLead.id,
            name: fullName || 'Unknown',
            email: fields['email'] || '',
            phone: fields['phone_number'] || fields['phone'] || '',
            source: 'Facebook Lead Ad',
            status: 'New',
          },
          { onConflict: 'store_id,facebook_leadgen_id', ignoreDuplicates: true }
        )

        if (upsertErr) {
          console.error(`[fb-sync] failed to upsert lead ${fbLead.id}:`, upsertErr)
        } else {
          console.log(`[fb-sync] upserted lead ${fbLead.id} (${fullName || 'Unknown'})`)
        }
      }
    }
  }

  console.log('[fb-sync] done')
  return new Response('OK', { status: 200 })
})
