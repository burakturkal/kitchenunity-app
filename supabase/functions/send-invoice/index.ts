import nodemailer from 'npm:nodemailer@6'

const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? ''
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') ?? '465')
const SMTP_USER = Deno.env.get('SMTP_USER') ?? ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  const { to, toName, replyTo, storeName, orderId, orderStatus, orderDate, lineItems, taxRate, isNonTaxable, amount, notes } = body

  if (!to || !orderId) {
    return new Response('Missing required fields: to, orderId', { status: 400, headers: corsHeaders })
  }

  const shortId = String(orderId).slice(-8).toUpperCase()
  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const subtotal = Array.isArray(lineItems)
    ? lineItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    : amount

  const taxAmount = isNonTaxable ? 0 : subtotal * ((taxRate || 0) / 100)
  const total = subtotal + taxAmount

  const lineItemsHtml = Array.isArray(lineItems) && lineItems.length > 0
    ? lineItems.map((item: any) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;">${item.productName || item.name || 'Item'}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;text-align:right;">$${Number(item.price).toFixed(2)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-weight:bold;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="padding:10px 16px;color:#94a3b8;text-align:center;">No line items</td></tr>`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0f172a;padding:40px 48px;">
      <p style="margin:0;color:#60a5fa;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;">${storeName}</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.02em;">${orderStatus === 'Quote' ? 'Quote' : 'Invoice'}</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">#${shortId} &nbsp;·&nbsp; ${formattedDate}</p>
    </div>

    <!-- To -->
    <div style="padding:32px 48px;border-bottom:1px solid #f1f5f9;">
      <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Bill To</p>
      <p style="margin:6px 0 0;color:#1e293b;font-size:16px;font-weight:700;">${toName || to}</p>
      <p style="margin:2px 0 0;color:#64748b;font-size:13px;">${to}</p>
    </div>

    <!-- Line Items -->
    <div style="padding:32px 48px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Item</th>
            <th style="padding:10px 16px;text-align:center;font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Unit Price</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:0 48px 32px;display:flex;justify-content:flex-end;">
      <table style="min-width:240px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;">Subtotal</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">$${subtotal.toFixed(2)}</td>
        </tr>
        ${!isNonTaxable && taxRate ? `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;">Tax (${taxRate}%)</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">$${taxAmount.toFixed(2)}</td>
        </tr>` : ''}
        <tr style="border-top:2px solid #0f172a;">
          <td style="padding:12px 0 6px;color:#0f172a;font-size:15px;font-weight:900;">Total</td>
          <td style="padding:12px 0 6px;color:#2563eb;font-size:18px;font-weight:900;text-align:right;">$${total.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    ${notes ? `
    <!-- Notes -->
    <div style="margin:0 48px 32px;padding:16px 20px;background:#f8fafc;border-radius:10px;border-left:3px solid #e2e8f0;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Notes</p>
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">${notes}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:24px 48px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Questions? Reply to this email and we'll get back to you.</p>
      <p style="margin:6px 0 0;color:#cbd5e1;font-size:11px;">Powered by KitchenUnity</p>
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
      from: `"${storeName}" <${SMTP_USER}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      replyTo: replyTo || undefined,
      subject: `${orderStatus === 'Quote' ? 'Quote' : 'Invoice'} #${shortId} from ${storeName}`,
      html,
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('SMTP error:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
