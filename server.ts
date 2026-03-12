// server.ts
// Main Express server entry point

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_in95qOxRG0FXiOVUHrGF_g_LL7uwRYi';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// In-memory rate limiter: storeId -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// CORS for embed endpoints — must accept requests from any website
function embedCors(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  next();
}

// ─── Receive lead form submissions from embedded widgets ──────────────────
app.post('/api/embed/submit', embedCors, async (req: express.Request, res: express.Response) => {
  try {
    const body = req.body || {};
    const { storeId, _hp, source, ...fields } = body;

    // Honeypot: bots fill this hidden field, real users never touch it
    if (_hp) { res.json({ ok: true }); return; }

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ error: 'Missing store identifier.' });
      return;
    }

    // Rate limit: max 10 submissions per store per 10 minutes
    const now = Date.now();
    const entry = rateLimitMap.get(storeId);
    if (entry && now < entry.resetAt) {
      if (entry.count >= 10) {
        res.status(429).json({ error: 'Too many submissions. Please try again later.' });
        return;
      }
      entry.count++;
    } else {
      rateLimitMap.set(storeId, { count: 1, resetAt: now + 600_000 });
    }

    // Validate storeId exists in the stores table
    const { data: store, error: storeErr } = await sb
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .maybeSingle();

    if (storeErr || !store) {
      res.status(403).json({ error: 'Invalid store.' });
      return;
    }

    // Flexible field mapping — accept whatever the form sends
    const firstName = String(fields.firstName || fields.first_name || '').trim();
    const lastName  = String(fields.lastName  || fields.last_name  || '').trim();
    const email     = String(fields.email     || '').trim().toLowerCase();
    const phone     = String(fields.phone     || '').trim();
    const message   = String(fields.message   || fields.textarea || fields.notes || '').trim();
    const name      = fields.name ? String(fields.name).trim() : `${firstName} ${lastName}`.trim();

    if (!name && !email && !phone) {
      res.status(400).json({ error: 'Please provide at least a name, email, or phone.' });
      return;
    }

    // Duplicate detection: same email + store within 1 hour
    if (email) {
      const { data: dup } = await sb
        .from('leads')
        .select('id')
        .eq('store_id', storeId)
        .eq('email', email)
        .gte('created_at', new Date(now - 3_600_000).toISOString())
        .maybeSingle();
      if (dup) { res.json({ ok: true }); return; }
    }

    const { error: insertErr } = await sb.from('leads').insert({
      store_id: storeId,
      name:     name || null,
      email:    email || null,
      phone:    phone || null,
      message:  message || null,
      source:   'Embedded Form',
      status:   'New',
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

// Export the Express app for serverless adapters (do not call listen here)
export default app;
