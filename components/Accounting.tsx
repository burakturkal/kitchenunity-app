
import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  FileSpreadsheet, 
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface AccountingProps {
  orders: Order[];
}

const Accounting: React.FC<AccountingProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Financial Summary Aggregates
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + o.amount, 0);
    const receivables = orders.filter(o => o.status === 'Shipped' || o.status === 'Invoiced').reduce((sum, o) => sum + o.amount, 0);
    const completed = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.amount, 0);
    const estimatedTax = orders.filter(o => !o.isNonTaxable).reduce((sum, o) => sum + (o.amount * (o.taxRate || 8.25) / 100), 0);

    return { totalRev, receivables, completed, estimatedTax };
  }, [orders]);

  const filteredOrders = orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Enterprise Ledger</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Financial reconciliation & tax auditing</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
            <Download size={16} /> Print PDF
          </button>
        </div>
      </div>

      {/* Financial Health Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[32px] border-b-4 border-blue-600 shadow-sm relative overflow-hidden group">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gross Revenue</p>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">${stats.totalRev.toLocaleString()}</h4>
              <div className="mt-4 flex items-center gap-1 text-emerald-500 font-bold text-xs">
                 <ArrowUpRight size={14} /> +12.5% vs Last Period
              </div>
           </div>
           <DollarSign className="absolute -right-4 -bottom-4 text-blue-50 opacity-50 group-hover:scale-110 transition-transform" size={100} />
        </div>

        <div className="bg-white p-8 rounded-[32px] border-b-4 border-amber-500 shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accounts Receivable</p>
           <h4 className="text-3xl font-black text-slate-900 tracking-tighter">${stats.receivables.toLocaleString()}</h4>
           <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase">Pending Fulfillment</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border-b-4 border-emerald-600 shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cleared / Paid</p>
           <h4 className="text-3xl font-black text-slate-900 tracking-tighter">${stats.completed.toLocaleString()}</h4>
           <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
              <CheckCircle2 size={12} /> Reconciled
           </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border-b-4 border-indigo-600 shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Tax Liability</p>
           <h4 className="text-3xl font-black text-slate-900 tracking-tighter">${stats.estimatedTax.toLocaleString()}</h4>
           <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase">Accrued Tax Sales</p>
        </div>
      </div>

      {/* Unified Transaction Ledger */}
      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
         <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">General Ledger View</h4>
            <div className="flex gap-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search ledger ID..." 
                   className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none w-64"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
                 <Filter size={18} />
               </button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <tr>
                     <th className="px-10 py-5">Tx ID</th>
                     <th className="px-10 py-5">Description</th>
                     <th className="px-10 py-5">Status</th>
                     <th className="px-10 py-5 text-right">Debit</th>
                     <th className="px-10 py-5 text-right">Credit</th>
                     <th className="px-10 py-5 text-center">Tax Info</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-10 py-5 text-xs font-mono text-slate-400">#{o.id.slice(-8)}</td>
                       <td className="px-10 py-5">
                          <p className="text-sm font-bold text-slate-800">Sales Order Fulfillment</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleDateString()}</p>
                       </td>
                       <td className="px-10 py-5">
                          <div className="flex items-center gap-2">
                             {o.status === 'Completed' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-amber-500" />}
                             <span className={`text-[10px] font-black uppercase ${o.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {o.status === 'Completed' ? 'Paid' : 'Unpaid'}
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-5 text-right font-mono text-rose-500 text-xs">$0.00</td>
                       <td className="px-10 py-5 text-right font-black text-slate-900 text-sm tabular-nums">${o.amount.toFixed(2)}</td>
                       <td className="px-10 py-5 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${o.isNonTaxable ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                             {o.isNonTaxable ? 'EXEMPT' : `${o.taxRate || 8.25}% VAT`}
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {filteredOrders.length === 0 && (
           <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No matching transactions found in the ledger.</div>
         )}
      </div>
    </div>
  );
};

export default Accounting;
