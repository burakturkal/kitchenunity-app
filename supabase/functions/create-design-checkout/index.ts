import Stripe from 'npm:stripe@14'
import nodemailer from 'npm:nodemailer@6'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const SMTP_HOST  = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT  = parseInt(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER  = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS  = Deno.env.get('SMTP_PASS') ?? ''
const DESIGN_EMAIL = Deno.env.get('DESIGN_EMAIL') || SMTP_USER // where design requests land

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let body: any
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { storeName, customerName, projectDescription, cabinetColor, files, successUrl, cancelUrl } = body

  if (!customerName || !storeName) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
  }

  // ── 1. Create Stripe Checkout Session ────────────────────────────────────────
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1TB8VnE6nFS0nAAaYOzLPgty',
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || 'https://kitchenunity.com',
      cancel_url: cancelUrl || 'https://kitchenunity.com',
      metadata: {
        store_name: storeName,
        customer_name: customerName,
        cabinet_color: cabinetColor || '',
        project_description: (projectDescription || '').slice(0, 500),
      },
      customer_email: undefined,
    })
  } catch (err: any) {
    console.error('Stripe error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }

  // ── 2. Store files in Stripe session metadata isn't feasible for large files,
  //       so we encode a compact payload and the webhook will request it back.
  //       Instead, we send the email with files NOW but mark it as "pending payment".
  //       The webhook (stripe-webhook function) will send the confirmed follow-up.
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    const attachments = (files || []).map((f: any) => ({
      filename: f.name,
      content: f.base64,
      encoding: 'base64',
      contentType: f.type,
    }))

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:36px 48px;">
      <p style="margin:0;color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">⏳ Awaiting Payment</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.02em;">Design Request Initiated</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Session: ${session.id} — do not start work until payment is confirmed.</p>
    </div>
    <div style="padding:36px 48px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;width:140px;">Store</td>
          <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;">${storeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Customer</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${customerName}</td>
        </tr>
        ${cabinetColor ? `<tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Cabinet Color</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${cabinetColor}</td>
        </tr>` : ''}
        ${projectDescription ? `<tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;">Description</td>
          <td style="padding:8px 0;color:#475569;font-size:14px;line-height:1.6;">${projectDescription}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Attachments</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;">${attachments.length > 0 ? `${attachments.length} file(s) attached below` : 'None'}</td>
        </tr>
      </table>
    </div>
    <div style="padding:24px 48px;background:#fef3c7;text-align:center;">
      <p style="margin:0;color:#92400e;font-size:12px;font-weight:700;">You will receive a second email once payment is confirmed.</p>
    </div>
  </div>
</body>
</html>`

    await transporter.sendMail({
      from: `"KitchenUnity" <${SMTP_USER}>`,
      to: DESIGN_EMAIL,
      subject: `[PENDING] Design Request — ${storeName} / ${customerName}`,
      html,
      attachments,
    })

    console.log(`Pending design request email sent for ${storeName} / ${customerName}`)
  } catch (emailErr: any) {
    console.error('Email error:', emailErr)
  }

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
