
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_in95qOxRG0FXiOVUHrGF_g_LL7uwRYi';

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

export const db = {
  stores: {
    async list() {
      const { data, error } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    async create(store: any) {
      const { data, error } = await supabase.from('stores').insert([{
        name: store.name,
        store_key: store.domain || store.storeKey
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    async update(id: string, store: any) {
      const { error } = await supabase.from('stores').update({
        name: store.name,
        store_key: store.domain || store.storeKey
      }).eq('id', id);
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
      return (data || []).map(mapToCamel);
    },
    async create(lead: any) {
      const { data, error } = await supabase.from('leads').insert([{
        store_id: lead.storeId,
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        source: lead.source,
        status: lead.status
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    async update(id: string, lead: any) {
      const { error } = await supabase.from('leads').update({
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        message: lead.message,
        source: lead.source
      }).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    }
  },
  customers: {
    async list(storeId: string) {
      if (!storeId) throw new Error("Unauthorized: Tenant ID required.");
      let query = supabase.from('customers').select('*');
      if (storeId !== 'all') query = query.eq('store_id', storeId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    async create(customer: any) {
      const { data, error } = await supabase.from('customers').insert([{
        store_id: customer.storeId,
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    async update(id: string, customer: any) {
      const { error } = await supabase.from('customers').update({
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes
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
      return (data || []).map(mapToCamel);
    },
    async create(claim: any) {
      const { data, error } = await supabase.from('claims').insert([{
        store_id: claim.storeId,
        customer_id: claim.customerId,
        issue: claim.issue,
        status: claim.status
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
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
  }/*,
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
  }*/
};
