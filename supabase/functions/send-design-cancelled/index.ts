import nodemailer from 'npm:nodemailer@6'

const SMTP_HOST    = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT    = parseInt(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER    = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS    = Deno.env.get('SMTP_PASS') ?? ''
const DESIGN_EMAIL = Deno.env.get('DESIGN_EMAIL') || SMTP_USER

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let body: any
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { storeName, customerName, cabinetColor, projectDescription } = body

  const cancelledAt = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:36px 48px;">
      <p style="margin:0;color:#f87171;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">❌ Payment Not Completed</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.02em;">Design Request Abandoned</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${cancelledAt}</p>
    </div>
    <div style="padding:36px 48px;">
      <p style="margin:0 0 24px;padding:16px 20px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#991b1b;font-size:13px;font-weight:700;">
        This customer went to checkout but clicked back without completing payment.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;width:140px;">Store</td>
          <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;">${storeName || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Customer</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${customerName || 'Unknown'}</td>
        </tr>
        ${cabinetColor ? `<tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Cabinet Color</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${cabinetColor}</td>
        </tr>` : ''}
        ${projectDescription ? `<tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;">Description</td>
          <td style="padding:8px 0;color:#475569;font-size:14px;line-height:1.6;">${projectDescription}</td>
        </tr>` : ''}
      </table>
    </div>
    <div style="padding:24px 48px;background:#f8fafc;text-align:center;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">No action needed — discard the pending request email for this order.</p>
    </div>
  </div>
</body>
</html>`

  console.log(`Sending cancelled email to: ${DESIGN_EMAIL}`)

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    const info = await transporter.sendMail({
      from: `"KitchenUnity" <${SMTP_USER}>`,
      to: DESIGN_EMAIL,
      subject: `Design Request Abandoned — ${storeName} / ${customerName}`,
      html,
      text: `Design request abandoned.\n\nStore: ${storeName}\nCustomer: ${customerName}${cabinetColor ? `\nCabinet Color: ${cabinetColor}` : ''}${projectDescription ? `\nDescription: ${projectDescription}` : ''}\n\nThis customer went to checkout but did not complete payment.`,
    })
    console.log(`Cancelled design request email sent for ${storeName} / ${customerName}`)
    console.log(`SMTP response: ${info.response} | messageId: ${info.messageId} | accepted: ${JSON.stringify(info.accepted)} | rejected: ${JSON.stringify(info.rejected)}`)
  } catch (err: any) {
    console.error('Email error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders })
})
