// quickbooksData.ts
// Express-style endpoints for pulling/pushing QuickBooks data

import express from 'express';
import { getQuickBooksData, pushQuickBooksData } from './services/quickbooks.service';
import { db } from './services/supabase';

const router = express.Router();

// Store tokens per store/customer (mock)
// No longer needed: tokens are stored in Supabase

router.get('/quickbooks/:realmId/:resource', async (req, res) => {
  const { realmId, resource } = req.params;
  const tokenData = await db.stores.getQuickBooksToken(realmId);
  const accessToken = tokenData?.access_token;
  try {
    const data = await getQuickBooksData(realmId, accessToken, resource);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Pull failed', details: err });
  }
});

router.post('/quickbooks/:realmId/:resource', async (req, res) => {
  const { realmId, resource } = req.params;
  const tokenData = await db.stores.getQuickBooksToken(realmId);
  const accessToken = tokenData?.access_token;
  const data = req.body;
  try {
    const result = await pushQuickBooksData(realmId, accessToken, resource, data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Push failed', details: err });
  }
});

export default router;
