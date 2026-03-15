
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
  CheckCircle2,
  Bell,
  Save,
  ChevronDown,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Lead, LeadStatus, UserRole, CabinetStore } from '../types';

interface LeadListProps {
  leads: Lead[];
  role: UserRole;
  activeStore?: CabinetStore | null;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onEdit: (lead: Lead) => void;
  onSaveDigest?: (enabled: boolean, time: string, statuses: string[]) => Promise<void>;
}

const LeadList: React.FC<LeadListProps> = ({ leads, role, activeStore, onUpdateStatus, onConvert, onDelete, onBulkDelete, onEdit, onSaveDigest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Sort state — newest first by default
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [digestEnabled, setDigestEnabled] = useState(activeStore?.dailyDigestEnabled || false);
  const [digestTime, setDigestTime] = useState(activeStore?.dailyDigestTime || '17:00');
  const [digestStatuses, setDigestStatuses] = useState<string[]>(activeStore?.dailyDigestStatuses || []);
  const [isSavingDigest, setIsSavingDigest] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);

  const handleSaveDigest = async () => {
    if (!onSaveDigest) return;
    setIsSavingDigest(true);
    try { await onSaveDigest(digestEnabled, digestTime, digestStatuses); setDigestOpen(false); }
    finally { setIsSavingDigest(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatus('');
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    for (const id of selectedIds) {
      await onUpdateStatus(id, bulkStatus as LeadStatus);
    }
    setBulkLoading(false);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} lead${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    if (onBulkDelete) {
      await onBulkDelete(ids);
    } else {
      for (const id of ids) await onDelete(id);
    }
    setBulkLoading(false);
    clearSelection();
  };

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(l => {
      const matchesSearch = l.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.phone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
    return filtered.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortDir === 'desc' ? diff : -diff;
    });
  }, [leads, searchTerm, statusFilter, sortDir]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Lead Management</h3>
        {onSaveDigest && (
          <div className="relative">
            <button
              onClick={() => setDigestOpen(v => !v)}
              title="Daily lead digest"
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${digestEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <Bell size={18} />
            </button>
            {digestOpen && (
              <div className="absolute right-0 top-12 z-30 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-900/10 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-800">Daily Lead Digest</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Email summary sent once a day</p>
                  </div>
                  <button
                    onClick={() => setDigestEnabled(v => !v)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${digestEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${digestEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {digestEnabled && (
                  <>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Send at</p>
                      <input
                        type="time"
                        value={digestTime}
                        onChange={e => setDigestTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Include statuses</p>
                      <div className="flex flex-wrap gap-2">
                        {['New', 'Contacted', 'Qualified', 'Closed', 'Archived'].map(s => {
                          const checked = digestStatuses.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() => setDigestStatuses(prev => checked ? prev.filter(x => x !== s) : [...prev, s])}
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${checked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                <button
                  onClick={handleSaveDigest}
                  disabled={isSavingDigest}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  {isSavingDigest ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        )}
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
                 className={`px-4 py-2 rounded-xl text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${statusFilter === opt.value ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'}`}
               >
                 {opt.label}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-top-2 duration-200">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            {selectedIds.size} selected
          </span>
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/10 border border-white/20 rounded-xl text-[11px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
              >
                <option value="">Change status to…</option>
                {Object.values(LeadStatus).map(s => (
                  <option key={s} value={s} className="text-slate-900 bg-white">{s}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
            </div>
            <button
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus || bulkLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-40 transition-all"
            >
              {bulkLoading ? 'Applying…' : 'Apply'}
            </button>
            {role === UserRole.ADMIN && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Delete Selected
              </button>
            )}
          </div>
          <button onClick={clearSelection} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Clear selection">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold tracking-normal border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700 transition-colors">
                    {selectedIds.size === filteredLeads.length && filteredLeads.length > 0
                      ? <CheckSquare size={16} className="text-blue-600" />
                      : <Square size={16} />
                    }
                  </button>
                </th>
                <th className="px-4 py-4">Inquiry Profile</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Contact Logic</th>
                <th className="px-8 py-4">
                  <button
                    onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors font-semibold"
                  >
                    Created At
                    {sortDir === 'desc' ? <ArrowDown size={13} className="text-blue-500" /> : <ArrowUp size={13} className="text-blue-500" />}
                  </button>
                </th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isSelected = selectedIds.has(lead.id);
                return (
                <tr key={lead.id} className={`hover:bg-slate-100/60 transition-colors group ${isSelected ? 'bg-blue-50/60' : 'odd:bg-slate-50/40'}`}>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleSelect(lead.id)} className="text-slate-400 hover:text-blue-600 transition-colors">
                      {isSelected
                        ? <CheckSquare size={16} className="text-blue-600" />
                        : <Square size={16} />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-slate-800">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs text-slate-500 font-medium">Source: {lead.source}</p>
                  </td>
                  <td className="px-8 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
                        lead.status === LeadStatus.QUALIFIED ? 'bg-emerald-100 text-emerald-600' :
                        lead.status === LeadStatus.NEW ? 'bg-blue-100 text-blue-600' :
                        lead.status === LeadStatus.CLOSED ? 'bg-rose-100 text-rose-600' :
                        lead.status === LeadStatus.ARCHIVED ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {Object.values(LeadStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-sm">
                        <Phone size={12} /> {lead.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500 font-mono text-[11px]">
                        <Mail size={12} /> {lead.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-700 font-medium whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{new Date(lead.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
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
                );
              })}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Search size={32} strokeWidth={1} />
               </div>
              <p className="text-sm font-semibold text-slate-500">No leads match your search criteria</p>
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
