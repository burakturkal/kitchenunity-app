
import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { UserRole } from '../types';

interface SettingsProps {
  storeId?: string;
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

const Settings: React.FC<SettingsProps> = ({ storeId = 'store-1' }) => {
  const [users] = useState<UserRow[]>([
    { id: '1', name: 'Sarah Platform Admin', email: 'sarah@elitecabinets.com', role: 'Owner', status: 'Active' },
    { id: '2', name: 'Mark Operator', email: 'mark@elitecabinets.com', role: 'Staff', status: 'Active' },
  ]);

  const [copied, setCopied] = useState(false);
  const webhookUrl = `https://api.cabopspro.com/hooks/forminator?storeId=${storeId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* NEW: WORDPRESS / FORMINATOR INTEGRATION */}
      <div className="bg-white rounded-[40px] border-2 border-blue-500/20 p-10 shadow-xl shadow-blue-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Zap size={120} className="text-blue-600" />
        </div>
        
        <SectionHeader title="Lead Capture Integration" icon={Zap} />
        
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
                 <li>
                  Go to <span className="text-slate-900">
                    Integrations {'>'} Webhooks
                  </span>
                </li>

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

      {/* 1. STORE INFORMATION */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
        <SectionHeader title="Store Information" icon={Building2} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <Label>Store Name</Label>
              <Input defaultValue="Elite Kitchen Cabinets" />
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
          <button className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/20">
            <Save size={16} /> Save Store Identity
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
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-all">
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
    </div>
  );
};

export default Settings;
