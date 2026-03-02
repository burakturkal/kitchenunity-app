// quickbooksWebhook.ts
// Express endpoint for QuickBooks webhooks (real-time sync)

import express from 'express';
import { db } from './services/supabase';
// TODO: Add logic to process webhook events and update your app DB

const router = express.Router();

router.post('/quickbooks/webhook', async (req, res) => {
  const event = req.body;
  // Example event structure: { realmId, eventNotifications: [...] }
  try {
    // Find store by realmId
    const storeId = event.realmId;
    // Process each event notification
    for (const notification of event.eventNotifications || []) {
      for (const entity of notification.dataChangeEvent.entities || []) {
        // entity.name (e.g., 'Customer'), entity.id, entity.operation (Create/Update/Delete)
        // TODO: Pull updated data from QuickBooks and update your app DB
        // await syncEntity(storeId, entity.name, entity.id, entity.operation);
      }
    }
    res.status(200).send('Webhook received');
  } catch (err) {
    res.status(500).json({ error: 'Webhook processing failed', details: err });
  }
});

export default router;
