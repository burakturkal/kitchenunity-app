
import React from 'react';
import { CabinetStore } from '../types';
import { Building2, ExternalLink, ShieldCheck, Mail, Calendar, Settings, Users, ArrowRight, Plus } from 'lucide-react';

interface StoreManagerProps {
  stores: CabinetStore[];
  onSelectStore: (store: CabinetStore) => void;
  onProvisionStore?: () => void;
}

const StoreManager: React.FC<StoreManagerProps> = ({ stores, onSelectStore, onProvisionStore }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Managed Tenants</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live Cabinet Store Environments</p>
        </div>
        <button 
          onClick={onProvisionStore}
          className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20"
        >
          Provision New Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stores.map((store) => (
          <div key={store.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
               <Building2 size={150} />
            </div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl flex items-center justify-center shadow-inner">
                <Building2 size={24} />
              </div>
              <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                store.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {store.status}
              </span>
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <h4 className="font-black text-slate-900 text-xl tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-none">{store.name}</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-blue-500 mt-2 font-bold uppercase tracking-widest">
                  <ExternalLink size={12} />
                  <span className="underline underline-offset-4 decoration-blue-200">{store.domain}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan</p>
                    <p className="text-xs font-bold text-slate-700">Enterprise Pro</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Leads</p>
                    <p className="text-xs font-bold text-slate-700">242 Total</p>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Mail size={14} className="text-slate-300" />
                  {store.ownerEmail}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Calendar size={14} className="text-slate-300" />
                  Provisioned {new Date(store.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  onClick={() => onSelectStore(store)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-blue-600 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} /> Enter Store
                </button>
                <button className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder for Adding New Tenant */}
        <button 
          onClick={onProvisionStore}
          className="border-4 border-dashed border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-blue-100 hover:text-blue-200 transition-all bg-slate-50/30 group"
        >
           <div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} />
           </div>
           <span className="text-xs font-black uppercase tracking-widest">Provision Tenant Slot</span>
        </button>
      </div>
    </div>
  );
};

export default StoreManager;
