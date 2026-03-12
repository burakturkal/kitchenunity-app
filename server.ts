// server.ts
// Main Express server entry point

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

/*
  REQUIRED — run this SQL in your Supabase dashboard once:

  CREATE TABLE embed_tokens (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id    TEXT        NOT NULL,
    token       TEXT        NOT NULL UNIQUE,
    label       TEXT        DEFAULT '',
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX embed_tokens_token_idx    ON embed_tokens(token);
  CREATE INDEX embed_tokens_store_id_idx ON embed_tokens(store_id);
*/

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_in95qOxRG0FXiOVUHrGF_g_LL7uwRYi';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// In-memory rate limiter: token -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// CORS for embed endpoints — must accept requests from any website
function embedCors(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  next();
}

// ─── Serve embeddable widget JS ────────────────────────────────────────────
app.get('/embed/widget.js', (req: express.Request, res: express.Response) => {
  const token = String(req.query.token || '').replace(/[^a-f0-9]/gi, '');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (!token) {
    res.send('console.error("[KU Embed] Token missing from script src.");');
    return;
  }
  res.send(buildWidget(token));
});

// ─── Receive lead form submissions ─────────────────────────────────────────
app.post('/api/embed/submit', embedCors, async (req: express.Request, res: express.Response) => {
  try {
    const { token, firstName, lastName, email, phone, message, _hp } = req.body || {};

    // Honeypot: bots fill this hidden field, real users never see it
    if (_hp) { res.json({ ok: true }); return; }

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Missing token.' });
      return;
    }

    // Rate limit: max 10 submissions per token per 10 minutes
    const now = Date.now();
    const entry = rateLimitMap.get(token);
    if (entry && now < entry.resetAt) {
      if (entry.count >= 10) {
        res.status(429).json({ error: 'Too many submissions. Please try again later.' });
        return;
      }
      entry.count++;
    } else {
      rateLimitMap.set(token, { count: 1, resetAt: now + 600_000 });
    }

    // Validate token against DB
    const { data: tokenRow, error: tokenErr } = await sb
      .from('embed_tokens')
      .select('store_id')
      .eq('token', token)
      .eq('active', true)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      res.status(403).json({ error: 'Invalid or inactive embed token.' });
      return;
    }

    const storeId = tokenRow.store_id;
    const name = `${firstName || ''} ${lastName || ''}`.trim();

    if (!name && !email && !phone) {
      res.status(400).json({ error: 'Please provide at least a name, email, or phone.' });
      return;
    }

    // Duplicate detection: same email submitted for the same store within 1 hour
    if (email) {
      const { data: dup } = await sb
        .from('leads')
        .select('id')
        .eq('store_id', storeId)
        .eq('email', String(email).toLowerCase().trim())
        .gte('created_at', new Date(now - 3_600_000).toISOString())
        .maybeSingle();
      if (dup) { res.json({ ok: true }); return; } // silent accept — no spam info leak
    }

    // Insert the lead
    const { error: insertErr } = await sb.from('leads').insert({
      store_id: storeId,
      name: name || null,
      email: email ? String(email).toLowerCase().trim() : null,
      phone: phone || null,
      message: message || null,
      source: 'Embedded Form',
      status: 'New',
    });

    if (insertErr) {
      console.error('[embed/submit] insert error:', insertErr);
      res.status(500).json({ error: 'Failed to save. Please try again.' });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[embed/submit] unexpected error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Widget JS builder ─────────────────────────────────────────────────────
function buildWidget(token: string): string {
  const safeToken = JSON.stringify(token);
  return `/* KitchenUnity Embedded Lead Form */
(function(){
var T=${safeToken};
var A='https://api.cabopspro.com';
var sc=document.scripts,me=sc[sc.length-1];
var host=document.createElement('div');
me.parentNode.insertBefore(host,me.nextSibling);
var sh=host.attachShadow({mode:'closed'});
var css=
'*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'+
'.w{background:#fff;border-radius:16px;padding:28px 32px;border:1.5px solid #e2e8f0;'+
'box-shadow:0 4px 24px rgba(0,0,0,.07);max-width:520px}'+
'.w h3{font-size:18px;font-weight:800;color:#0f172a;margin-bottom:4px;letter-spacing:-.4px}'+
'.sub{font-size:12px;color:#64748b;margin-bottom:20px}'+
'.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+
'.f{margin-bottom:14px}'+
'.f label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;'+
'letter-spacing:.1em;color:#64748b;margin-bottom:5px}'+
'.f input,.f textarea{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;'+
'font-size:14px;color:#0f172a;outline:none;transition:border-color .15s;background:#f8fafc;font-family:inherit}'+
'.f input:focus,.f textarea:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,.1)}'+
'.f textarea{min-height:88px;resize:vertical}'+
'.hp{position:absolute;left:-9999px;height:0;opacity:0}'+
'.btn{width:100%;padding:13px;background:#1e3a8a;color:#fff;border:none;border-radius:12px;'+
'font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;'+
'cursor:pointer;margin-top:4px;font-family:inherit;transition:background .15s}'+
'.btn:hover{background:#1d4ed8}'+
'.btn:disabled{opacity:.5;cursor:not-allowed}'+
'.msg{margin-top:12px;padding:11px 14px;border-radius:10px;font-size:12px;font-weight:700;display:none}'+
'.ok{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;display:block}'+
'.err{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;display:block}';
sh.innerHTML=
'<style>'+css+'</style>'+
'<form class="w" id="kf" novalidate>'+
'<h3>Get in Touch</h3>'+
'<p class="sub">Fill out the form and we will get back to you shortly.</p>'+
'<div class="hp"><input name="_hp" tabindex="-1" autocomplete="off"></div>'+
'<div class="row">'+
'<div class="f"><label>First Name *</label><input name="fn" placeholder="John" required></div>'+
'<div class="f"><label>Last Name</label><input name="ln" placeholder="Smith"></div>'+
'</div>'+
'<div class="f"><label>Email *</label><input name="em" type="email" placeholder="john@example.com" required></div>'+
'<div class="f"><label>Phone</label><input name="ph" type="tel" placeholder="(555) 000-0000"></div>'+
'<div class="f"><label>Message</label><textarea name="mg" placeholder="Tell us about your project..."></textarea></div>'+
'<button class="btn" type="submit">Send Message</button>'+
'<div class="msg" id="km"></div>'+
'</form>';
var f=sh.getElementById('kf'),m=sh.getElementById('km'),b=sh.querySelector('.btn');
f.addEventListener('submit',function(e){
e.preventDefault();
var fn=f.querySelector('[name=fn]').value.trim();
var ln=f.querySelector('[name=ln]').value.trim();
var em=f.querySelector('[name=em]').value.trim();
var ph=f.querySelector('[name=ph]').value.trim();
var mg=f.querySelector('[name=mg]').value.trim();
var hp=f.querySelector('[name=_hp]').value;
if(!fn||!em){m.className='msg err';m.textContent='Please enter your first name and email.';return;}
b.disabled=true;b.textContent='Sending...';m.className='msg';
fetch(A+'/api/embed/submit',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({token:T,firstName:fn,lastName:ln,email:em,phone:ph,message:mg,_hp:hp})
}).then(function(r){return r.json();}).then(function(d){
if(d.ok){
f.reset();
m.className='msg ok';
m.textContent='Message received! We will be in touch soon.';
b.textContent='Sent!';
setTimeout(function(){b.disabled=false;b.textContent='Send Message';},6000);
}else{
m.className='msg err';
m.textContent=d.error||'Something went wrong. Please try again.';
b.disabled=false;b.textContent='Send Message';
}
}).catch(function(){
m.className='msg err';
m.textContent='Network error. Please check your connection.';
b.disabled=false;b.textContent='Send Message';
});
});
})();`;
}

// Export the Express app for serverless adapters (do not call listen here)
export default app;
