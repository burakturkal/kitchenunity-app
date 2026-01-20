
import React from 'react';
import { CabinetStore } from '../types';
import { Building2, ExternalLink, ShieldCheck, Mail, Calendar } from 'lucide-react';

interface StoreManagerProps {
  stores: CabinetStore[];
  onSelectStore: (store: CabinetStore) => void;
}

const StoreManager: React.FC<StoreManagerProps> = ({ stores, onSelectStore }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Managed Client Stores</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          Add New Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${
                store.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {store.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{store.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <ExternalLink size={12} />
                  <span className="font-medium underline">{store.domain}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail size={14} className="text-slate-300" />
                  {store.ownerEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={14} className="text-slate-300" />
                  Joined {new Date(store.createdAt).toLocaleDateString()}
                </div>
              </div>

              <button 
                onClick={() => onSelectStore(store)}
                className="w-full mt-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                Manage Leads
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreManager;
