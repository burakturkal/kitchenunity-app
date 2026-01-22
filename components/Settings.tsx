
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Settings as SettingsIcon, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Bell, 
  FileBox, 
  ShieldAlert, 
  Save, 
  ImageIcon,
  ExternalLink,
  Lock,
  Copy,
  CheckCircle,
  Zap,
  Play,
  X,
  Database,
  ArrowRight,
  RefreshCw,
  Code
} from 'lucide-react';
import { UserRole, Lead, LeadStatus, CabinetStore } from '../types';
import { db } from '../services/supabase';

interface SettingsProps {
  storeId?: string;
  onLeadAdded?: (lead: Lead) => void;
  activeStore?: CabinetStore | null;
  stores?: CabinetStore[];
  currentUserRole?: UserRole;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Disabled';
}

const SectionHeader = ({ title, icon: Icon, children }: { title: string; icon: any; children?: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
      <Icon size={20} />
    </div>
    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{title}</h3>
  </div>
);

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
    {children}
  </label>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 ${className || ''}`} 
  />
);

const Settings: React.FC<SettingsProps> = ({ storeId = 'store-1', onLeadAdded, activeStore, stores = [], currentUserRole }) => {
  const [users, setUsers] = useState<UserRow[]>([
    { id: '1', name: 'Sarah Platform Admin', email: 'sarah@elitecabinets.com', role: 'Owner', status: 'Active' },
    { id: '2', name: 'Mark Operator', email: 'mark@elitecabinets.com', role: 'Staff', status: 'Active' },
  ]);

  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(1);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeName, setStoreName] = useState(activeStore?.name || '');
  const [storeDomain, setStoreDomain] = useState(activeStore?.domain || '');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('store_user');
  const [inviteStoreId, setInviteStoreId] = useState(storeId || '');
  const [isInviting, setIsInviting] = useState(false);
  const [simData, setSimData] = useState({
    "name-1": "Dwayne",
    "name-2": "Johnson",
    "email-1": "rock@example.com",
    "phone-1": "555-999-0000",
    "textarea-1": "I need a quote for a full kitchen remodel in my gym."
  });

  const webhookUrl = `https://api.cabopspro.com/hooks/forminator?storeId=${storeId}`;

  useEffect(() => {
    setStoreName(activeStore?.name || '');
    setStoreDomain(activeStore?.domain || '');
  }, [activeStore?.id, activeStore?.name, activeStore?.domain]);

  useEffect(() => {
    setInviteStoreId(storeId || '');
  }, [storeId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulation = () => {
    setSimulationStep(1);
    setIsSimulating(true);
  };

  const processSimulatedLead = () => {
    setSimulationStep(2);
    setTimeout(() => {
      const newLead: Lead = {
        id: `sim-${Date.now()}`,
        storeId: storeId,
        firstName: simData["name-1"],
        lastName: simData["name-2"],
        email: simData["email-1"],
        phone: simData["phone-1"],
        message: simData["textarea-1"],
        source: 'WordPress Simulation',
        status: LeadStatus.NEW,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      (async () => {
        try {
          const saved = await db.leads.create(newLead);
          if (onLeadAdded) onLeadAdded(saved as any);
          setSimulationStep(3);
        } catch (err) {
          console.error('Lead simulation save failed:', err);
          alert('Lead simulation failed to save.');
          setSimulationStep(1);
        }
      })();
    }, 1500);
  };

  const handleSaveStoreIdentity = async () => {
    if (!activeStore?.id) {
      alert('No active store selected.');
      return;
    }
    if (!storeName || !storeDomain) {
      alert('Please provide a store name and store key.');
      return;
    }
    setIsSavingStore(true);
    try {
      await db.stores.update(activeStore.id, { name: storeName, domain: storeDomain });
      alert('Store identity saved.');
    } catch (err) {
      console.error('Store identity save failed:', err);
      alert('Store update failed.');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUserId.trim()) {
      alert('User UID is required.');
      return;
    }
    if (!inviteRole.trim()) {
      alert('Role is required.');
      return;
    }
    const targetStoreId = currentUserRole === UserRole.ADMIN ? inviteStoreId : storeId;
    if (!targetStoreId) {
      alert('Store is required.');
      return;
    }

    setIsInviting(true);
    try {
      await db.profiles.upsert({ id: inviteUserId.trim(), storeId: targetStoreId, role: inviteRole.trim() });
      setUsers((prev) => [
        { id: inviteUserId.trim(), name: 'User UID', email: inviteUserId.trim(), role: inviteRole.trim(), status: 'Active' },
        ...prev
      ]);
      setInviteUserId('');
      setInviteRole('store_user');
      setIsInviteOpen(false);
    } catch (err: any) {
      console.error('Invite failed:', err);
      alert(err?.message || 'Invite failed.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* LEAD CAPTURE INTEGRATION */}
      <div className="bg-white rounded-[40px] border-2 border-blue-500/20 p-10 shadow-xl shadow-blue-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Zap size={120} className="text-blue-600" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <SectionHeader title="Lead Capture Integration" icon={Zap} />
          <button 
            onClick={handleRunSimulation}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Play size={14} /> Test Simulation
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Connect your <span className="text-blue-600 font-black">WordPress Forminator</span> forms directly to your CabOps dashboard. Every submission will automatically create a new lead assigned to your store.
            </p>
            
            <div className="space-y-3">
              <Label>Your Unique Webhook URL</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-900 text-blue-400 p-4 rounded-2xl font-mono text-xs overflow-hidden truncate border border-slate-800">
                  {webhookUrl}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  {copied ? <CheckCircle size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                 <SettingsIcon size={14} /> Quick Setup Guide
               </h4>
               <ol className="text-xs space-y-3 text-slate-600 font-bold list-decimal list-inside">
                 <li>Open your form in <span className="text-slate-900">Forminator</span></li>
                 <li>Go to <span className="text-slate-900">Integrations {" > "} Webhooks</span></li>
                 <li>Paste the URL above into the <span className="text-slate-900">Webhook URL</span> field</li>
                 <li>Ensure the method is set to <span className="text-slate-900">POST</span></li>
                 <li>Save and test your form!</li>
               </ol>
            </div>
          </div>

          <div className="space-y-6">
            <Label>Expected Field Mapping</Label>
            <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-inner bg-slate-50/30">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-3 font-black uppercase tracking-widest">App Field</th>
                    <th className="px-6 py-3 font-black uppercase tracking-widest">Forminator ID (Example)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="px-6 py-3 font-bold text-slate-500 uppercase tracking-tighter">firstName</td><td className="px-6 py-3 text-blue-600 font-mono italic">name-1</td></tr>
                  <tr><td className="px-6 py-3 font-bold text-slate-500 uppercase tracking-tighter">lastName</td><td className="px-6 py-3 text-blue-600 font-mono italic">name-2</td></tr>
                  <tr><td className="px-6 py-3 font-bold text-slate-500 uppercase tracking-tighter">email</td><td className="px-6 py-3 text-blue-600 font-mono italic">email-1</td></tr>
                  <tr><td className="px-6 py-3 font-bold text-slate-500 uppercase tracking-tighter">phone</td><td className="px-6 py-3 text-blue-600 font-mono italic">phone-1</td></tr>
                  <tr><td className="px-6 py-3 font-bold text-slate-500 uppercase tracking-tighter">message</td><td className="px-6 py-3 text-blue-600 font-mono italic">textarea-1</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight italic">
              * Note: The storeId is automatically handled by your unique URL parameters.
            </p>
          </div>
        </div>
      </div>

      {/* WEBHOOK SIMULATOR MODAL */}
      {isSimulating && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="px-10 py-8 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <RefreshCw size={24} className={simulationStep === 2 ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase leading-none">Integration Simulator</h3>
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">Simulating WordPress {" -> "} CabOps Middleman</p>
                </div>
              </div>
              <button onClick={() => setIsSimulating(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              {simulationStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <Globe size={12}/> Incoming Payload (WordPress POST)
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] font-mono text-xs text-blue-600 leading-relaxed shadow-inner">
                        <pre>{JSON.stringify(simData, null, 2)}</pre>
                      </div>
                   </div>

                   <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Code size={18} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-slate-900 tracking-tight">Middleware Logic</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          The "Middleman" (Edge Function) will catch this payload, extract the <span className="text-blue-600 font-bold">storeId</span> from the URL, map the fields, and inject them into your secure database.
                        </p>
                      </div>
                   </div>
                </div>
              )}

              {simulationStep === 2 && (
                <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
                   <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100">
                      <Database className="text-blue-500" size={32} />
                   </div>
                   <div>
                     <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Processing Data...</h4>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Mapping fields & writing to Supabase</p>
                   </div>
                </div>
              )}

              {simulationStep === 3 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                   <div className="p-10 bg-emerald-50 rounded-[40px] border border-emerald-100 flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                        <CheckCircle size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Simulation Success</h4>
                        <p className="text-sm text-slate-500 font-medium mt-2">New lead for <span className="font-bold text-slate-900">{simData["name-1"]} {simData["name-2"]}</span> has been injected into your dashboard.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Status Code</p>
                         <p className="text-xl font-black text-emerald-600">200 OK</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Response Time</p>
                         <p className="text-xl font-black text-slate-900">42ms</p>
                      </div>
                   </div>

                   <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap size={16} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live Sync Triggered</span>
                      </div>
                      <ArrowRight size={18} className="text-blue-400" />
                   </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              {simulationStep === 1 && (
                <button 
                  onClick={processSimulatedLead}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <RefreshCw size={14} /> Trigger Middleman Process
                </button>
              )}
              {simulationStep === 3 && (
                <button 
                  onClick={() => setIsSimulating(false)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20"
                >
                  View New Lead in Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. STORE INFORMATION */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
        <SectionHeader title="Store Information" icon={Building2} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <Label>Store Name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store Name" />
            </div>
            <div>
              <Label>Store Key (URL Slug)</Label>
              <Input value={storeDomain} onChange={(e) => setStoreDomain(e.target.value)} placeholder="store-key" />
            </div>
            <div>
              <Label>Business Type</Label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none">
                <option>Cabinet Store</option>
                <option>Cabinet & Installation</option>
                <option>Design Studio</option>
              </select>
            </div>
            <div>
              <Label>Store Logo</Label>
              <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-100 rounded-3xl">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-300">
                  <ImageIcon size={32} />
                </div>
                <div className="space-y-2">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Upload Logo</button>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">JPG, PNG or SVG. Max 2MB.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Label>Business Address</Label>
              <div className="space-y-4">
                <Input placeholder="Street Address" defaultValue="123 Granite Way" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="City" defaultValue="Grand Rapids" />
                  <Input placeholder="State" defaultValue="MI" />
                </div>
                <Input placeholder="ZIP Code" defaultValue="49501" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveStoreIdentity}
            disabled={isSavingStore}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-60"
          >
            <Save size={16} /> {isSavingStore ? 'Saving...' : 'Save Store Identity'}
          </button>
        </div>
      </div>

      {/* 2. CONTACT & COMMUNICATION */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
        <SectionHeader title="Contact & Communication" icon={Mail} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <Label>Primary Email</Label>
              <Input type="email" defaultValue="ops@elitecabinets.com" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input type="tel" defaultValue="(555) 012-3456" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Label>Website URL</Label>
              <Input type="url" defaultValue="https://elitecabinets.com" />
            </div>
            <div>
              <Label>Default Reply-to Email</Label>
              <Input type="email" placeholder="No-reply fallback" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. USER & ACCESS SETTINGS */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <SectionHeader title="User & Access Settings" icon={Lock} />
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-all"
          >
            <UserPlus size={16} /> Invite User
          </button>
        </div>
        <div className="border border-slate-100 rounded-[24px] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">{user.name}</span>
                      <span className="text-xs text-slate-400 font-medium">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Assign User to Store</h4>
              <button onClick={() => setIsInviteOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <Label>User UID</Label>
                <Input value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)} placeholder="Auth user UID" />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none"
                >
                  <option value="store_user">Store User</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {currentUserRole === UserRole.ADMIN && (
                <div className="space-y-1">
                  <Label>Store</Label>
                  <select
                    value={inviteStoreId}
                    onChange={(e) => setInviteStoreId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none"
                  >
                    <option value="">Select a store</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                User must already exist in Auth.
              </p>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsInviteOpen(false)} className="px-6 py-2 text-xs font-bold text-slate-500 uppercase">Cancel</button>
              <button
                onClick={handleInviteUser}
                disabled={isInviting}
                className="px-8 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {isInviting ? 'Saving...' : 'Assign User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
