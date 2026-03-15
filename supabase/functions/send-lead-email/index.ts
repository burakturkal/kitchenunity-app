import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Supabase DB webhook sends { type, table, record, old_record }
  const lead = payload.record
  if (!lead?.store_id) {
    return new Response('No lead record', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('name, contact_email, reply_to_email')
    .eq('id', lead.store_id)
    .single()

  if (storeErr || !store) {
    console.error('Store lookup failed:', storeErr)
    return new Response('Store not found', { status: 404 })
  }

  const toEmail = store.contact_email?.trim()
  if (!toEmail) {
    console.log('No notification email configured for store — skipping')
    return new Response('No email configured', { status: 200 })
  }

  const leadName = lead.name || 'Unknown'
  const leadEmail = lead.email || 'N/A'
  const leadPhone = lead.phone || 'N/A'
  const leadSource = lead.source || 'Website'
  const leadMessage = lead.message || ''
  const receivedAt = new Date(lead.created_at || Date.now()).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0f172a;padding:36px 48px;">
      <p style="margin:0;color:#60a5fa;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">${store.name}</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.02em;">New Lead</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${leadSource} &nbsp;·&nbsp; ${receivedAt}</p>
    </div>

    <!-- Lead details -->
    <div style="padding:36px 48px;border-bottom:1px solid #f1f5f9;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;width:100px;">Name</td>
          <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;">${leadName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Email</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${leadEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Phone</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${leadPhone}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Source</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${leadSource}</td>
        </tr>
        ${leadMessage ? `
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;">Message</td>
          <td style="padding:8px 0;color:#475569;font-size:14px;line-height:1.6;">${leadMessage}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:24px 48px;background:#f8fafc;text-align:center;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">Powered by KitchenUnity</p>
    </div>

  </div>
</body>
</html>`

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  try {
    await transporter.sendMail({
      from: `"${store.name}" <${SMTP_USER}>`,
      to: toEmail,
      replyTo: store.reply_to_email?.trim() || undefined,
      subject: `New lead from ${leadSource}: ${leadName}`,
      html,
    })

    console.log('Lead email sent to', toEmail)
    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('SMTP error:', err)
    return new Response('Email send failed', { status: 500 })
  }
})
