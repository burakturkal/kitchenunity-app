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
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [stores, setStores] = useState<CabinetStore[]>([]);
  const [selectedAdminStoreId, setSelectedAdminStoreId] = useState<string>('all');
  const [hostStoreId, setHostStoreId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [emailError, setEmailError] = useState(false);

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
      const password = authPassword;
      if (!email) {
        alert('Email is required.');
        setIsAuthLoading(false);
        return;
      }
      if (!password) {
        alert('Password is required.');
        setIsAuthLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      // Successful login will redirect or update session automatically
    } catch (err: any) {
      alert(err.message || "Authentication attempt failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleBypassLogin = () => {
    setIsBypassMode(true);
    if (!currentUser.storeId && hostStoreId) {
      setCurrentUser(prev => ({ ...prev, storeId: hostStoreId || prev.storeId }));
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

  if (!session && !isBypassMode) {
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

          {/* New Buttons Row */}
          <div className="relative z-10 flex gap-4 mt-8">
            <a
              href="tel:5127656664"
              className="px-6 py-3 bg-blue-600 text-slate-400 max-w-sm text-base font-medium leading-relaxed rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-sans"
              style={{ textDecoration: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92z"/></svg>
              Call Us
            </a>
            <a
              href="https://www.KitchenUnity.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-slate-400 max-w-sm text-base font-medium leading-relaxed rounded-xl shadow-lg hover:bg-blue-100 transition-colors flex items-center gap-2 border border-blue-600 font-sans"
              style={{ textDecoration: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
              Get More Information
            </a>
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 relative bg-white overflow-y-auto" style={{ minHeight: '100vh', justifyContent: 'flex-start' }}>
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
                <label className={`text-[10px] font-black uppercase tracking-widest ${emailError ? 'text-red-500' : 'text-slate-400'}`}>Email Address</label>
                <div className={`relative ${emailError ? 'animate-shake' : ''}`}>
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${emailError ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                  <input 
                    type="email" 
                    required
                    placeholder="manager@kitchenunity.com"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 ${emailError ? 'border-red-500' : 'border-slate-200'}`}
                    value={authEmail}
                    onChange={e => { setAuthEmail(e.target.value); setEmailError(false); }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
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
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-blue-600 font-bold hover:underline focus:outline-none"
                  onClick={async () => {
                    const email = authEmail.trim().toLowerCase();
                    if (!email) {
                      setEmailError(true);
                      setTimeout(() => setEmailError(false), 1000);
                      return;
                    }
                    try {
                      setIsAuthLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin + '/'
                      });
                      if (error) throw error;
                      alert('Password reset email sent! Please check your inbox.');
                    } catch (err: any) {
                      alert(err.message || 'Failed to send password reset email.');
                    } finally {
                      setIsAuthLoading(false);
                    }
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                onClick={handleBypassLogin}
                className="w-full py-4 border border-slate-200 text-slate-600 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:border-slate-900 hover:text-slate-900 transition-colors"
              >
                <Sparkles size={14} /> Bypass Login (Demo)
              </button>
            </form>


            <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100/50 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Security Protocol</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Password Authentication</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">
                Enter your email and password to access your workspace. If you forgot your password, use the reset link above.
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
