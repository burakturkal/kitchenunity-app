// quickbooksAuth.ts
// Express-style backend endpoints for QuickBooks OAuth and token management

import express from 'express';
import { exchangeCodeForToken, refreshToken } from './services/quickbooks.service';
import { db } from './services/supabase';

const router = express.Router();

// Store tokens per store/customer (mock)
// No longer needed: tokens are stored in Supabase

// QuickBooks App Info API
router.get('/quickbooks/app-info', async (req, res) => {
  try {
    const appInfo = await db.quickbooksAppSettings.get();
    res.json({ success: true, appInfo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch app info', details: err });
  }
});

router.post('/quickbooks/app-info', async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;
    const saved = await db.quickbooksAppSettings.save({ clientId, clientSecret, redirectUri });
    res.json({ success: true, appInfo: saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save app info', details: err });
  }
});


router.get('/quickbooks/callback', async (req, res) => {
  const { code, realmId } = req.query;
  try {
    const appInfo = await db.quickbooksAppSettings.get();
    if (!appInfo) throw new Error('QuickBooks app credentials not found');
    const { client_id, client_secret, redirect_uri } = appInfo;
    const tokenData = await exchangeCodeForToken(
      code as string,
      redirect_uri,
      client_id,
      client_secret
    );
    await db.stores.saveQuickBooksToken(realmId as string, tokenData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'OAuth failed', details: err });
  }
});


router.post('/quickbooks/refresh', async (req, res) => {
  const { realmId } = req.body;
  try {
    const appInfo = await db.quickbooksAppSettings.get();
    if (!appInfo) throw new Error('QuickBooks app credentials not found');
    const { client_id, client_secret } = appInfo;
    const tokenData = await db.stores.getQuickBooksToken(realmId);
    const refresh_token = tokenData?.refresh_token;
    const newTokenData = await refreshToken(
      refresh_token,
      client_id,
      client_secret
    );
    await db.stores.saveQuickBooksToken(realmId, newTokenData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed', details: err });
  }
});

export default router;
