
import React from 'react';
import { Order, Customer } from '../types';
import { DollarSign, User, Clock } from 'lucide-react';

interface OrderKanbanProps {
  orders: Order[];
  customers: Customer[];
  onEdit: (order: Order) => void;
}

const COLUMNS: { status: string; label: string; color: string; bg: string; dot: string }[] = [
  { status: 'Quote',       label: 'Quote',       color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200',   dot: 'bg-slate-400' },
  { status: 'Processing',  label: 'Processing',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  { status: 'Invoiced',    label: 'Invoiced',    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500' },
  { status: 'Shipped',     label: 'Shipped',     color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  { status: 'Completed',   label: 'Completed',   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
];

const OrderKanban: React.FC<OrderKanbanProps> = ({ orders, customers, onEdit }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {COLUMNS.map(col => {
        const colOrders = orders.filter(o => o.status === col.status);
        const colTotal = colOrders.reduce((s, o) => s + o.amount, 0);

        return (
          <div key={col.status} className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div className={`rounded-2xl border px-4 py-3 mb-3 flex items-center justify-between ${col.bg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${col.color}`}>{col.label}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md bg-white/60 ${col.color}`}>{colOrders.length}</span>
              </div>
              {colTotal > 0 && (
                <span className={`text-[10px] font-black ${col.color}`}>${colTotal.toLocaleString()}</span>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {colOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <button
                    key={order.id}
                    onClick={() => onEdit(order)}
                    className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                          <User size={12} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                            {customer ? `${customer.firstName} ${customer.lastName}` : 'Direct Sale'}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">#{order.id.slice(-8)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-1 text-blue-600">
                        <DollarSign size={11} />
                        <span className="text-sm font-black">{order.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {order.lineItems?.length > 0 && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide border-t border-slate-50 pt-2">
                        {order.lineItems.length} line item{order.lineItems.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                );
              })}

              {colOrders.length === 0 && (
                <div className="border-2 border-dashed border-slate-100 rounded-2xl py-8 text-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderKanban;
