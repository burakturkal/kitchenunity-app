
import { supabase, mapToCamel } from './supabase';
import { Lead } from '../types';

/**
 * LEADS SERVICE
 * Hardened multi-tenant access layer. No silent fallbacks to mock data.
 */
export const leadsService = {
  async list(storeId: string): Promise<Lead[]> {
    if (!storeId) throw new Error("Security Violation: Store context missing.");
    
    let query = supabase.from('leads').select('*');
    if (storeId !== 'all') {
      query = query.eq('store_id', storeId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      // Production Rule: Fail loudly to trigger UI error boundaries
      console.error("[LeadsService] Fetch Failure:", error);
      throw error; 
    }
    return (data || []).map(mapToCamel);
  },

  async create(lead: Partial<Lead>, storeId: string): Promise<Lead> {
    if (!storeId || storeId === 'all') throw new Error("Tenant Write Violation.");
    
    const { data, error } = await supabase.from('leads').insert([{
      store_id: storeId,
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

  async update(id: string, lead: Partial<Lead>): Promise<void> {
    const { error } = await supabase.from('leads').update({
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      status: lead.status
    }).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  }
};
