
import React from 'react';
import { 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { Lead, Order, Claim, Customer } from '../types';

interface DashboardProps {
  leads: Lead[];
  orders: Order[];
  claims: Claim[];
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ leads, orders, claims, customers }) => {
  return (
    <div className="space-y-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'blue' },
          { label: 'Total Customers', value: customers.length, icon: Users, color: 'indigo' },
          { label: 'Total Claims', value: claims.length, icon: AlertTriangle, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
            <p className="text-4xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Leads</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} />
            Live Feed
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone No</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length > 0 ? (
                leads.slice(0, 10).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-4 text-sm font-bold text-blue-600 underline decoration-blue-200 underline-offset-4">{lead.email}</td>
                    <td className="px-8 py-4 text-sm text-slate-600 font-medium">{lead.firstName}</td>
                    <td className="px-8 py-4 text-sm text-slate-600 font-medium">{lead.lastName}</td>
                    <td className="px-8 py-4 text-sm text-slate-500 font-mono">{lead.phone}</td>
                    <td className="px-8 py-4 text-xs text-slate-400 font-bold">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">No leads recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
