
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase keys from the dashboard
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapping utility to convert DB snake_case to Frontend camelCase
const mapToCamel = (item: any) => {
  if (!item) return null;
  const newItem: any = {};
  Object.keys(item).forEach(key => {
    const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
    newItem[camelKey] = item[key];
  });
  return newItem;
};

// Helper to get the current store based on subdomain
export const getCurrentStoreId = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname.includes('web-platform')) return 'store-1';
  return hostname.split('.')[0];
};

export const db = {
  leads: {
    list: async (storeId: string) => {
      const { data } = await supabase.from('leads').select('*').eq('store_id', storeId);
      return (data || []).map(mapToCamel);
    },
    create: async (lead: any) => {
      const dbLead = {
        store_id: lead.storeId,
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        source: lead.source,
        status: lead.status
      };
      return await supabase.from('leads').insert([dbLead]);
    }
  },
  customers: {
    list: async (storeId: string) => {
      const { data } = await supabase.from('customers').select('*').eq('store_id', storeId);
      return (data || []).map(mapToCamel);
    },
    create: async (customer: any) => {
      const dbCustomer = {
        store_id: customer.storeId,
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        shipping_address: customer.shippingAddress
      };
      return await supabase.from('customers').insert([dbCustomer]);
    }
  },
  planner: {
    list: async (storeId: string) => {
      const { data } = await supabase.from('planner_events').select('*').eq('store_id', storeId);
      return (data || []).map(mapToCamel);
    },
    create: async (event: any) => {
      const dbEvent = {
        store_id: event.storeId,
        type: event.type,
        customer_name: event.customerName,
        date: event.date,
        address: event.address,
        status: event.status
      };
      return await supabase.from('planner_events').insert([dbEvent]);
    }
  }
};
