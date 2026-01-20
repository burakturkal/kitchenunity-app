import React, { useState } from 'react';
import { 
  Search, 
  Phone, 
  Mail, 
  Eye, 
  Trash2, 
  X, 
  ArrowRightCircle, 
  Edit2 
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(l => 
    l.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Lead Management</h3>
      </div>
      
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search leads by any details" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
            />
          </div>
          <button className="px-6 py-2 border border-slate-200 rounded-lg text-xs font-black uppercase text-slate-400">Filter</button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-200/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Email</th>
                <th className="px-8 py-4">First Name</th>
                <th className="px-8 py-4">Last Name</th>
                <th className="px-8 py-4">Phone No</th>
                <th className="px-8 py-4">Created At</th>
                <th className="px-8 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 text-sm font-bold text-blue-600">{lead.email}</td>
                  <td className="px-8 py-4 text-sm text-slate-700 font-bold">{lead.firstName}</td>
                  <td className="px-8 py-4 text-sm text-slate-700 font-bold">{lead.lastName}</td>
                  <td className="px-8 py-4 text-sm text-slate-500 font-mono">{lead.phone}</td>
                  <td className="px-8 py-4 text-xs text-slate-400 font-bold">{new Date(lead.createdAt).toLocaleString()}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                       <button onClick={() => onConvert(lead)} className="p-1 text-yellow-500 hover:bg-yellow-50 rounded" title="Convert"><ArrowRightCircle size={18} /></button>
                       <button onClick={() => setSelectedLead(lead)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye size={18} /></button>
                       <button onClick={() => onEdit(lead)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded" title="Edit"><Edit2 size={18} /></button>
                       {role === UserRole.ADMIN && <button onClick={() => onDelete(lead.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="Delete"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in duration-300">
          <div className="w-[450px] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-10 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{selectedLead.firstName} {selectedLead.lastName}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Record: {selectedLead.id}</p>
              </div>
              <button onClick={() => { setSelectedLead(null); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400"><X size={20} /></button>
            </div>

            <div className="p-10 space-y-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lead Message</label>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] text-sm text-slate-600 italic leading-relaxed">
                    "{selectedLead.message}"
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact Email</label>
                    <p className="text-sm font-bold text-slate-800">{selectedLead.email}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact Phone</label>
                    <p className="text-sm font-bold text-slate-800">{selectedLead.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;