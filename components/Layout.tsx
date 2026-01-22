
import React, { useState, useMemo } from 'react';
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
  ChevronLeft 
} from 'lucide-react';
import { UserRole, CabinetStore } from '../types';
import { NAV_ITEMS } from '../constants';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { name: string; role: UserRole; id: string };
  onRoleSwitch: (role: UserRole) => void;
  selectedAdminStoreId?: string;
  setSelectedAdminStoreId?: (id: string) => void;
  stores?: CabinetStore[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onRoleSwitch,
  selectedAdminStoreId,
  setSelectedAdminStoreId,
  stores = []
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ sales: false });

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
        return NAV_ITEMS.filter(item => ['dashboard', 'reports', 'settings'].includes(item.id));
      }
      return NAV_ITEMS;
    }
    
    // REQUIREMENT: Staff (EMPLOYEE) must see exactly what the Shop (CUSTOMER) sees.
    // By returning all NAV_ITEMS here, both roles get access to Leads, Orders, Inventory, etc.
    return NAV_ITEMS;
  }, [currentUser.role, selectedAdminStoreId]);

  const activeStoreName = useMemo(() => {
    if (selectedAdminStoreId === 'all') return 'Global Platform Ledger';
    return stores.find(s => s.id === selectedAdminStoreId)?.name || 'Store Operations';
  }, [selectedAdminStoreId, stores]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-500 bg-slate-900 flex flex-col z-30 shadow-2xl relative`}>
        <div className="p-8 flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40">
            <Building2 className="text-white" size={24} />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
              <span className="font-black text-xl tracking-tighter text-white leading-none">Kitchen<span className="text-blue-500">Unity</span></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {currentUser.role === UserRole.ADMIN ? 'Global Control' : 'Operations ERP'}
              </span>
            </div>
          )}
        </div>

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
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${
                    isSelected && !item.subItems
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <item.icon size={20} className={isSelected && !item.subItems ? 'text-white' : 'group-hover:text-blue-400'} />
                  {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
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
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === sub.id ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
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

        <div className="p-6 border-t border-slate-800/50 space-y-4">
          {isSidebarOpen && (
            <div className="grid grid-cols-3 gap-1 mb-4 p-1 bg-slate-800 rounded-lg">
              <button 
                onClick={() => onRoleSwitch(UserRole.ADMIN)} 
                title="SaaS Administrator"
                className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.ADMIN ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}
              >
                Admin
              </button>
              <button 
                onClick={() => onRoleSwitch(UserRole.CUSTOMER)} 
                title="Shop Owner"
                className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.CUSTOMER ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}
              >
                Shop
              </button>
              <button 
                onClick={() => onRoleSwitch(UserRole.EMPLOYEE)} 
                title="Store Staff"
                className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.EMPLOYEE ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}
              >
                Staff
              </button>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Logout</span>}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Collapse View</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
               {currentUser.role === UserRole.ADMIN && activeTab === 'dashboard' ? 'Platform Management' : activeTab.replace('-', ' ')}
            </h2>

            {currentUser.role === UserRole.ADMIN && setSelectedAdminStoreId && (
              <div className="hidden lg:flex items-center gap-3 bg-slate-900 rounded-2xl px-4 py-2 shadow-lg border border-slate-800">
                <Globe className="text-blue-400" size={16} />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tenant Context</span>
                  <select 
                    value={selectedAdminStoreId}
                    onChange={(e) => setSelectedAdminStoreId(e.target.value)}
                    className="bg-transparent text-white text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">Global View</option>
                    {stores.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
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

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
