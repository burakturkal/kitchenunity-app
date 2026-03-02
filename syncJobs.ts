// syncJobs.ts
// Scheduled sync jobs for QuickBooks data

import { stores } from './services/supabase';
import { getQuickBooksData, pushQuickBooksData } from './services/quickbooks.service';

// List of resources to sync
const resources = [
  'customer',
  'vendor',
  'item',
  'invoice',
  'payment',
  'salesreceipt',
  'bill',
  'purchase',
  'account',
  'employee',
  'journalentry'
];

export async function syncAllStores() {
  // Get all stores
  const allStores = await stores.list();
  for (const store of allStores) {
    const tokenData = await stores.getQuickBooksToken(store.id);
    if (!tokenData) continue;
    for (const resource of resources) {
      try {
        // Pull data from QuickBooks
        const qbData = await getQuickBooksData(store.id, tokenData.access_token, resource);
        // TODO: Push data to your app DB
        // await pushToAppDb(store.id, resource, qbData);
      } catch (err) {
        console.error(`Sync failed for store ${store.id}, resource ${resource}:`, err);
      }
    }
  }
}

// Example: schedule sync every hour
setInterval(syncAllStores, 60 * 60 * 1000); // 1 hour
