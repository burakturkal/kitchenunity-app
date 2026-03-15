import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGRyaHZzdGFvbnZjbHVkYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODY3NzQsImV4cCI6MjA4NDQ2Mjc3NH0.UIopiTghepauzs-IKLOa0zZ176JFwO3jbXS8jbeAZG8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const mapToCamel = (item: any) => {
  if (!item) return null;
  const newItem: any = {};
  Object.keys(item).forEach(key => {
    const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
    newItem[camelKey] = item[key];
  });
  return newItem;
};

export const resolveDomainToStoreId = () => {
  const hostname = window.location.hostname || '';
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('web-platform') || hostname.includes('stackblitz') || hostname.includes('github.dev')) {
    return 'store-1';
  }
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www') {
    return parts[0];
  }
  return null;
};

const mapStoreFromDb = (store: any) => {
  const mapped = mapToCamel(store) || {};
  return {
    id: mapped.id,
    name: mapped.name || 'Unnamed Store',
    domain: mapped.storeKey || mapped.domain || '',
    ownerEmail: mapped.ownerEmail || 'owner@kitchenunity.com',
    status: mapped.status || 'active',
    createdAt: mapped.createdAt || new Date().toISOString(),
    salesTax: mapped.salesTax || 0,
    facebookPageId: mapped.facebookPageId || '',
    facebookPageToken: mapped.facebookPageToken || '',
    contactEmail: mapped.contactEmail || '',
    contactPhone: mapped.contactPhone || '',
    website: mapped.website || '',
    replyToEmail: mapped.replyToEmail || '',
    dailyDigestEnabled: mapped.dailyDigestEnabled || false,
    dailyDigestTime: mapped.dailyDigestTime || '17:00',
    dailyDigestStatuses: mapped.dailyDigestStatuses || [],
    timezone: mapped.timezone || 'America/New_York',
  };
};

const mapCustomerFromDb = (customer: any) => {
  const mapped = mapToCamel(customer) || {};
  return {
    id: mapped.id,
    storeId: mapped.storeId,
    firstName: mapped.firstName || '',
    lastName: mapped.lastName || '',
    email: mapped.email || '',
    phone: mapped.phone || '',
    notes: mapped.notes || '',
    createdAt: mapped.createdAt || new Date().toISOString(),
    shippingAddress: {
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    billingDifferent: false
  };
};

const mapClaimFromDb = (claim: any) => {
  const mapped = mapToCamel(claim) || {};
  return {
    id: mapped.id,
    storeId: mapped.storeId,
    customerId: mapped.customerId,
    issue: mapped.issue || '',
    status: mapped.status || 'Open',
    createdAt: mapped.createdAt || new Date().toISOString(),
    notes: mapped.notes || ''
  };
};

const mapLeadFromDb = (lead: any) => {
  const mapped = mapToCamel(lead) || {};
  const nameParts = (mapped.name || '').trim().split(' ').filter(Boolean);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ');
  return {
    id: mapped.id,
    storeId: mapped.storeId,
    firstName,
    lastName,
    phone: mapped.phone || '',
    email: mapped.email || '',
    message: mapped.message || '',
    source: mapped.source || '',
    createdAt: mapped.createdAt || new Date().toISOString(),
    updatedAt: mapped.updatedAt || mapped.createdAt || new Date().toISOString(),
    status: mapped.status || 'New'
  };
};

export const db = {
  stores: {
    async list() {
      const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapStoreFromDb);
    },
    async create(store: any) {
      const { data, error } = await supabase.from('stores').insert([{
        name: store.name,
        store_key: store.domain || store.storeKey
      }]).select();
      if (error) throw error;
      return mapStoreFromDb(data[0]);
    },
    async update(id: string, store: any) {
      const payload: any = {}
      if (store.name !== undefined) payload.name = store.name
      if (store.domain !== undefined || store.storeKey !== undefined) payload.store_key = store.domain || store.storeKey
      if (store.salesTax !== undefined) payload.sales_tax = store.salesTax
      if (store.facebookPageId !== undefined) payload.facebook_page_id = store.facebookPageId
      if (store.facebookPageToken !== undefined) payload.facebook_page_token = store.facebookPageToken
      if (store.contactEmail !== undefined) payload.contact_email = store.contactEmail
      if (store.contactPhone !== undefined) payload.contact_phone = store.contactPhone
      if (store.website !== undefined) payload.website = store.website
      if (store.replyToEmail !== undefined) payload.reply_to_email = store.replyToEmail
      if (store.dailyDigestEnabled !== undefined) payload.daily_digest_enabled = store.dailyDigestEnabled
      if (store.dailyDigestTime !== undefined) payload.daily_digest_time = store.dailyDigestTime
      if (store.dailyDigestStatuses !== undefined) payload.daily_digest_statuses = store.dailyDigestStatuses
      if (store.timezone !== undefined) payload.timezone = store.timezone
      const { error } = await supabase.from('stores').update(payload).eq('id', id);
      if (error) throw error;
    },

    async delete(id: string) {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
    }
  },
  leads: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Security Violation: Store context missing.");
      let query = supabase.from('leads').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapLeadFromDb);
    },
    async create(lead: any) {
      const payload: any = {
        store_id: lead.storeId,
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
      };
      if (lead.createdAt) payload.created_at = lead.createdAt;
      const { data, error } = await supabase.from('leads').insert([payload]).select();
      if (error) throw error;
      return mapLeadFromDb(data[0]);
    },
    async update(id: string, lead: any) {
      const { error } = await supabase.from('leads').update({
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    }
  },
  profiles: {
    async getById(id: string) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return mapToCamel(data);
    },
    async upsert(profile: { id: string; storeId?: string; role: string }) {
      const { data, error } = await supabase.from('profiles').upsert({
        id: profile.id,
        store_id: profile.storeId || null,
        role: profile.role
      }, { onConflict: 'id' }).select();
      if (error) throw error;
      return mapToCamel(data?.[0]);
    },
    async listByRole(role: string) {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', role).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    }
  },
  inviteRequests: {
    async create(payload: { email: string; storeId: string; requestedRole: string }) {
      const { data, error } = await supabase.from('invite_requests').insert({
        email: payload.email.toLowerCase(),
        store_id: payload.storeId,
        requested_role: payload.requestedRole
      }).select();
      if (error) throw error;
      return mapToCamel(data?.[0]);
    },
    async listPending() {
      const { data, error } = await supabase.from('invite_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    async approve(id: string) {
      const { error } = await supabase.from('invite_requests').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
    },
    async getApprovedByEmail(email: string) {
      const { data, error } = await supabase.from('invite_requests').select('*').eq('email', email.toLowerCase()).eq('status', 'approved').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return mapToCamel(data);
    }
  },
  customers: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Unauthorized: Tenant ID required.");
      let query = supabase.from('customers').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapCustomerFromDb);
    },
    async create(customer: any) {
      const { data, error } = await supabase.from('customers').insert([{
        store_id: customer.storeId,
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        shipping_address: customer.shippingAddress,
        billing_address: customer.billingAddress
      }]).select();
      if (error) throw error;
      return mapCustomerFromDb(data[0]);
    },
    async update(id: string, customer: any) {
      const { error } = await supabase.from('customers').update({
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        shipping_address: customer.shippingAddress,
        billing_address: customer.billingAddress
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    }
  },
  claims: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Tenant ID required.");
      let query = supabase.from('claims').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapClaimFromDb);
    },
    async create(claim: any) {
      const { data, error } = await supabase.from('claims').insert([{
        store_id: claim.storeId,
        customer_id: claim.customerId,
        issue: claim.issue,
        status: claim.status
      }]).select();
      if (error) throw error;
      return mapClaimFromDb(data[0]);
    },
    async update(id: string, claim: any) {
      const { error } = await supabase.from('claims').update({
        customer_id: claim.customerId,
        issue: claim.issue,
        status: claim.status
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('claims').delete().eq('id', id);
      if (error) throw error;
    }
  },
  planner: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Tenant context missing.");
      let query = supabase.from('planner_events').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    async create(event: any) {
      const { data, error } = await supabase.from('planner_events').insert([{
        store_id: event.storeId,
        type: event.type,
        customer_id: event.customerId,
        customer_name: event.customerName,
        date: event.date,
        time: event.time,
        address: event.address,
        notes: event.notes,
        status: event.status
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    async update(id: string, event: any) {
      const { error } = await supabase.from('planner_events').update({
        type: event.type,
        date: event.date,
        time: event.time,
        address: event.address,
        notes: event.notes,
        status: event.status,
        customer_id: event.customerId,
        customer_name: event.customerName
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('planner_events').delete().eq('id', id);
      if (error) throw error;
    }
  },
  orders: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Tenant context missing.");
      let query = supabase.from('orders').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    async create(order: any) {
      console.log('[supabase.ts] Payload sent to orders.create:', order);
      console.log('[supabase.ts] order.taxRate =', order.taxRate);
      const { data, error } = await supabase.from('orders').insert([{
        store_id: order.storeId,
        customer_id: order.customerId,
        amount: order.amount,
        status: order.status,
        tracking_number: order.trackingNumber,
        line_items: order.lineItems,
        tax_rate: order.taxRate,
        is_non_taxable: order.isNonTaxable,
        notes: order.notes,
        attachments: order.attachments,
        expenses: order.expenses
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    async update(id: string, order: any) {
      console.log('[supabase.ts] Payload sent to orders.update:', order);
      console.log('[supabase.ts] order.taxRate =', order.taxRate);
      const { error } = await supabase.from('orders').update({
        customer_id: order.customerId,
        amount: order.amount,
        status: order.status,
        tracking_number: order.trackingNumber,
        line_items: order.lineItems,
        tax_rate: order.taxRate,
        is_non_taxable: order.isNonTaxable,
        notes: order.notes,
        attachments: order.attachments,
        expenses: order.expenses
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    }
  },
  inventory: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Tenant context missing.");
      let query = supabase.from('inventory').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    async create(item: any) {
      const { data, error } = await supabase.from('inventory').insert([{
        store_id: item.storeId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        track_stock: item.trackStock,
        description: item.description
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    async update(id: string, item: any) {
      const { error } = await supabase.from('inventory').update({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        track_stock: item.trackStock,
        description: item.description
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
    }
  },
};
