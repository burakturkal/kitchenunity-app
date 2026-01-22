
import { supabase, mapToCamel } from './supabase';
import { Customer } from '../types';

/**
 * CUSTOMERS SERVICE
 * Canonical service layer for tenant customer management.
 */
export const customersService = {
  async list(storeId: string): Promise<Customer[]> {
    if (!storeId) throw new Error("Unauthorized: Tenant ID required.");
    
    let query = supabase.from('customers').select('*');
    if (storeId !== 'all') {
      query = query.eq('store_id', storeId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapToCamel);
  },

  async create(customer: Partial<Customer>, storeId: string): Promise<Customer> {
    if (!storeId || storeId === 'all') throw new Error("Invalid Store ID for creation.");
    
    const { data, error } = await supabase.from('customers').insert([{
      store_id: storeId,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      shipping_address: customer.shippingAddress
    }]).select();
    
    if (error) throw error;
    return mapToCamel(data[0]);
  },

  async update(id: string, customer: Partial<Customer>): Promise<void> {
    const { error } = await supabase.from('customers').update({
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      shipping_address: customer.shippingAddress
    }).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  }
};
