
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Phone, 
  Mail, 
  Eye, 
  Trash2, 
  X, 
  ArrowRightCircle, 
  Edit2,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Lead, LeadStatus, UserRole } from '../types';

interface LeadListProps {
  leads: Lead[];
  role: UserRole;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onEdit: (lead: Lead) => void;
}

const LeadList: React.FC<LeadListProps> = ({ leads, role, onUpdateStatus, onConvert, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.phone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [leads, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Lead Management</h3>
      </div>
      
      {/* Dynamic Filter Interface */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search leads by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
          <Filter size={14} className="text-slate-400 ml-2" />
          <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 gap-1">
             {[
               { value: 'all', label: 'All Leads' },
               { value: LeadStatus.NEW, label: 'New' },
               { value: LeadStatus.QUALIFIED, label: 'Qualified' },
               { value: LeadStatus.CONTACTED, label: 'Contacted' }
             ].map(opt => (
               <button
                 key={opt.value}
                 onClick={() => setStatusFilter(opt.value)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === opt.value ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
               >
                 {opt.label}
               </button>
             ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-4">Inquiry Profile</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Contact Logic</th>
                <th className="px-8 py-4">Created At</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <p className="text-sm font-bold text-slate-800">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Source: {lead.source}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      lead.status === LeadStatus.QUALIFIED ? 'bg-emerald-100 text-emerald-600' :
                      lead.status === LeadStatus.NEW ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                        <Mail size={12} /> {lead.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <Phone size={12} /> {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs text-slate-400 font-bold">
                    {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <button onClick={() => onConvert(lead)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors" title="Convert to Customer"><ArrowRightCircle size={18} /></button>
                       <button onClick={() => setSelectedLead(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="View Detail"><Eye size={18} /></button>
                       <button onClick={() => onEdit(lead)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors" title="Edit Record"><Edit2 size={18} /></button>
                       {role === UserRole.ADMIN && <button onClick={() => onDelete(lead.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Delete Permanent"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Search size={32} strokeWidth={1} />
               </div>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">No leads match your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-end animate-in fade-in duration-300">
          <div className="w-[500px] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="p-10 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{selectedLead.firstName} {selectedLead.lastName}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Record ID: {selectedLead.id}</p>
              </div>
              <button onClick={() => { setSelectedLead(null); }} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-10">
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-blue-500" />
                    Project Vision / Message
                  </label>
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] text-sm text-slate-700 italic leading-relaxed shadow-inner">
                    "{selectedLead.message}"
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                       <Mail size={18} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Contact Email</label>
                      <p className="text-sm font-bold text-slate-800">{selectedLead.email}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                       <Phone size={18} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Contact Phone</label>
                      <p className="text-sm font-bold text-slate-800">{selectedLead.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-10 border-t border-slate-100 flex flex-col gap-3">
                 <button onClick={() => onConvert(selectedLead)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                    <ArrowRightCircle size={18} /> Convert to Active Customer
                 </button>
                 <button onClick={() => onEdit(selectedLead)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                    <Edit2 size={18} /> Modify Record
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;
