import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Planner from './components/Planner';
import Settings from './components/Settings';
import { 
  Lead, 
  LeadStatus, 
  UserRole, 
  Customer, 
  Claim, 
  Order,
  PlannerEvent,
  InventoryItem
} from './types';
import { MOCK_LEADS, MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CLAIMS, MOCK_INVENTORY } from './services/mockData';
import { db, getCurrentStoreId } from './services/supabase';
import { 
  X, 
  Trash2,
  Eye,
  Edit2,
  ArrowRightCircle
} from 'lucide-react';

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{children}</label>
);

const Input = ({ className, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) => (
  <input 
    onChange={onChange}
    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 ${className || ''}`} 
    {...(props as any)}
  />
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const activeStoreId = getCurrentStoreId();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [l, c, e] = await Promise.all([
          db.leads.list(activeStoreId),
          db.customers.list(activeStoreId),
          db.planner.list(activeStoreId)
        ]);
        setLeads(l.length > 0 ? l : MOCK_LEADS);
        setCustomers(c.length > 0 ? c : MOCK_CUSTOMERS);
        setEvents(e.length > 0 ? e : []);
        setOrders(MOCK_ORDERS);
        setClaims(MOCK_CLAIMS);
        setInventory(MOCK_INVENTORY);
      } catch (err) {
        setLeads(MOCK_LEADS);
        setCustomers(MOCK_CUSTOMERS);
        setOrders(MOCK_ORDERS);
        setClaims(MOCK_CLAIMS);
        setInventory(MOCK_INVENTORY);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [activeStoreId]);

  const [currentUser, setCurrentUser] = useState({
    id: 'u-1',
    name: 'Sarah Platform Admin',
    role: UserRole.ADMIN,
    storeId: activeStoreId
  });

  const handleRoleSwitch = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      setCurrentUser({ id: 'u-1', name: 'Platform Admin', role, storeId: undefined });
    } else {
      setCurrentUser({ id: 'u-2', name: 'Store Operator', role, storeId: activeStoreId });
    }
    setActiveTab('dashboard');
  };

  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    setSelectedItem(item ? JSON.parse(JSON.stringify(item)) : {});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const updateSelectedItem = (key: string, value: any) => {
    setSelectedItem(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const displayType = modalType.replace('View ', '').toLowerCase();
    
    if (selectedItem?.id) {
       const updateFn = (list: any[]) => list.map(item => item.id === selectedItem.id ? { ...item, ...selectedItem, updatedAt: new Date().toISOString() } : item);
       if (displayType.includes('lead')) setLeads(updateFn);
       else if (displayType.includes('customer')) setCustomers(updateFn);
       else if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('sale') || displayType.includes('invoice')) setOrders(updateFn);
       else if (displayType.includes('claim')) setClaims(updateFn);
       else if (displayType.includes('inventory')) setInventory(updateFn);
       else if (displayType.includes('event')) setEvents(updateFn);
    } else {
       const newItem = { 
         ...selectedItem, 
         id: `gen-${Date.now()}`, 
         storeId: activeStoreId, 
         createdAt: new Date().toISOString().split('T')[0],
         updatedAt: new Date().toISOString()
       };
       if (displayType.includes('lead')) setLeads(prev => [newItem, ...prev]);
       else if (displayType.includes('customer')) setCustomers(prev => [newItem, ...prev]);
       else if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('sale') || displayType.includes('invoice')) setOrders(prev => [newItem, ...prev]);
       else if (displayType.includes('claim')) setClaims(prev => [newItem, ...prev]);
       else if (displayType.includes('inventory')) setInventory(prev => [newItem, ...prev]);
       else if (displayType.includes('event')) setEvents(prev => [newItem, ...prev]);
    }

    closeModal();
  };

  const handleDelete = (type: string, id: string) => {
    if (!window.confirm(`Permanently delete this ${type}?`)) return;
    const t = type.toLowerCase();
    if (t === 'lead') setLeads(prev => prev.filter(l => l.id !== id));
    else if (t === 'customer') setCustomers(prev => prev.filter(c => c.id !== id));
    else if (['order', 'quote', 'invoice', 'sale'].includes(t)) setOrders(prev => prev.filter(o => o.id !== id));
    else if (t === 'claim') setClaims(prev => prev.filter(c => c.id !== id));
    else if (t.includes('inventory')) setInventory(prev => prev.filter(i => i.id !== id));
    else if (t === 'event') setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleConvertLead = (lead: Lead) => {
    if (!window.confirm(`Convert ${lead.firstName} to a customer?`)) return;
    const newCust: any = {
      id: `cust-${Date.now()}`,
      storeId: lead.storeId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
      billingDifferent: false,
      notes: `Converted from lead.`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.QUALIFIED } : l));
    setActiveTab('customers');
  };

  const handleConvertQuote = (quote: Order) => {
    if (!window.confirm(`Confirm order placement for Quote #${quote.id.slice(-6)}?`)) return;
    setOrders(prev => prev.map(o => o.id === quote.id ? { ...o, status: 'Processing' } : o));
    setActiveTab('sales-orders');
  };

  const renderModalContent = () => {
    const isView = modalType.startsWith('View');
    const displayType = modalType.replace('View ', '').toLowerCase();
    
    if (isView) {
      return (
        <div className="space-y-6">
           <div className="p-10 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">System Record Metadata</p>
              <h4 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Ref: {selectedItem.id}</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                 {Object.entries(selectedItem).map(([key, val]) => (
                   typeof val !== 'object' && key !== 'id' && (
                     <div key={key} className="flex justify-between border-b border-slate-200/50 pb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                       <span className="text-sm font-bold text-slate-800">{String(val)}</span>
                     </div>
                   )
                 ))}
              </div>
           </div>
        </div>
      );
    }

    if (displayType.includes('customer')) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>First Name</Label><Input defaultValue={selectedItem?.firstName} onChange={e => updateSelectedItem('firstName', e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input defaultValue={selectedItem?.lastName} onChange={e => updateSelectedItem('lastName', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Email Address</Label><Input defaultValue={selectedItem?.email} onChange={e => updateSelectedItem('email', e.target.value)} /></div>
          </div>
        </div>
      );
    }

    if (displayType.includes('lead')) {
      return (
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>First Name</Label><Input defaultValue={selectedItem?.firstName} onChange={e => updateSelectedItem('firstName', e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input defaultValue={selectedItem?.lastName} onChange={e => updateSelectedItem('lastName', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Status</Label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => updateSelectedItem('status', e.target.value)}>
                {Object.values(LeadStatus).map(s => <option key={s} selected={selectedItem?.status === s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (displayType.includes('inventory')) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2"><Label>Product Name</Label><Input defaultValue={selectedItem?.name} onChange={e => updateSelectedItem('name', e.target.value)} /></div>
            <div className="space-y-1"><Label>SKU Code</Label><Input defaultValue={selectedItem?.sku} onChange={e => updateSelectedItem('sku', e.target.value)} /></div>
            <div className="space-y-1"><Label>Stock Qty</Label><Input type="number" defaultValue={selectedItem?.quantity} onChange={e => updateSelectedItem('quantity', Number(e.target.value))} /></div>
          </div>
        </div>
      );
    }

    return <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">Interface Ready for: {displayType}</div>;
  };

  const renderTableActions = (actions: string[], type: string, item: any) => (
    <div className="flex items-center gap-1">
       {actions.includes('convert') && <button onClick={() => handleConvertQuote(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Confirm Order"><ArrowRightCircle size={18} /></button>}
       {actions.includes('view') && <button onClick={() => openModal(`View ${type}`, item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="View"><Eye size={18} /></button>}
       {actions.includes('edit') && <button onClick={() => openModal(type, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit"><Edit2 size={18} /></button>}
       {actions.includes('delete') && currentUser.role === UserRole.ADMIN && <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Delete"><Trash2 size={18} /></button>}
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Tenant Pipeline...</div>;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard leads={leads} orders={orders} claims={claims} customers={customers} />;
      case 'leads': return <LeadList leads={leads} role={currentUser.role} onUpdateStatus={(id, s) => setLeads(prev => prev.map(l => l.id === id ? {...l, status: s} : l))} onConvert={handleConvertLead} onDelete={(id) => handleDelete('lead', id)} onEdit={(lead) => openModal('Lead', lead)} />;
      case 'customers': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Customer Directory</h3><button onClick={() => openModal('Customer')} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase">Add New Account</button></div>
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-8 py-4">Profile</th><th className="px-8 py-4">Contact</th><th className="px-8 py-4">Joined</th><th className="px-8 py-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-8 py-4 text-sm font-bold text-slate-800">{c.firstName} {c.lastName}</td>
                    <td className="px-8 py-4 text-sm text-blue-600">{c.email}</td>
                    <td className="px-8 py-4 text-xs text-slate-400">{c.createdAt}</td>
                    <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete'], 'Customer', c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'sales-orders':
      case 'sales-invoices':
      case 'sales-quotes':
        const statusFilter = activeTab === 'sales-quotes' ? 'Quote' : activeTab === 'sales-invoices' ? 'Invoiced' : 'Processing';
        const displayLabel = activeTab === 'sales-quotes' ? 'Quote' : activeTab === 'sales-invoices' ? 'Invoice' : 'Order';
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">{displayLabel} Ledger</h3><button onClick={() => openModal(displayLabel)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase">Add {displayLabel}</button></div>
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr><th className="px-8 py-4">Reference ID</th><th className="px-8 py-4">Amount (USD)</th><th className="px-8 py-4">Status</th><th className="px-8 py-4">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.filter(o => o.status === statusFilter || (activeTab === 'sales-orders' && o.status !== 'Quote' && o.status !== 'Invoiced')).map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-8 py-4 text-xs font-mono text-slate-400">{o.id.slice(-8)}</td>
                      <td className="px-8 py-4 text-sm font-black text-blue-600">${o.amount.toFixed(2)}</td>
                      <td className="px-8 py-4"><span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 px-3 py-1 rounded-full">{o.status}</span></td>
                      <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete', 'convert'].filter(a => a !== 'convert' || statusFilter === 'Quote'), displayLabel, o)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'inventory': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Warehouse Inventory</h3><button onClick={() => openModal('Inventory Item')} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase">New SKU</button></div>
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-8 py-4">Product Name</th><th className="px-8 py-4">SKU</th><th className="px-8 py-4">Stock Level</th><th className="px-8 py-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-8 py-4 text-sm font-bold text-slate-800">{item.name}</td>
                    <td className="px-8 py-4 text-sm text-slate-500 font-mono">{item.sku}</td>
                    <td className="px-8 py-4"><span className={`text-sm font-black ${item.quantity < 5 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.quantity} units</span></td>
                    <td className="px-8 py-4">{renderTableActions(['edit', 'delete'], 'Inventory Item', item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'planner': return <Planner events={events} onAddEvent={() => openModal('Event')} onEditEvent={(e) => openModal('Event', e)} onDeleteEvent={(id) => handleDelete('event', id)} />;
      case 'settings': return <Settings storeId={activeStoreId} />;
      default: return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Module Active: {activeTab}</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onRoleSwitch={handleRoleSwitch}>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{modalType} {selectedItem?.id && !modalType.startsWith('View') ? '(Live Edit)' : '(New Record)'}</h3>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:scale-110 transition-transform"><X size={20} /></button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">{renderModalContent()}</div>
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={closeModal} className="px-8 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-colors">Discard</button>
              {!modalType.startsWith('View') && <button onClick={handleSave} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-transform">Commit Changes</button>}
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;