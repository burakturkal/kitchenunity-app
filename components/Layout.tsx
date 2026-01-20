
import React, { useState } from 'react';
import { 
  UserCircle, 
  Menu, 
  X, 
  Building2, 
  ChevronRight,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { UserRole } from '../types';
import { NAV_ITEMS, NavItem } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { name: string; role: UserRole; id: string };
  onRoleSwitch: (role: UserRole) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onRoleSwitch }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ sales: false });

  const toggleSubMenu = (id: string) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-500 bg-slate-900 flex flex-col z-30 shadow-2xl relative`}>
        <div className="p-8 flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/40">
            <Building2 className="text-white" size={24} />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-white leading-none">Kitchen<span className="text-blue-500">Unity</span></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise ERP</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
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
              <button onClick={() => onRoleSwitch(UserRole.ADMIN)} className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.ADMIN ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}>Admin</button>
              <button onClick={() => onRoleSwitch(UserRole.EMPLOYEE)} className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.EMPLOYEE ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}>Staff</button>
              <button onClick={() => onRoleSwitch(UserRole.CUSTOMER)} className={`text-[9px] p-1.5 rounded font-black uppercase tracking-tighter ${currentUser.role === UserRole.CUSTOMER ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}>Store</button>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-sm">Logout Session</span>}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-slate-900 tracking-tight">{currentUser.name}</span>
              <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Operational Key: {currentUser.id}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-500 transition-all cursor-pointer">
              <UserCircle size={28} />
            </div>
          </div>
        </header>

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
