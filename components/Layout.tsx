
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  UserCircle,
  Menu,
  X,
  Building2,
  ChevronRight,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Globe,
  ChevronLeft,
  Sparkles,
  Bell
} from 'lucide-react';
import { UserRole, CabinetStore, Lead } from '../types';
import { NAV_ITEMS } from '../constants';
import { supabase } from '../services/supabase';
import RequestDesignModal from './RequestDesignModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { name: string; role: UserRole; id: string };
  onRoleSwitch: (role: UserRole) => void;
  selectedAdminStoreId?: string;
  setSelectedAdminStoreId?: (id: string) => void;
  stores?: CabinetStore[];
  leads?: Lead[];
  activeStore?: CabinetStore | null;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  currentUser,
  onRoleSwitch,
  selectedAdminStoreId,
  setSelectedAdminStoreId,
  stores = [],
  leads = [],
  activeStore
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ sales: false });
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  // Track new leads since last visit using localStorage
  const LAST_SEEN_KEY = 'ku_last_seen_leads';
  const lastSeen = useMemo(() => {
    const ts = localStorage.getItem(LAST_SEEN_KEY);
    return ts ? new Date(ts) : new Date(0);
  }, []);

  const newLeads = useMemo(() => {
    return leads
      .filter(l => new Date(l.createdAt) > lastSeen)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [leads, lastSeen]);

  const markSeen = () => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setNotifOpen(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeStoreName = useMemo(() => {
    if (selectedAdminStoreId === 'all') return 'KitchenUnity';
    return stores.find(s => s.id === selectedAdminStoreId)?.name || 'KitchenUnity';
  }, [selectedAdminStoreId, stores]);

  const toggleSubMenu = (id: string) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = async () => {
    try {
      // Supabase signOut triggers onAuthStateChange in StoreProvider
      // which handles the redirect to the login gate automatically.
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Logout execution failed:", err);
      window.location.reload();
    }
  };

  const filteredNavItems = useMemo(() => {
    // Admin in "Global View" sees restricted items
    if (currentUser.role === UserRole.ADMIN) {
      if (selectedAdminStoreId === 'all') {
        return NAV_ITEMS.filter(item => ['dashboard', 'reports', 'settings', 'notes'].includes(item.id));
      }
      return NAV_ITEMS;
    }

    // REQUIREMENT: Staff (EMPLOYEE) must see exactly what the Shop (CUSTOMER) sees.
    // By returning all NAV_ITEMS here, both roles get access to Leads, Orders, Inventory, etc.
    // Hide adminOnly items from non-admins.
    return NAV_ITEMS.filter(item => !item.adminOnly);
  }, [currentUser.role, selectedAdminStoreId]);


  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-500 bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm relative`}>
        {(() => {
          const logoSrc = activeStore?.logoUrl ||
            (activeStore?.id ? localStorage.getItem(`ku_store_logo_${activeStore.id}`) : null);


          const storeName = activeStore?.name;
          const words = storeName ? storeName.trim().split(' ') : [];
          const nameFirst = words.length > 1 ? words.slice(0, -1).join(' ') : '';
          const nameLast = words.length > 0 ? words[words.length - 1] : '';

          return (
            <div className="p-6 flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30">
                <Building2 className="text-white" size={20} />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                  {storeName && currentUser.role !== UserRole.ADMIN ? (
                    <>
                      <span className="font-black text-sm tracking-tight text-slate-900 leading-none truncate whitespace-nowrap max-w-[160px]">
                        {nameFirst && <>{nameFirst} </>}<span className="text-blue-600">{nameLast}</span>
                      </span>
                      <span className="mt-1.5 inline-flex items-center">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest pl-3 pr-5 py-1 bg-slate-300 rounded-full">by</span>
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 rounded-full shadow-sm -ml-3 z-10">
                          <span className="text-xs font-black text-white tracking-tight">Kitchen</span><span className="text-xs font-black text-blue-400 tracking-tight">Unity</span>
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-black text-xl tracking-tight leading-none">
                        <span className="text-slate-900">Kitchen</span>
                        <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">Unity</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                        {currentUser.role === UserRole.ADMIN ? 'Global Control' : 'Operations ERP'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isSelected = activeTab === item.id || (item.subItems?.some(si => activeTab === si.id));
            const isExpanded = expandedMenus[item.id];

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (item.subItems) {
                      toggleSubMenu(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group border ${
                    isSelected && !item.subItems
                      ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm' 
                      : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon size={18} className={isSelected && !item.subItems ? 'text-blue-600' : 'group-hover:text-blue-600'} />
                  {isSidebarOpen && <span className="font-semibold text-sm tracking-tight">{item.label}</span>}
                  {isSidebarOpen && item.subItems && (
                    <div className="ml-auto">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  )}
                </button>

                {isSidebarOpen && item.subItems && isExpanded && (
                  <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveTab(sub.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === sub.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <sub.icon size={14} />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-200 space-y-3">
          {isSidebarOpen && currentUser.role === UserRole.ADMIN && (
            <div className="grid grid-cols-3 gap-1 mb-4 p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => onRoleSwitch(UserRole.ADMIN)} 
                title="SaaS Administrator"
                className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.ADMIN ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                Admin
              </button>
              <button 
                onClick={() => onRoleSwitch(UserRole.CUSTOMER)} 
                title="Shop Owner"
                className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.CUSTOMER ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                Shop
              </button>
              <button 
                onClick={() => onRoleSwitch(UserRole.EMPLOYEE)} 
                title="Store Staff"
                className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.EMPLOYEE ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
              >
                Staff
              </button>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Logout</span>}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-slate-900 transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Collapse View</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
               {currentUser.role === UserRole.ADMIN && activeTab === 'dashboard' ? 'Platform Management' : activeTab.replace('-', ' ')}
            </h2>

            {currentUser.role === UserRole.ADMIN && setSelectedAdminStoreId && (
              <div className="hidden lg:flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200">
                <Globe className="text-blue-600" size={16} />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tenant Context</span>
                  <select 
                    value={selectedAdminStoreId}
                    onChange={(e) => setSelectedAdminStoreId(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-white">Global View</option>
                    {stores.map(s => <option key={s.id} value={s.id} className="bg-white">{s.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDesignModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 hover:bg-rose-600 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles size={14} />
              Request a Design
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                <Bell size={18} />
                {newLeads.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {newLeads.length > 9 ? '9+' : newLeads.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                      New Leads {newLeads.length > 0 && <span className="text-rose-500">({newLeads.length})</span>}
                    </p>
                    {newLeads.length > 0 && (
                      <button onClick={markSeen} className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700">
                        Mark all seen
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {newLeads.length > 0 ? newLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => { setActiveTab('leads'); markSeen(); }}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                      >
                        <p className="text-xs font-black text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px] text-slate-400 font-bold">Via {lead.source || 'Direct'}</p>
                          <p className="text-[9px] text-slate-400 font-bold">
                            {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="px-5 py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        All caught up
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-slate-900 tracking-tight">{currentUser.name}</span>
              <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Access: {currentUser.role}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-500 transition-all cursor-pointer">
              <UserCircle size={28} />
            </div>
          </div>
        </header>

        {currentUser.role === UserRole.ADMIN && selectedAdminStoreId !== 'all' && (
           <div className="bg-blue-600 text-white px-10 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Administrative Mode: Currently managing {activeStoreName}</span>
              </div>
              <button 
                onClick={() => setSelectedAdminStoreId!('all')}
                className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={12} /> Exit to Global View
              </button>
           </div>
        )}

        <main ref={mainRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          <div className="max-w-[1800px] w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>

      {designModalOpen && (
        <RequestDesignModal
          storeName={activeStoreName}
          onClose={() => setDesignModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
