
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CabinetStore, UserRole } from '../types';
import { resolveDomainToStoreId, mapToCamel, supabase } from '../services/supabase';
import { Clock, ShieldAlert, Lock, Mail, ArrowRight, Building2, Sparkles, ShieldCheck } from 'lucide-react';

interface StoreContextType {
  effectiveStoreId: string;
  activeStore: CabinetStore | null;
  currentUser: { id: string; name: string; role: UserRole; storeId?: string };
  selectedAdminStoreId: string;
  stores: CabinetStore[];
  isLoading: boolean;
  setCurrentUser: (user: any) => void;
  setSelectedAdminStoreId: (id: string) => void;
  setStores: React.Dispatch<React.SetStateAction<CabinetStore[]>>;
  handleRoleSwitch: (role: UserRole) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [stores, setStores] = useState<CabinetStore[]>([]);
  const [selectedAdminStoreId, setSelectedAdminStoreId] = useState<string>('all');
  const [hostStoreId, setHostStoreId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState({
    id: 'u-1',
    name: 'Sarah Platform Admin',
    role: UserRole.ADMIN,
    storeId: undefined as string | undefined
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        // 1. Check current session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        // 2. Resolve domain to identify which store context we are in
        let resolvedId = resolveDomainToStoreId();

        // 3. Load stores from the database
        const { data: allStores } = await supabase.from('stores').select('*');
        const mappedStores = (allStores || []).map(mapToCamel) as CabinetStore[];
        setStores(mappedStores);

        // 4. If logged in, resolve profile (role + store)
        if (currentSession?.user?.id) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).maybeSingle();
          const mappedProfile = mapToCamel(profile);
          const profileStoreId = mappedProfile?.storeId || null;
          const profileRole = mappedProfile?.role;

          if (profileStoreId) {
            resolvedId = profileStoreId;
          }

          if (profileRole === 'super_admin') {
            setCurrentUser({
              id: currentSession.user.id,
              name: currentSession.user.email || 'Super Admin',
              role: UserRole.ADMIN,
              storeId: profileStoreId || undefined
            });
            setSelectedAdminStoreId('all');
          } else {
            setCurrentUser({
              id: currentSession.user.id,
              name: currentSession.user.email || 'Store User',
              role: UserRole.CUSTOMER,
              storeId: profileStoreId || undefined
            });
            if (profileStoreId) setSelectedAdminStoreId(profileStoreId);
          }
        }

        // 5. Fallback logic for resolution
        if (!resolvedId && mappedStores.length > 0) {
          resolvedId = mappedStores[0].id; // Fallback to first available store for demo stability
        }

        if (resolvedId) {
          setHostStoreId(resolvedId);
          setCurrentUser(prev => ({ ...prev, storeId: resolvedId }));
        }
      } catch (err) {
        console.error("Platform initialization failure:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCurrentUser({ id: 'u-1', name: 'Sarah Platform Admin', role: UserRole.ADMIN, storeId: undefined });
        setSelectedAdminStoreId('all');
        setHostStoreId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const email = authEmail.trim().toLowerCase();
      if (!email) {
        alert('Email is required.');
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      alert("Magic login link sent! Please check your email inbox.");
    } catch (err: any) {
      alert(err.message || "Authentication attempt failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };


  const effectiveStoreId = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) return selectedAdminStoreId;
    return hostStoreId || '';
  }, [currentUser.role, selectedAdminStoreId, hostStoreId]);

  const activeStore = useMemo(() => {
    if (effectiveStoreId === 'all') return null;
    return stores.find(s => s.id === effectiveStoreId) || null;
  }, [stores, effectiveStoreId]);

  const handleRoleSwitch = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      setCurrentUser({ id: 'u-1', name: 'Sarah Platform Admin', role, storeId: undefined });
      setSelectedAdminStoreId('all');
    } else if (role === UserRole.CUSTOMER) {
      setCurrentUser({ id: 'u-store', name: 'Store Owner', role, storeId: hostStoreId || undefined });
    } else {
      setCurrentUser({ id: 'u-staff', name: 'Staff Designer', role, storeId: hostStoreId || undefined });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <Clock className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing with Cloud Hub...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen flex flex-col lg:flex-row bg-slate-50 font-sans overflow-hidden animate-in fade-in duration-500">
        {/* Visual Branding Column */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-20 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Building2 size={500} className="text-blue-500" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <Building2 className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">Kitchen Unity</h1>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">SaaS Management Platform</p>
            </div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-7xl font-black text-white tracking-tighter leading-[0.85] uppercase mb-8">
              The Hub of <br /> <span className="text-blue-500">Cabinets.</span>
            </h2>
            <p className="text-slate-400 max-w-sm text-base font-medium leading-relaxed">
              Experience zero-friction operations with our multi-tenant cabinet ERP. Integrated leads, measurements, and financial auditing.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-8 border-t border-slate-800 pt-10">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">#{i}</div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-none">Global Infrastructure</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Enterprise Grade Security</p>
            </div>
          </div>
        </div>

        {/* Login Form Column */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 relative bg-white overflow-y-auto">
          <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-white" />
             </div>
             <span className="font-black text-slate-900 uppercase tracking-tighter">Kitchen Unity</span>
          </div>

          <div className="w-full max-w-md space-y-10 py-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Platform Entry</span>
              </div>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Welcome.</h3>
              <p className="text-sm text-slate-500 font-medium">
                Log in to access your workspace at <span className="text-slate-900 font-black">{activeStore?.name || 'Kitchen Unity'}</span>.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    required
                    placeholder="manager@kitchenunity.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAuthLoading}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-blue-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <Clock className="animate-spin" size={18} />
                ) : (
                  <>
                    Send Login Link <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>


            <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100/50 flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Security Protocol</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Passwordless Gateway</p>
                  </div>
               </div>
               <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">
                 We'll send a one-time secure magic link to your email. This ensures higher data protection for all tenants without the need for vulnerable passwords.
               </p>
            </div>

            <div className="text-center space-y-2 pt-4">
               <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <ShieldCheck size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Secure Cloud Session Active</p>
               </div>
               <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">Kitchen Unity CRM v2.5.0</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fallback Error State
  if (error && session) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6 text-center font-sans">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-rose-100">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Access Restricted</h1>
        <p className="text-sm text-slate-500 max-w-md font-medium leading-relaxed">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Retry Handshake</button>
      </div>
    );
  }

  const value = {
    effectiveStoreId,
    activeStore,
    currentUser,
    selectedAdminStoreId,
    stores,
    isLoading,
    setCurrentUser,
    setSelectedAdminStoreId,
    setStores,
    handleRoleSwitch
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useTenant must be used within a StoreProvider");
  return context;
};
