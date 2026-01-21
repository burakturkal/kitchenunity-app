
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ffhdrhvstaonvcludbgn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_in95qOxRG0FXiOVUHrGF_g_LL7uwRYi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const mapToCamel = (item: any) => {
  if (!item) return null;
  const newItem: any = {};
  Object.keys(item).forEach(key => {
    const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
    newItem[camelKey] = item[key];
  });
  return newItem;
};

export const getCurrentStoreId = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname.includes('web-platform') || hostname.includes('stackblitz')) return 'store-1';
  return hostname.split('.')[0];
};

export const db = {
  leads: {
    list: async (storeId: string) => {
      const { data, error } = await supabase.from('leads').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    create: async (lead: any) => {
      const { data, error } = await supabase.from('leads').insert([{
        store_id: lead.storeId,
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        source: lead.source,
        status: lead.status
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    update: async (id: string, lead: any) => {
      const { error } = await supabase.from('leads').update({
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status
      }).eq('id', id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    }
  },
  customers: {
    list: async (storeId: string) => {
      const { data, error } = await supabase.from('customers').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    create: async (customer: any) => {
      const { data, error } = await supabase.from('customers').insert([{
        store_id: customer.storeId,
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        shipping_address: customer.shippingAddress
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    update: async (id: string, customer: any) => {
      const { error } = await supabase.from('customers').update({
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        shipping_address: customer.shippingAddress
      }).eq('id', id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    }
  },
  planner: {
    list: async (storeId: string) => {
      const { data, error } = await supabase.from('planner_events').select('*').eq('store_id', storeId);
      if (error) throw error;
      return (data || []).map(mapToCamel);
    },
    create: async (event: any) => {
      const { data, error } = await supabase.from('planner_events').insert([{
        store_id: event.storeId,
        type: event.type,
        customer_name: event.customerName,
        date: event.date,
        address: event.address,
        status: event.status
      }]).select();
      if (error) throw error;
      return mapToCamel(data[0]);
    },
    update: async (id: string, event: any) => {
      const { error } = await supabase.from('planner_events').update({
        type: event.type,
        customer_name: event.customerName,
        date: event.date,
        address: event.address,
        status: event.status
      }).eq('id', id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('planner_events').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
