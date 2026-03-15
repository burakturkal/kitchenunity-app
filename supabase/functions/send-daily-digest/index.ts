import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SMTP_HOST  = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT  = parseInt(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER  = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS  = Deno.env.get('SMTP_PASS') ?? ''

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const now = new Date()
  const utcDateStr = now.toISOString().slice(0, 10) // "YYYY-MM-DD" in UTC

  console.log(`[digest] running at UTC ${now.toISOString()}`)

  // Fetch all digest-enabled stores that haven't been sent today (UTC date)
  const { data: stores, error: storeErr } = await supabase
    .from('stores')
    .select('id, name, contact_email, daily_digest_time, daily_digest_statuses, daily_digest_last_sent, timezone')
    .eq('daily_digest_enabled', true)
    .or(`daily_digest_last_sent.is.null,daily_digest_last_sent.lt.${utcDateStr}`)

  if (storeErr) {
    console.error('[digest] store query error:', storeErr)
    return new Response('Store query failed', { status: 500 })
  }

  // For each store, convert current UTC time to the store's local timezone and compare
  const matchingStores = (stores || []).filter(store => {
    const tz = store.timezone || 'America/New_York'
    const localHHMM = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now).replace(/[^\d:]/g, '').slice(0, 5)

    console.log(`[digest] store="${store.name}" tz=${tz} local=${localHHMM} target=${store.daily_digest_time}`)
    return localHHMM === store.daily_digest_time
  })

  if (matchingStores.length === 0) {
    console.log('[digest] no stores match current local time')
    return new Response('No digests to send right now', { status: 200 })
  }

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  })

  for (const store of matchingStores) {
    const toEmail = store.contact_email?.trim()
    if (!toEmail) continue

    const statuses: string[] = store.daily_digest_statuses || []
    if (statuses.length === 0) continue

    // Fetch leads for this store matching selected statuses
    const { data: leads, error: leadsErr } = await supabase
      .from('leads')
      .select('name, email, status, created_at')
      .eq('store_id', store.id)
      .in('status', statuses)
      .order('created_at', { ascending: false })

    if (leadsErr) {
      console.error(`Leads query error for store ${store.id}:`, leadsErr)
      continue
    }

    const reportDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    // Build status sections
    const statusSections = statuses.map(status => {
      const group = (leads || []).filter(l => l.status === status)
      const isNew = status === 'New'

      const rows = group.length === 0
        ? `<tr><td colspan="2" style="padding:12px 0;color:#94a3b8;font-size:13px;font-style:italic;">No leads with this status</td></tr>`
        : group.map(l => {
            const receivedAt = new Date(l.created_at).toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true,
            })
            return `
            <tr>
              <td style="padding:8px 12px 8px 0;color:#1e293b;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${l.name || 'Unknown'}</td>
              ${isNew
                ? `<td style="padding:8px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Received ${receivedAt}</td>`
                : `<td style="padding:8px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">${l.email || ''}</td>`
              }
            </tr>`
          }).join('')

      const badgeColor = status === 'New'       ? '#dbeafe;color:#2563eb'
                       : status === 'Qualified' ? '#d1fae5;color:#059669'
                       : status === 'Contacted' ? '#f1f5f9;color:#475569'
                       : status === 'Closed'    ? '#ffe4e6;color:#e11d48'
                       :                          '#fef3c7;color:#d97706'

      return `
      <div style="margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <span style="background:${badgeColor};padding:4px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">${status}</span>
          <span style="color:#94a3b8;font-size:13px;">${group.length} lead${group.length !== 1 ? 's' : ''}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${rows}
        </table>
      </div>`
    }).join('')

    const totalLeads = (leads || []).length

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0f172a;padding:36px 48px;">
      <p style="margin:0;color:#60a5fa;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">${store.name}</p>
      <h1 style="margin:8px 0 4px;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.02em;">Daily Lead Digest</h1>
      <p style="margin:0;color:#94a3b8;font-size:13px;">${reportDate}</p>
    </div>

    <!-- Summary bar -->
    <div style="background:#f8fafc;padding:20px 48px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0;color:#475569;font-size:14px;">
        <strong style="color:#0f172a;">${totalLeads} lead${totalLeads !== 1 ? 's' : ''}</strong> found across ${statuses.length} status${statuses.length !== 1 ? 'es' : ''} you're tracking.
      </p>
    </div>

    <!-- Lead sections -->
    <div style="padding:36px 48px;">
      ${statusSections}
    </div>

    <!-- Footer -->
    <div style="padding:24px 48px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">Powered by KitchenUnity &nbsp;·&nbsp; You're receiving this because daily digest is enabled for ${store.name}</p>
    </div>

  </div>
</body>
</html>`

    try {
      await transporter.sendMail({
        from:    `"${store.name}" <${SMTP_USER}>`,
        to:      toEmail,
        subject: `Daily Lead Digest — ${store.name} (${reportDate})`,
        html,
      })
      console.log(`Digest sent to ${toEmail} for store ${store.name}`)

      // Mark as sent today
      await supabase
        .from('stores')
        .update({ daily_digest_last_sent: todayDate })
        .eq('id', store.id)
    } catch (err: any) {
      console.error(`SMTP error for store ${store.id}:`, err)
    }
  }

  return new Response('Done', { status: 200 })
})
