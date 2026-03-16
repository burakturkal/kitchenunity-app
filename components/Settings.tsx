import React, { useState, useEffect, useRef } from 'react';
import { MOCK_SALES_TAX, MOCK_EXPENSE_TYPES } from '../services/mockData';
import { ExpenseType } from '../types';
import {
  Building2,
  Database,
  Mail,
  Settings as SettingsIcon,
  UserPlus,
  Edit2,
  Trash2,
  Save,
  ImageIcon,
  Lock,
  X,
  Code,
  Share2,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole, Lead, CabinetStore } from '../types';
import { db, supabase } from '../services/supabase';
import EmbedCodeGenerator from './EmbedCodeGenerator';
import ClaimsEmbedGenerator from './ClaimsEmbedGenerator';

interface SettingsProps {
  storeId?: string;
  onLeadAdded?: (lead: Lead) => void;
  activeStore?: CabinetStore | null;
  stores?: CabinetStore[];
  currentUserRole?: UserRole;
  variant?: 'full' | 'platform' | 'store';
  onStoreUpdated?: (storeId: string, updates: Partial<CabinetStore>) => void;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Disabled';
}

interface PendingInvite {
  id: string;
  email: string;
  storeId?: string;
  requestedRole?: string;
  status?: string;
  createdAt?: string;
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

const Settings: React.FC<SettingsProps> = ({ storeId = 'store-1', onLeadAdded, activeStore, stores = [], currentUserRole, variant = 'full', onStoreUpdated }) => {
  const showPlatform = variant === 'full' || variant === 'platform';
  const showStore    = variant === 'full' || variant === 'store';
  const [users, setUsers] = useState<UserRow[]>([]);
  // --- Accounting State ---
  const [accountingTab, setAccountingTab] = useState<'account' | 'general' | 'accounting'>('account');
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [salesTax, setSalesTax] = useState<number>(MOCK_SALES_TAX);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>(MOCK_EXPENSE_TYPES);
  const [newExpenseType, setNewExpenseType] = useState<{ name: string; description?: string }>({ name: '', description: '' });

  const [isSavingDigest, setIsSavingDigest] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(activeStore?.dailyDigestEnabled || false);
  const [digestTime, setDigestTime] = useState(activeStore?.dailyDigestTime || '17:00');
  const [digestStatuses, setDigestStatuses] = useState<string[]>(activeStore?.dailyDigestStatuses || []);
  const [digestTimezone, setDigestTimezone] = useState(activeStore?.timezone || 'America/New_York');

  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactEmail, setContactEmail] = useState(activeStore?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(activeStore?.contactPhone || '');
  const [contactWebsite, setContactWebsite] = useState(activeStore?.website || '');
  const [contactReplyTo, setContactReplyTo] = useState(activeStore?.replyToEmail || '');
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [logoUrl, setLogoUrl] = useState(
    activeStore?.logoUrl || localStorage.getItem(`ku_store_logo_${activeStore?.id ?? storeId}`) || ''
  );
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [storeName, setStoreName] = useState(activeStore?.name || '');
  const [storeDomain, setStoreDomain] = useState(activeStore?.domain || '');
  const [fbTargetStoreId, setFbTargetStoreId] = useState(activeStore?.id || storeId || '');
  const [fbPageId, setFbPageId] = useState(activeStore?.facebookPageId || '');
  const [fbPageToken, setFbPageToken] = useState(activeStore?.facebookPageToken || '');
  const [showToken, setShowToken] = useState(false);
  const [isSavingFb, setIsSavingFb] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('store_user');
  const [inviteStoreId, setInviteStoreId] = useState(storeId || '');
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  useEffect(() => {
    setStoreName(activeStore?.name || '');
    setStoreDomain(activeStore?.domain || '');
    setContactEmail(activeStore?.contactEmail || '');
    setContactPhone(activeStore?.contactPhone || '');
    setContactWebsite(activeStore?.website || '');
    setContactReplyTo(activeStore?.replyToEmail || '');
    setDigestEnabled(activeStore?.dailyDigestEnabled || false);
    setDigestTime(activeStore?.dailyDigestTime || '17:00');
    setDigestStatuses(activeStore?.dailyDigestStatuses || []);
    setDigestTimezone(activeStore?.timezone || 'America/New_York');
    if (activeStore) {
      setFbTargetStoreId(activeStore.id);
      setFbPageId(activeStore.facebookPageId || '');
      setFbPageToken(activeStore.facebookPageToken || '');
      setLogoUrl(activeStore.logoUrl || localStorage.getItem(`ku_store_logo_${activeStore.id}`) || '');
    }
  }, [activeStore?.id, activeStore?.name, activeStore?.domain, activeStore?.facebookPageId, activeStore?.facebookPageToken, activeStore?.contactEmail, activeStore?.contactPhone, activeStore?.website, activeStore?.replyToEmail, activeStore?.logoUrl]);

  useEffect(() => {
    setInviteStoreId(storeId || '');
  }, [storeId]);

  useEffect(() => {
    if (currentUserRole !== UserRole.ADMIN) return;
    const loadPending = async () => {
      setIsPendingLoading(true);
      try {
        const pending = await db.inviteRequests.listPending();
        setPendingInvites(pending as PendingInvite[]);
      } catch (err) {
        console.error('Pending invites load failed:', err);
      } finally {
        setIsPendingLoading(false);
      }
    };
    loadPending();
  }, [currentUserRole]);

  useEffect(() => {
    const fetchSalesTax = async () => {
      try {
        const stores = await db.stores.list(); // Corrected the response handling
        if (stores && stores.length > 0) {
          setSalesTax(stores[0].salesTax || 0); // Set the fetched sales tax value
        } else {
          console.error('No stores found or sales tax data is missing.');
        }
      } catch (err) {
        console.error('Unexpected error fetching sales tax:', err);
      }
    };

    fetchSalesTax();
  }, []);

  const handleSaveDigest = async () => {
    if (!activeStore?.id) { alert('No active store selected.'); return; }
    setIsSavingDigest(true);
    try {
      await db.stores.update(activeStore.id, {
        dailyDigestEnabled: digestEnabled,
        dailyDigestTime: digestTime,
        dailyDigestStatuses: digestStatuses,
      });
      alert('Digest settings saved.');
    } catch (err) {
      console.error('Digest save failed:', err);
      alert('Save failed. Please try again.');
    } finally {
      setIsSavingDigest(false);
    }
  };

  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const pendingFileRef = useRef<File | null>(null);

  const handleSaveLogo = async () => {
    if (!activeStore?.id) { alert('No active store selected.'); return; }
    setIsSavingLogo(true);
    try {
      let finalUrl = logoUrl;

      const file = pendingFileRef.current;
      if (file) {
        const ext = file.name.split('.').pop() || 'png';
        const path = `${activeStore.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('store-logos').getPublicUrl(path);
        finalUrl = data.publicUrl;
        pendingFileRef.current = null;
      }

      await db.stores.update(activeStore.id, { logoUrl: finalUrl || null });
      const key = `ku_store_logo_${activeStore.id}`;
      if (finalUrl) { localStorage.setItem(key, finalUrl); } else { localStorage.removeItem(key); }
      setLogoUrl(finalUrl);
      onStoreUpdated?.(activeStore.id, { logoUrl: finalUrl || undefined });
      alert('Logo saved.');
    } catch (err: any) {
      console.error('Logo save failed:', err);
      alert(err?.message || 'Save failed. Make sure the store-logos storage bucket exists and logo_url column is added to the stores table.');
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File too large. Max 2MB.'); return; }
    pendingFileRef.current = file;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveStoreIdentity = async () => {
    if (!activeStore?.id) {
      alert('No active store selected.');
      return;
    }
    setIsSavingStore(true);
    try {
      let finalLogoUrl = logoUrl;

      const file = pendingFileRef.current;
      if (file) {
        const ext = file.name.split('.').pop() || 'png';
        const path = `${activeStore.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('store-logos').getPublicUrl(path);
        finalLogoUrl = data.publicUrl;
        pendingFileRef.current = null;
        setLogoUrl(finalLogoUrl);
        const key = `ku_store_logo_${activeStore.id}`;
        localStorage.setItem(key, finalLogoUrl);
      }

      await db.stores.update(activeStore.id, { name: storeName, timezone: digestTimezone, logoUrl: finalLogoUrl || null });
      onStoreUpdated?.(activeStore.id, { logoUrl: finalLogoUrl || undefined });
      alert('Store settings saved.');
    } catch (err) {
      console.error('Store identity save failed:', err);
      alert('Store update failed.');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSaveContact = async () => {
    if (!activeStore?.id) {
      alert('No active store selected.');
      return;
    }
    setIsSavingContact(true);
    try {
      await db.stores.update(activeStore.id, {
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        website: contactWebsite.trim(),
        replyToEmail: contactReplyTo.trim(),
      });
      alert('Contact info saved.');
    } catch (err) {
      console.error('Contact save failed:', err);
      alert('Save failed. Please try again.');
    } finally {
      setIsSavingContact(false);
    }
  };

  // Load current user info into account form on mount
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAccountEmail(user.email || '');
        setAccountName(user.user_metadata?.full_name || '');
      }
    };
    loadUser();
  }, []);

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      const updates: any = {};
      if (accountName.trim()) updates.data = { full_name: accountName.trim() };

      if (accountPassword.trim()) {
        if (accountPassword !== accountPasswordConfirm) {
          alert('Passwords do not match.');
          setIsSavingAccount(false);
          return;
        }
        if (accountPassword.length < 6) {
          alert('Password must be at least 6 characters.');
          setIsSavingAccount(false);
          return;
        }
        updates.password = accountPassword.trim();
      }

      if (accountEmail.trim()) updates.email = accountEmail.trim();

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setAccountPassword('');
      setAccountPasswordConfirm('');
      alert('Account updated successfully.');
    } catch (err: any) {
      console.error('Account save failed:', err);
      alert(err?.message || 'Save failed. Please try again.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSaveFacebook = async () => {
    if (!fbTargetStoreId) {
      alert('Please select a store.');
      return;
    }
    setIsSavingFb(true);
    try {
      await db.stores.update(fbTargetStoreId, { facebookPageId: fbPageId.trim(), facebookPageToken: fbPageToken.trim() });
      // Keep facebook_page_store_map in sync — this is what the webhook reads.
      // Non-blocking: if RLS denies this (e.g. migration not yet applied), the stores save above still succeeds.
      supabase.from('facebook_page_store_map').upsert({
        facebook_page_id: fbPageId.trim(),
        store_id: fbTargetStoreId,
        page_token: fbPageToken.trim(),
      }, { onConflict: 'facebook_page_id' }).then(({ error }) => {
        if (error) console.warn('[FB map sync] Could not update facebook_page_store_map:', error.message);
      });
      alert('Facebook Lead Ads settings saved.');
    } catch (err) {
      console.error('Facebook settings save failed:', err);
      alert('Save failed. Please try again.');
    } finally {
      setIsSavingFb(false);
    }
  };

  const handleSaveSalesTax = async () => {
    console.log('Saving salesTax:', salesTax); // Debugging log to check salesTax value
    try {
      // Assuming there's a function to update the store in the database
      await db.stores.update(activeStore?.id, { salesTax });
      localStorage.setItem('globalSalesTax', salesTax.toString()); // Save to localStorage
      alert('Global sales tax saved successfully!');
    } catch (error) {
      console.error('Failed to save global sales tax:', error);
      alert('Failed to save global sales tax. Please try again.');
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      alert('Email is required.');
      return;
    }
    const roleToUse = currentUserRole === UserRole.ADMIN ? inviteRole.trim() : 'pending';
    const targetStoreId = currentUserRole === UserRole.ADMIN ? inviteStoreId : storeId;
    if (!targetStoreId) {
      alert('Store is required.');
      return;
    }

    setIsInviting(true);
    try {
      await db.inviteRequests.create({ email: inviteEmail.trim(), storeId: targetStoreId, requestedRole: roleToUse });
      setInviteEmail('');
      setInviteRole('store_user');
      setIsInviteOpen(false);
      if (currentUserRole === UserRole.ADMIN) {
        const pending = await db.inviteRequests.listPending();
        setPendingInvites(pending as PendingInvite[]);
      }
    } catch (err: any) {
      console.error('Invite failed:', err);
      alert(err?.message || 'Invite failed.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleApproveInvite = async (invite: PendingInvite) => {
    try {
      await db.inviteRequests.approve(invite.id);
      setPendingInvites((prev) => prev.filter(p => p.id !== invite.id));
    } catch (err: any) {
      console.error('Approve failed:', err);
      alert(err?.message || 'Approve failed.');
    }
  };

  return (
      <div className="space-y-12 pb-24">
      {showPlatform && <>{/* ACCOUNTING TAB SWITCHER */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-6 py-2 rounded-2xl font-black uppercase text-xs tracking-widest border-2 ${accountingTab === 'account' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200'}`}
          onClick={() => setAccountingTab('account')}
        >Account</button>
        <button
          className={`px-6 py-2 rounded-2xl font-black uppercase text-xs tracking-widest border-2 ${accountingTab === 'general' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200'}`}
          onClick={() => setAccountingTab('general')}
        >General</button>
        <button
          className={`px-6 py-2 rounded-2xl font-black uppercase text-xs tracking-widest border-2 ${accountingTab === 'accounting' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200'}`}
          onClick={() => setAccountingTab('accounting')}
        >Accounting</button>
      </div>

      {accountingTab === 'account' && (
        <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-8 max-w-lg">
          <SectionHeader title="My Account" icon={Lock} />
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={accountEmail} onChange={e => setAccountEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Change Password</p>
            <div>
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showAccountPassword ? 'text' : 'password'}
                  value={accountPassword}
                  onChange={e => setAccountPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowAccountPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={accountPasswordConfirm}
                onChange={e => setAccountPasswordConfirm(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <button
            onClick={handleSaveAccount}
            disabled={isSavingAccount}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {isSavingAccount ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {accountingTab === 'accounting' && (
        <div className="bg-white rounded-[40px] border-2 border-blue-500/20 p-10 shadow-xl shadow-blue-500/5 relative overflow-hidden space-y-12">
          <SectionHeader title="Sales Tax" icon={Database} />
          <div className="mb-8">
            <Label>Global Sales Tax (%)</Label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={salesTax}
              onChange={e => setSalesTax(Number(e.target.value))}
              className="w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
            />
            <p className="text-xs text-slate-400 mt-2">This rate will be applied to all orders and quotes by default. You can override it per order/quote.</p>
          </div>
          <SectionHeader title="Expense Types" icon={Database} />
          <div className="mb-8">
            <Label>Add New Expense Type</Label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Expense Type Name"
                value={newExpenseType.name}
                onChange={e => setNewExpenseType({ ...newExpenseType, name: e.target.value })}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newExpenseType.description}
                onChange={e => setNewExpenseType({ ...newExpenseType, description: e.target.value })}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
              />
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-colors"
                onClick={() => {
                  if (!newExpenseType.name.trim()) return;
                  setExpenseTypes(prev => [...prev, { id: `exp-${Date.now()}`, name: newExpenseType.name.trim(), description: newExpenseType.description }]);
                  setNewExpenseType({ name: '', description: '' });
                }}
              >Add</button>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                  <tr><th className="px-4 py-2">Type</th><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-right">#</th></tr>
                </thead>
                <tbody>
                  {expenseTypes.map(type => (
                    <tr key={type.id} className="text-sm">
                      <td className="px-4 py-2 font-bold">{type.name}</td>
                      <td className="px-4 py-2 text-slate-500">{type.description || ''}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => setExpenseTypes(prev => prev.filter(t => t.id !== type.id))} className="text-rose-500 hover:bg-rose-50 p-1 rounded" title="Remove"><Trash2 size={12}/></button>
                      </td>
                    </tr>
                  ))}
                  {expenseTypes.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-xs text-slate-400">No expense types defined.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <button
            onClick={handleSaveSalesTax}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-md hover:bg-blue-600 transition-all"
          >
            Save Settings
          </button>
        </div>
      )}
      </>}

      {/* EMBEDDED LEAD FORMS — superadmin only */}
      {showStore && currentUserRole === UserRole.ADMIN && stores.length > 0 && (
        <div className="bg-white rounded-[40px] border-2 border-blue-500/20 p-10 shadow-xl shadow-blue-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Code size={120} className="text-blue-600" />
          </div>
          <SectionHeader title="Embedded Lead Forms" icon={Code} />
          <p className="text-sm text-slate-500 font-medium mb-8 -mt-4 max-w-xl">
            Generate a snippet that any store owner can paste on their website. The form sends leads directly into their CRM — no plugins, no Forminator, no middleman.
          </p>
          <EmbedCodeGenerator stores={stores} />
        </div>
      )}

      {/* EMBEDDED CLAIM FORMS — superadmin only */}
      {showStore && currentUserRole === UserRole.ADMIN && stores.length > 0 && (
        <div className="bg-white rounded-[40px] border-2 border-rose-500/20 p-10 shadow-xl shadow-rose-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Code size={120} className="text-rose-600" />
          </div>
          <SectionHeader title="Embedded Claim Forms" icon={Code} />
          <p className="text-sm text-slate-500 font-medium mb-8 -mt-4 max-w-xl">
            Generate a snippet that store owners can paste on their website. Customers fill it out and the claim appears instantly in Claim Management — no login required.
          </p>
          <ClaimsEmbedGenerator stores={stores} />
        </div>
      )}

      {/* FACEBOOK LEAD ADS — superadmin only */}
      {showStore && currentUserRole === UserRole.ADMIN && <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
        <SectionHeader title="Facebook Lead Ads" icon={Share2} />
        <p className="text-sm text-slate-500 font-medium mb-8 -mt-4 max-w-xl">
          Connect this store's Facebook Page so that leads from your Lead Ad campaigns appear automatically in the CRM.
        </p>
        <div className="space-y-6 max-w-lg">
          {!activeStore && stores.length > 0 && (
            <div>
              <Label>Store</Label>
              <select
                value={fbTargetStoreId}
                onChange={(e) => {
                  const s = stores.find(s => s.id === e.target.value);
                  setFbTargetStoreId(e.target.value);
                  setFbPageId(s?.facebookPageId || '');
                  setFbPageToken(s?.facebookPageToken || '');
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none"
              >
                <option value="">Select a store</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Facebook Page ID</Label>
            <Input
              value={fbPageId}
              onChange={(e) => setFbPageId(e.target.value)}
              placeholder="e.g. 123456789012345"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Found in your Facebook Page settings under &ldquo;About &rsaquo; Page transparency&rdquo;
            </p>
          </div>
          <div>
            <Label>Page Access Token</Label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={fbPageToken}
                onChange={(e) => setFbPageToken(e.target.value)}
                placeholder="EAAxxxxxxx..."
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                title={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Generate a long-lived token in your Facebook Developer App &rsaquo; Graph API Explorer. Keep this private.
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveFacebook}
              disabled={isSavingFb}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-all disabled:opacity-60"
            >
              <Save size={14} /> {isSavingFb ? 'Saving...' : 'Save Facebook Settings'}
            </button>
          </div>
        </div>
      </div>}

      {showStore && accountingTab === 'general' && <>
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
              <Label>Business Type</Label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none">
                <option>Cabinet Store</option>
                <option>Cabinet & Installation</option>
                <option>Design Studio</option>
              </select>
            </div>
            <div>
              <Label>Timezone</Label>
              <select
                value={digestTimezone}
                onChange={e => setDigestTimezone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Phoenix">Arizona (AZ)</option>
                <option value="America/Anchorage">Alaska (AK)</option>
                <option value="Pacific/Honolulu">Hawaii (HI)</option>
              </select>
            </div>
            <div>
              <Label>Store Logo</Label>
              <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-100 rounded-3xl">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon size={32} className="text-slate-300" />
                  )}
                </div>
                <div className="space-y-2">
                  <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => logoFileRef.current?.click()} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                      {logoUrl ? 'Change' : 'Upload Logo'}
                    </button>
                    {logoUrl && (
                      <button type="button" onClick={() => { setLogoUrl(''); pendingFileRef.current = null; if (logoFileRef.current) logoFileRef.current.value = ''; }} className="px-3 py-2 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all">
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">JPG, PNG or SVG. Saved with Store Identity below.</p>
                </div>
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
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ops@yourstore.com" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 012-3456" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Label>Website URL</Label>
              <Input type="url" value={contactWebsite} onChange={(e) => setContactWebsite(e.target.value)} placeholder="https://yourstore.com" />
            </div>
            <div>
              <Label>Default Reply-to Email</Label>
              <Input type="email" value={contactReplyTo} onChange={(e) => setContactReplyTo(e.target.value)} placeholder="No-reply fallback" />
            </div>
          </div>
        </div>
        <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveContact}
            disabled={isSavingContact}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-60"
          >
            <Save size={16} /> {isSavingContact ? 'Saving...' : 'Save Contact Info'}
          </button>
        </div>
      </div>

      {/* 3. LEAD DIGEST NOTIFICATIONS */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
        <SectionHeader title="Lead Digest Notifications" icon={Bell} />
        <p className="text-sm text-slate-500 font-medium mb-8 -mt-4 max-w-xl">
          Get a daily email summary of your leads so you never miss an inquiry. New leads will show the time they were received.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6 max-w-lg">
          <div>
            <p className="text-sm font-bold text-slate-800">Notify me at the end of the day</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Send a digest email at the time you choose below</p>
          </div>
          <button
            onClick={() => setDigestEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${digestEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${digestEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {digestEnabled && (
          <div className="space-y-6 max-w-lg">
            {/* Time picker */}
            <div>
              <Label>Send digest at</Label>
              <input
                type="time"
                value={digestTime}
                onChange={e => setDigestTime(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Time is in UTC. Adjust to match your local end of business.</p>
            </div>

            {/* Status checkboxes */}
            <div>
              <Label>Include leads with these statuses</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {['New', 'Contacted', 'Qualified', 'Closed', 'Archived'].map(status => {
                  const checked = digestStatuses.includes(status);
                  return (
                    <label key={status} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${checked ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setDigestStatuses(prev => checked ? prev.filter(s => s !== status) : [...prev, status])}
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-sm font-bold text-slate-700">{status}</span>
                      {status === 'New' && <span className="ml-auto text-[10px] font-black text-blue-500 uppercase tracking-wider">+ times</span>}
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">New leads will include the time they were received in the email.</p>
            </div>
          </div>
        )}

        <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveDigest}
            disabled={isSavingDigest}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-60"
          >
            <Save size={16} /> {isSavingDigest ? 'Saving...' : 'Save Digest Settings'}
          </button>
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

        {currentUserRole === UserRole.ADMIN && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Pending Approvals</h4>
              {isPendingLoading && <span className="text-[10px] font-black uppercase text-slate-400">Loading...</span>}
            </div>
            <div className="border border-slate-100 rounded-[24px] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Store</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingInvites.length === 0 && !isPendingLoading && (
                    <tr>
                      <td colSpan={3} className="px-8 py-6 text-xs text-slate-400 font-bold uppercase tracking-widest">No pending approvals</td>
                    </tr>
                  )}
                  {pendingInvites.map((invite) => {
                    const storeName = stores.find(s => s.id === invite.storeId)?.name || 'Unassigned';
                    return (
                      <tr key={invite.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 text-xs font-mono text-slate-500">{invite.email}</td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-800">{storeName}</td>
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => handleApproveInvite(invite)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </>}

      {isInviteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Invite User</h4>
              <button onClick={() => setIsInviteOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <Label>User Email</Label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@company.com" />
              </div>
              {currentUserRole === UserRole.ADMIN ? (
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
              ) : (
                <div className="space-y-1">
                  <Label>Role</Label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-400">Pending Approval</div>
                </div>
              )}
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
                Invites are created by email. Non-admin invites require approval.
              </p>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsInviteOpen(false)} className="px-6 py-2 text-xs font-bold text-slate-500 uppercase">Cancel</button>
              <button
                onClick={handleInviteUser}
                disabled={isInviting}
                className="px-8 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {isInviting ? 'Saving...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
