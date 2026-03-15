import Stripe from 'npm:stripe@14'
import nodemailer from 'npm:nodemailer@6'

const STRIPE_SECRET_KEY    = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const SMTP_HOST  = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT  = parseInt(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER  = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS  = Deno.env.get('SMTP_PASS') ?? ''
const DESIGN_EMAIL = Deno.env.get('DESIGN_EMAIL') || SMTP_USER

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (!['checkout.session.completed', 'checkout.session.expired'].includes(event.type)) {
    return new Response('Ignored', { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  const storeName          = session.metadata?.store_name || 'Unknown Store'
  const customerName       = session.metadata?.customer_name || 'Unknown'
  const cabinetColor       = session.metadata?.cabinet_color || ''
  const projectDescription = session.metadata?.project_description || ''
  const amountPaid         = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '$29.00'
  const eventTime          = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  // ── Failed / abandoned payment ────────────────────────────────────────────────
  if (event.type === 'checkout.session.expired') {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:36px 48px;">
      <p style="margin:0;color:#f87171;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">❌ Payment Not Completed</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.02em;">Design Request Abandoned</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${eventTime}</p>
    </div>
    <div style="padding:36px 48px;">
      <p style="margin:0 0 24px;padding:16px 20px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#991b1b;font-size:13px;font-weight:700;">
        This customer initiated a design request but did not complete payment.
      </p>
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
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Session ID</td>
          <td style="padding:8px 0;color:#64748b;font-size:12px;font-family:monospace;">${session.id}</td>
        </tr>
      </table>
    </div>
    <div style="padding:24px 48px;background:#f8fafc;text-align:center;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">No action needed — discard the pending request email for this order.</p>
    </div>
  </div>
</body>
</html>`

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"KitchenUnity" <${SMTP_USER}>`,
        to: DESIGN_EMAIL,
        subject: `❌ Payment Not Completed — ${storeName} / ${customerName}`,
        html,
      })
      console.log(`Abandoned payment email sent for ${storeName} / ${customerName}`)
    } catch (err: any) {
      console.error('Email error:', err)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  const paidAt = eventTime

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:#0f172a;padding:36px 48px;">
      <p style="margin:0;color:#34d399;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">✅ Payment Confirmed</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.02em;">Design Order Paid</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${paidAt} · ${amountPaid} received</p>
    </div>

    <div style="padding:36px 48px;">
      <p style="margin:0 0 24px;padding:16px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;color:#166534;font-size:13px;font-weight:700;">
        Payment verified by Stripe. You can now begin work on this design.
      </p>
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
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Amount</td>
          <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:700;">${amountPaid}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Session ID</td>
          <td style="padding:8px 0;color:#64748b;font-size:12px;font-family:monospace;">${session.id}</td>
        </tr>
      </table>
    </div>

    <div style="padding:24px 48px;background:#f8fafc;text-align:center;">
      <p style="margin:0;color:#cbd5e1;font-size:11px;">Attachments were sent in the initial request email · Deliver within 24 hours</p>
    </div>

  </div>
</body>
</html>`

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    await transporter.sendMail({
      from: `"KitchenUnity" <${SMTP_USER}>`,
      to: DESIGN_EMAIL,
      subject: `✅ Payment Confirmed — ${storeName} / ${customerName}`,
      html,
    })

    console.log(`Payment confirmed email sent for ${storeName} / ${customerName}`)
  } catch (err: any) {
    console.error('Email error:', err)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
