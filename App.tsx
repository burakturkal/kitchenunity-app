import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Accounting from './components/Accounting';
import StoreManager from './components/StoreManager';
import { useTenant } from './components/StoreProvider';

import {
  Lead,
  LeadStatus,
  UserRole,
  Customer,
  Claim,
  Order,
  InventoryItem,
  ClaimStatus,
  Attachment,
  OrderLineItem,
  CabinetStore
} from './types';

import {
  MOCK_LEADS,
  MOCK_ORDERS,
  MOCK_CUSTOMERS,
  MOCK_CLAIMS,
  MOCK_INVENTORY
} from './services/mockData';

import { db } from './services/supabase';

import {
  X,
  Trash2,
  Eye,
  Edit2,
  ArrowRightCircle,
  Save,
  Package,
  AlertCircle,
  Users,
  DollarSign,
  Plus,
  Check,
  FileText,
  Download,
  ShoppingCart,
  Clock,
  Search,
  Filter,
  ChevronDown,
  UserPlus,
  Activity,
  Globe,
  Store
} from 'lucide-react';

/* =========================
   SHARED UI HELPERS
========================= */

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
    {children}
  </label>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) => {
  const Component = props.type === 'textarea' ? 'textarea' : 'input';
  return (
    <Component
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${props.type === 'textarea' ? 'min-h-[100px] resize-none' : ''} ${className || ''}`}
      {...(props as any)}
    />
  );
};

const Select = ({ children, onChange, value }: any) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
  >
    {children}
  </select>
);

/* =========================
   APP
========================= */

const App: React.FC = () => {
  const {
    effectiveStoreId,
    currentUser,
    handleRoleSwitch,
    selectedAdminStoreId,
    setSelectedAdminStoreId,
    stores,
    setStores
  } = useTenant();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  /* =========================
     DATA LOAD (NO PLANNER)
  ========================= */

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [l, c, cl] = await Promise.all([
          db.leads.list(effectiveStoreId),
          db.customers.list(effectiveStoreId),
          db.claims.list(effectiveStoreId)
        ]);

        setLeads(l.length ? l : MOCK_LEADS);
        setCustomers(c.length ? c : MOCK_CUSTOMERS);
        setClaims(cl.length ? cl : MOCK_CLAIMS);
        setOrders(MOCK_ORDERS);
        setInventory(MOCK_INVENTORY);
      } catch (err) {
        console.error('Initial load failed:', err);
        setLeads(MOCK_LEADS);
        setCustomers(MOCK_CUSTOMERS);
        setClaims(MOCK_CLAIMS);
        setOrders(MOCK_ORDERS);
        setInventory(MOCK_INVENTORY);
      } finally {
        setIsLoading(false);
      }
    };

    if (effectiveStoreId) {
      loadData();
    }
  }, [effectiveStoreId]);

  /* =========================
     RENDER
  ========================= */

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
        <Clock className="animate-spin" size={24} />
        Syncing Records…
      </div>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentUser={currentUser}
      onRoleSwitch={handleRoleSwitch}
      selectedAdminStoreId={selectedAdminStoreId}
      setSelectedAdminStoreId={setSelectedAdminStoreId}
      stores={stores}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          leads={leads}
          orders={orders}
          claims={claims}
          customers={customers}
        />
      )}

      {activeTab === 'leads' && (
        <LeadList
          leads={leads}
          role={currentUser.role}
          onUpdateStatus={(id, s) =>
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status: s } : l))
          }
          onConvert={() => {}}
          onDelete={() => {}}
          onEdit={() => {}}
        />
      )}

      {activeTab === 'customers' && (
        <Dashboard
          leads={[]}
          orders={orders}
          claims={claims}
          customers={customers}
        />
      )}

      {activeTab === 'claims' && (
        <Dashboard
          leads={leads}
          orders={orders}
          claims={claims}
          customers={customers}
        />
      )}

      {activeTab === 'reports' && (
        <Reports leads={leads} orders={orders} claims={claims} />
      )}

      {activeTab === 'accounting' && (
        <Accounting orders={orders} />
      )}

      {activeTab === 'settings' && (
        <Settings storeId={effectiveStoreId} onLeadAdded={(l) => setLeads(p => [l, ...p])} />
      )}

      {currentUser.role === UserRole.ADMIN && activeTab === 'admin' && (
        <StoreManager
          stores={stores}
          onSelectStore={(s) => {
            setSelectedAdminStoreId(s.id);
            setActiveTab('dashboard');
          }}
          onProvisionStore={() => {}}
        />
      )}
    </Layout>
  );
};

export default App;
