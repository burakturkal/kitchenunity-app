
import React, { useState } from 'react';
import { Customer, Order, PlannerEvent, Claim, ClaimStatus } from '../types';
import {
  ArrowLeft, Mail, Phone, MapPin, Package, Calendar,
  AlertTriangle, Edit2, Plus, DollarSign, Clock, User
} from 'lucide-react';

interface CustomerProfileProps {
  customer: Customer;
  orders: Order[];
  events: PlannerEvent[];
  claims: Claim[];
  onBack: () => void;
  onEdit: () => void;
  onNewOrder: () => void;
  onNewEvent: () => void;
  onNewClaim: () => void;
}

const TABS = ['Overview', 'Orders', 'Appointments', 'Claims'] as const;
type Tab = typeof TABS[number];

const statusColor = (status: string) => {
  if (['Completed', 'Resolved', 'Delivered'].includes(status)) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (['Open', 'Processing', 'Scheduled'].includes(status)) return 'bg-blue-50 text-blue-600 border-blue-100';
  if (['In Progress', 'Shipped'].includes(status)) return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer, orders, events, claims, onBack, onEdit, onNewOrder, onNewEvent, onNewClaim
}) => {
  const [tab, setTab] = useState<Tab>('Overview');

  const custOrders = orders.filter(o => o.customerId === customer.id);
  const custEvents = events.filter(e => e.customerId === customer.id);
  const custClaims = claims.filter(c => c.customerId === customer.id);

  const totalSpend = custOrders.reduce((s, o) => s + o.amount, 0);
  const openClaims = custClaims.filter(c => c.status !== ClaimStatus.RESOLVED).length;
  const nextEvent = custEvents
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Customers
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-10 py-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[20px] bg-blue-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30">
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter">
                {customer.firstName} {customer.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors text-xs font-bold">
                  <Mail size={12} /> {customer.email}
                </a>
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors text-xs font-bold">
                    <Phone size={12} /> {customer.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
          <div className="px-8 py-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Spend</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">${totalSpend.toLocaleString()}</p>
          </div>
          <div className="px-8 py-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Orders</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{custOrders.length}</p>
          </div>
          <div className="px-8 py-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Open Claims</p>
            <p className={`text-xl font-black mt-0.5 ${openClaims > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{openClaims}</p>
          </div>
          <div className="px-8 py-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Next Appointment</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {nextEvent
                ? new Date(nextEvent.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : <span className="text-slate-400">—</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-2xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {t}
            {t === 'Orders' && custOrders.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md text-[8px]">{custOrders.length}</span>
            )}
            {t === 'Claims' && openClaims > 0 && (
              <span className="ml-1.5 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md text-[8px]">{openClaims}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <User size={12} /> Contact Information
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email</p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{customer.email}</p>
              </div>
              {customer.phone && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.phone}</p>
                </div>
              )}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Customer Since</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              {customer.notes && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Notes</p>
                  <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MapPin size={12} /> Shipping Address
            </h4>
            {customer.shippingAddress?.address1 ? (
              <div className="text-sm text-slate-700 space-y-1">
                <p className="font-bold">{customer.shippingAddress.address1}</p>
                {customer.shippingAddress.address2 && <p>{customer.shippingAddress.address2}</p>}
                <p>{customer.shippingAddress.city}, {customer.shippingAddress.state} {customer.shippingAddress.zip}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-bold">No address on file</p>
            )}

            {/* Recent activity summary */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Recent Activity</h4>
              {custOrders.slice(0, 2).map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Package size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Order #{o.id.slice(-6)}</span>
                  </div>
                  <span className="text-xs font-black text-blue-600">${o.amount.toFixed(2)}</span>
                </div>
              ))}
              {custOrders.length === 0 && (
                <p className="text-xs text-slate-400 font-bold">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'Orders' && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order History</h4>
            <button onClick={onNewOrder} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
              <Plus size={12} /> New Order
            </button>
          </div>
          {custOrders.length > 0 ? (
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-8 py-4">Order ID</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {custOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 text-xs font-mono text-slate-400">#{o.id.slice(-8)}</td>
                    <td className="px-8 py-4 text-sm font-black text-blue-600">${o.amount.toFixed(2)}</td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${statusColor(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="px-8 py-4 text-xs text-slate-500 font-medium">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-400">No orders yet</div>
          )}
        </div>
      )}

      {tab === 'Appointments' && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Appointments</h4>
            <button onClick={onNewEvent} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
              <Plus size={12} /> Schedule
            </button>
          </div>
          {custEvents.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {custEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                <div key={e.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <Calendar size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{e.type}</p>
                      <p className="text-xs text-slate-500 font-medium">{e.address || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">
                      {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor(e.status)}`}>{e.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-400">No appointments scheduled</div>
          )}
        </div>
      )}

      {tab === 'Claims' && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Claims</h4>
            <button onClick={onNewClaim} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
              <Plus size={12} /> New Claim
            </button>
          </div>
          {custClaims.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {custClaims.map(c => (
                <div key={c.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={16} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">#{c.id.slice(-6)}</p>
                      <p className="text-xs text-slate-500 font-medium max-w-xs truncate">{c.issue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${statusColor(c.status)}`}>{c.status}</span>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-400">No claims on record</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
