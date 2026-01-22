
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Planner from './components/Planner';
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
  PlannerEvent,
  InventoryItem,
  PlannerEventType,
  PlannerEventStatus,
  ClaimStatus,
  Attachment,
  OrderLineItem,
  CabinetStore
} from './types';
import { MOCK_LEADS, MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CLAIMS, MOCK_INVENTORY } from './services/mockData';
import { db } from './services/supabase';
import { 
  X, 
  Trash2,
  Eye,
  Edit2,
  ArrowRightCircle,
  Save,
  Package,
  Calendar,
  AlertCircle,
  Users,
  DollarSign,
  Plus,
  Check,
  FileText,
  Download,
  Paperclip,
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

// --- Shared Internal Components (Preserved for content consistency) ---
const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{children}</label>
);

const Input = ({ className, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) => {
  const Component = props.type === 'textarea' ? 'textarea' : 'input';
  return (
    <Component 
      onChange={onChange}
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 ${props.type === 'textarea' ? 'min-h-[100px] resize-none' : ''} ${className || ''}`} 
      {...(props as any)}
    />
  );
};

const Select = ({ children, onChange, value, className }: { children?: React.ReactNode, onChange: (e: any) => void, value: any, className?: string }) => (
  <select 
    value={value}
    onChange={onChange}
    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none ${className || ''}`}
  >
    {children}
  </select>
);

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Start typing to search...", 
  label = "",
  rightElement
}: { 
  options: { id: string; label: string; sublabel?: string }[]; 
  value: string; 
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
  rightElement?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (query.length === 0) return options.slice(0, 5); 
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query.toLowerCase()) || 
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query.toLowerCase()))
    );
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex items-center justify-between mb-1.5">
        {label && <Label>{label}</Label>}
        {rightElement}
      </div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer hover:border-blue-500/50 transition-all"
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-300'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                autoFocus
                type="text"
                placeholder="Type to filter..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex flex-col items-start px-4 py-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                >
                  <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600">{opt.label}</span>
                  {opt.sublabel && <span className="text-[10px] text-slate-400 font-bold uppercase">{opt.sublabel}</span>}
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FormSection = ({ title, children, icon: Icon }: { title: string, children?: React.ReactNode, icon: any }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
      <Icon size={16} className="text-blue-500" />
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{title}</h4>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const DateBadge = ({ date }: { date: string }) => (
  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
    <Clock size={10} className="text-slate-300" />
    <span className="text-[9px] font-black uppercase tracking-widest leading-none">
      {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
    </span>
  </div>
);

const FilterBar = ({ query, setQuery, filter, setFilter, options }: { query: string; setQuery: (q: string) => void; filter: string; setFilter: (f: string) => void; options: { value: string; label: string }[] }) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 mb-8">
    <div className="relative flex-1 w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input 
        type="text" 
        placeholder="Search records..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold"
      />
    </div>
    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1">
      <Filter size={14} className="text-slate-400 ml-2 hidden md:block" />
      <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 gap-1">
         {options.map(opt => (
           <button
             key={opt.value}
             onClick={() => setFilter(opt.value)}
             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === opt.value ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
           >
             {opt.label}
           </button>
         ))}
      </div>
    </div>
  </div>
);

// --- Main App Component (Refactored for Production architecture) ---
const App: React.FC = () => {
  // Use Global Tenant Context
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');

  useEffect(() => {
    setTableSearch('');
    setTableFilter('all');
  }, [activeTab]);

  const [newLineItemProduct, setNewLineItemProduct] = useState('');
  const [newLineItemQty, setNewLineItemQty] = useState(1);

  // Data states (Scoped by Provider)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [l, c, e] = await Promise.all([
          db.leads.list(effectiveStoreId),
          db.customers.list(effectiveStoreId),
          db.planner.list(effectiveStoreId)
        ]);
        
        setLeads(l.length > 0 ? l : MOCK_LEADS);
        setCustomers(c.length > 0 ? c : MOCK_CUSTOMERS);
        setEvents(e.length > 0 ? e : []);
        setOrders(MOCK_ORDERS);
        setClaims(MOCK_CLAIMS);
        setInventory(MOCK_INVENTORY);
      } catch (err) {
        console.error("Data fetch error:", err);
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
  }, [effectiveStoreId]);

  // Modal Handlers (Preserved UI Logic)
  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    setSelectedItem(item ? JSON.parse(JSON.stringify(item)) : {
      status: type.includes('Lead') ? LeadStatus.NEW : 
              type.includes('Event') ? PlannerEventStatus.SCHEDULED : 
              type.includes('Claim') ? ClaimStatus.OPEN : 
              type.includes('Store') ? 'active' : 'Processing',
      type: type.includes('Event') ? PlannerEventType.MEASUREMENT : undefined,
      trackStock: type.includes('Inventory') ? true : undefined,
      quantity: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
      shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
      attachments: [],
      lineItems: [],
      amount: 0,
      createdAt: new Date().toISOString()
    });
    setNewLineItemProduct('');
    setNewLineItemQty(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const updateSelectedItem = (key: string, value: any) => {
    setSelectedItem((prev: any) => {
      const updated = { ...prev, [key]: value };
      if (key === 'lineItems') {
        const total = (value as OrderLineItem[]).reduce((sum, item) => sum + (item.price * item.quantity), 0);
        updated.amount = total;
      }
      return updated;
    });
  };

  const addLineItem = () => {
    if (!newLineItemProduct) return;
    const prod = inventory.find(i => i.id === newLineItemProduct);
    if (!prod) return;

    const newItem: OrderLineItem = {
      id: `li-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: newLineItemQty,
      price: prod.price
    };

    const currentItems = selectedItem.lineItems || [];
    updateSelectedItem('lineItems', [...currentItems, newItem]);
    setNewLineItemProduct('');
    setNewLineItemQty(1);
  };

  const removeLineItem = (id: string) => {
    const currentItems = selectedItem.lineItems || [];
    updateSelectedItem('lineItems', currentItems.filter((i: OrderLineItem) => i.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: file.type,
        data: base64,
        createdAt: new Date().toISOString()
      };
      
      const currentAttachments = selectedItem.attachments || [];
      updateSelectedItem('attachments', [...currentAttachments, newAttachment]);
    };
    reader.readAsDataURL(file);
  };

  const downloadAttachment = (att: Attachment) => {
    const link = document.createElement('a');
    link.href = att.data;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeAttachment = (id: string) => {
    const currentAttachments = selectedItem.attachments || [];
    updateSelectedItem('attachments', currentAttachments.filter((a: Attachment) => a.id !== id));
  };

  const handleQuickCustomerSave = async () => {
    if (!quickCustomer.firstName || !quickCustomer.email) {
      alert("Please enter a first name and email.");
      return;
    }
    
    const newCustPayload = {
      ...quickCustomer,
      storeId: effectiveStoreId,
      shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
      billingDifferent: false,
      notes: 'Added from order flow.',
      createdAt: new Date().toISOString()
    };

    try {
      const saved = await db.customers.create(newCustPayload);
      const mappedSaved = { ...saved, id: saved.id || `gen-${Date.now()}` };
      setCustomers((prev: Customer[]) => [mappedSaved as any, ...prev]);
      updateSelectedItem('customerId', mappedSaved.id);
      setIsQuickCustomerOpen(false);
      setQuickCustomer({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err) {
      console.error('Customer create error:', err);
      alert("Database persistence failure.");
    }
  };

  const handleSave = async () => {
    const displayType = modalType.replace('View ', '').toLowerCase();
    
    try {
      if (selectedItem?.id && !selectedItem.id.toString().startsWith('gen-')) {
        if (displayType.includes('lead')) {
          await db.leads.update(selectedItem.id, selectedItem);
          setLeads((prev: Lead[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item));
        } else if (displayType.includes('customer')) {
          await db.customers.update(selectedItem.id, selectedItem);
          setCustomers((prev: Customer[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item));
        } else if (displayType.includes('event')) {
          await db.planner.update(selectedItem.id, selectedItem);
          setEvents((prev: PlannerEvent[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item));
        } else if (displayType.includes('store')) {
          setStores((prev: CabinetStore[]) => prev.map((s) => s.id === selectedItem.id ? { ...s, ...selectedItem } : s));
        }
      } else {
        const newItemPayload = { ...selectedItem, storeId: effectiveStoreId };
        
        if (displayType.includes('lead')) {
          const saved = await db.leads.create(newItemPayload);
          setLeads((prev: Lead[]) => [saved as any, ...prev]);
        } else if (displayType.includes('customer')) {
          const saved = await db.customers.create(newItemPayload);
          setCustomers((prev: Customer[]) => [saved as any, ...prev]);
        } else if (displayType.includes('event')) {
          const saved = await db.planner.create(newItemPayload);
          setEvents((prev: PlannerEvent[]) => [saved as any, ...prev]);
        } else if (displayType.includes('store')) {
           const mockStore: CabinetStore = {
             id: `store-${Date.now()}`,
             name: selectedItem.name,
             domain: selectedItem.domain,
             ownerEmail: selectedItem.ownerEmail,
             status: 'active',
             createdAt: new Date().toISOString()
           };
           setStores((prev: CabinetStore[]) => [...prev, mockStore]);
        } else {
          const mockId = `gen-${Date.now()}`;
          const mockItem = { ...selectedItem, id: mockId, createdAt: new Date().toISOString() };
          if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('sale')) setOrders((prev: Order[]) => [mockItem, ...prev]);
          else if (displayType.includes('claim')) setClaims((prev: Claim[]) => [mockItem, ...prev]);
          else if (displayType.includes('inventory')) setInventory((prev: InventoryItem[]) => [mockItem, ...prev]);
        }
      }
      closeModal();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Persistence error.');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm(`Permanently delete this ${type}?`)) return;
    const t = type.toLowerCase();
    
    try {
      if (t === 'lead') {
        await db.leads.delete(id);
        setLeads((prev: Lead[]) => prev.filter((l) => l.id !== id));
      } else if (t === 'customer') {
        await db.customers.delete(id);
        setCustomers((prev: Customer[]) => prev.filter((c) => c.id !== id));
      } else if (t === 'event') {
        await db.planner.delete(id);
        setEvents((prev: PlannerEvent[]) => prev.filter((e) => e.id !== id));
      } else {
        if (['order', 'quote', 'invoice', 'sale'].includes(t)) setOrders((prev: Order[]) => prev.filter((o) => o.id !== id));
        else if (t === 'claim') setClaims((prev: Claim[]) => prev.filter((c) => c.id !== id));
        else if (t.includes('inventory')) setInventory((prev: InventoryItem[]) => prev.filter((i) => i.id !== id));
        else if (t.includes('store')) setStores((prev: CabinetStore[]) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failure.');
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    if (!window.confirm(`Convert ${lead.firstName} to customer?`)) return;
    const newCustPayload = {
      storeId: lead.storeId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
      billingDifferent: false,
      notes: 'Converted from lead.',
      createdAt: new Date().toISOString()
    };

    try {
      const savedCustomer = await db.customers.create(newCustPayload);
      await db.leads.update(lead.id, { ...lead, status: LeadStatus.QUALIFIED });
      setCustomers((prev: Customer[]) => [savedCustomer as any, ...prev]);
      setLeads((prev: Lead[]) => prev.map((l) => l.id === lead.id ? { ...l, status: LeadStatus.QUALIFIED } : l));
      setActiveTab('customers');
    } catch (err) {
      console.error('Conversion failed:', err);
      alert('Conversion failure.');
    }
  };

  const handleConvertQuote = (quote: Order) => {
    if (!window.confirm(`Confirm order placement for Quote #${quote.id.slice(-6)}?`)) return;
    setOrders((prev: Order[]) => prev.map((o) => o.id === quote.id ? { ...o, status: 'Processing' } : o));
    setActiveTab('sales-orders');
  };

  // RBAC Filtered Data (Preserved Table Logic)
  const filteredCustomersTable = useMemo(() => {
    return customers.filter((c: Customer) => 
      c.firstName.toLowerCase().includes(tableSearch.toLowerCase()) || 
      c.lastName.toLowerCase().includes(tableSearch.toLowerCase()) || 
      c.email.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [customers, tableSearch]);

  const filteredOrdersTable = useMemo(() => {
    return orders.filter((o: Order) => {
      const customer = customers.find(c => c.id === o.customerId);
      const customerName = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
      const matchesSearch = o.id.toLowerCase().includes(tableSearch.toLowerCase()) || customerName.includes(tableSearch.toLowerCase());
      const matchesFilter = tableFilter === 'all' || o.status === tableFilter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, customers, tableSearch, tableFilter]);

  const filteredClaims = useMemo(() => {
    return claims.filter((cl: Claim) => {
      const customer = customers.find(c => c.id === cl.customerId);
      const customerName = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
      const matchesSearch = cl.id.toLowerCase().includes(tableSearch.toLowerCase()) || 
                           cl.issue.toLowerCase().includes(tableSearch.toLowerCase()) || 
                           customerName.includes(tableSearch.toLowerCase());
      const matchesFilter = tableFilter === 'all' || cl.status === tableFilter;
      return matchesSearch && matchesFilter;
    });
  }, [claims, customers, tableSearch, tableFilter]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((i: InventoryItem) => {
      const matchesSearch = i.name.toLowerCase().includes(tableSearch.toLowerCase()) || i.sku.toLowerCase().includes(tableSearch.toLowerCase());
      const matchesFilter = tableFilter === 'all' || i.status === tableFilter;
      return matchesSearch && matchesFilter;
    });
  }, [inventory, tableSearch, tableFilter]);

  // Modal Content Logic (Preserved exactly as requested)
  const renderModalContent = () => {
    const isView = modalType.startsWith('View');
    const displayType = modalType.replace('View ', '').toLowerCase();
    const attachments: Attachment[] = selectedItem?.attachments || [];
    const lineItems: OrderLineItem[] = selectedItem?.lineItems || [];
    
    if (isView) {
      return (
        <div className="space-y-6">
           <div className="p-10 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Metadata</p>
              <h4 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase">ID: {selectedItem.id}</h4>
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
           {lineItems.length > 0 && (
             <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-2">Line Items</h4>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[400px]">
                   <thead>
                     <tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-50">
                       <th className="pb-2">Item</th>
                       <th className="text-center pb-2">Qty</th>
                       <th className="text-right pb-2">Unit</th>
                       <th className="text-right pb-2">Total</th>
                     </tr>
                   </thead>
                   <tbody>
                     {lineItems.map(item => (
                       <tr key={item.id}>
                         <td className="py-2 text-sm font-bold text-slate-800">{item.productName}</td>
                         <td className="py-2 text-center text-sm font-bold text-slate-600">{item.quantity}</td>
                         <td className="py-2 text-right text-sm font-medium text-slate-500">${item.price.toFixed(2)}</td>
                         <td className="py-2 text-right text-sm font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400">Total Due</p>
                    <p className="text-2xl font-black text-slate-900">${(selectedItem?.amount || 0).toFixed(2)}</p>
                  </div>
               </div>
             </div>
           )}
           {attachments.length > 0 && (
             <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-2">Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-blue-500 transition-all">
                      <span className="text-xs font-bold text-slate-800 truncate" title={att.name}>{att.name}</span>
                      <button onClick={() => downloadAttachment(att)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Download size={14} /></button>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      );
    }

    if (displayType.includes('customer')) {
      const localUpdateAddress = (field: string, val: string) => {
        const current = selectedItem?.shippingAddress || { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' };
        updateSelectedItem('shippingAddress', { ...current, [field]: val });
      };

      return (
        <div className="space-y-10">
          <FormSection title="Profile" icon={Users}>
            <div className="space-y-1"><Label>First Name</Label><Input value={selectedItem?.firstName} onChange={e => updateSelectedItem('firstName', e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input value={selectedItem?.lastName} onChange={e => updateSelectedItem('lastName', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Email</Label><Input value={selectedItem?.email} onChange={e => updateSelectedItem('email', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Phone</Label><Input value={selectedItem?.phone} onChange={e => updateSelectedItem('phone', e.target.value)} /></div>
          </FormSection>
          <FormSection title="Shipping" icon={Package}>
            <div className="space-y-1 col-span-2"><Label>Address</Label><Input value={selectedItem?.shippingAddress?.address1} onChange={e => localUpdateAddress('address1', e.target.value)} /></div>
            <div className="space-y-1"><Label>City</Label><Input value={selectedItem?.shippingAddress?.city} onChange={e => localUpdateAddress('city', e.target.value)} /></div>
            <div className="space-y-1"><Label>State</Label><Input value={selectedItem?.shippingAddress?.state} onChange={(e) => localUpdateAddress('state', e.target.value)} /></div>
            <div className="space-y-1"><Label>Zip</Label><Input value={selectedItem?.shippingAddress?.zip} onChange={e => localUpdateAddress('zip', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('lead')) {
      return (
        <div className="space-y-10">
          <FormSection title="Inquiry Source" icon={Users}>
            <div className="space-y-1"><Label>First Name</Label><Input value={selectedItem?.firstName} onChange={e => updateSelectedItem('firstName', e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input value={selectedItem?.lastName} onChange={e => updateSelectedItem('lastName', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Email</Label><Input value={selectedItem?.email} onChange={e => updateSelectedItem('email', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Phone</Label><Input value={selectedItem?.phone} onChange={e => updateSelectedItem('phone', e.target.value)} /></div>
            <div className="space-y-1"><Label>Status</Label>
               <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                 {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
               </Select>
            </div>
            <div className="space-y-1"><Label>Source</Label><Input value={selectedItem?.source} onChange={e => updateSelectedItem('source', e.target.value)} /></div>
          </FormSection>
          <FormSection title="Message" icon={AlertCircle}>
            <div className="space-y-1 col-span-2"><Label>Content</Label><Input type="textarea" value={selectedItem?.message} onChange={e => updateSelectedItem('message', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('claim')) {
      return (
        <div className="space-y-10">
          <FormSection title="Claim Information" icon={AlertCircle}>
            <div className="space-y-1 col-span-2">
              <SearchableSelect 
                label="Affected Customer"
                options={customers.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}`, sublabel: c.email }))}
                value={selectedItem?.customerId}
                onChange={id => updateSelectedItem('customerId', id)}
              />
            </div>
            <div className="space-y-1"><Label>Status</Label>
               <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                 {Object.values(ClaimStatus).map(s => <option key={s} value={s}>{s}</option>)}
               </Select>
            </div>
          </FormSection>
          <FormSection title="Problem Context" icon={Package}>
             <div className="space-y-1 col-span-2"><Label>Issue Details</Label><Input type="textarea" value={selectedItem?.issue} onChange={e => updateSelectedItem('issue', e.target.value)} /></div>
             <div className="space-y-1 col-span-2"><Label>Resolution Notes</Label><Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice') || displayType.includes('sale')) {
      return (
        <div className="space-y-10">
          <FormSection title="Context" icon={DollarSign}>
            <div className="space-y-1 col-span-2">
              <SearchableSelect 
                label="Customer"
                options={customers.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}`, sublabel: c.email }))}
                value={selectedItem?.customerId}
                onChange={id => updateSelectedItem('customerId', id)}
                rightElement={<button onClick={() => setIsQuickCustomerOpen(true)} className="text-[9px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"><UserPlus size={10} /> Quick Add</button>}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                <option value="Quote">Quote</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          </FormSection>
          <FormSection title="Products" icon={ShoppingCart}>
             <div className="col-span-2 space-y-4">
                <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex-1 space-y-1">
                      <SearchableSelect 
                        label="Product"
                        options={inventory.map(i => ({ id: i.id, label: i.name, sublabel: `SKU: ${i.sku}` }))}
                        value={newLineItemProduct}
                        onChange={id => setNewLineItemProduct(id)}
                      />
                   </div>
                   <div className="w-20 space-y-1"><Label>Qty</Label><Input type="number" value={newLineItemQty} onChange={e => setNewLineItemQty(Number(e.target.value))} min={1} /></div>
                   <button onClick={addLineItem} className="px-4 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase h-[44px]">Add</button>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-x-auto">
                   <table className="w-full text-left min-w-[500px]">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                         <tr><th className="px-4 py-2">Catalog Item</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">#</th></tr>
                      </thead>
                      <tbody>
                        {lineItems.map(item => (
                          <tr key={item.id} className="text-sm">
                             <td className="px-4 py-2 font-bold">{item.productName}</td>
                             <td className="px-4 py-2 text-center">{item.quantity}</td>
                             <td className="px-4 py-2 text-right text-slate-500">${item.price.toFixed(2)}</td>
                             <td className="px-4 py-2 text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
                             <td className="px-4 py-2 text-right"><button onClick={() => removeLineItem(item.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={12}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
                <div className="bg-slate-900 text-white p-6 rounded-[24px] flex justify-between items-center shadow-lg">
                   <span className="text-xs font-black uppercase text-blue-400">Total Revenue</span>
                   <span className="text-3xl font-black">${(selectedItem?.amount || 0).toFixed(2)}</span>
                </div>
             </div>
          </FormSection>
          <FormSection title="Attachments & Notes" icon={Package}>
            <div className="col-span-2 space-y-4">
              <Label>Internal Notes</Label>
              <Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} />
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Label>Documents ({attachments.length})</Label>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase"><Paperclip size={12}/> Link File</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-xs font-bold truncate pr-2">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="text-rose-500 p-1"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('event')) {
      return (
        <div className="space-y-10">
          <FormSection title="Event Timing" icon={Calendar}>
             <div className="space-y-1"><Label>Type</Label>
               <Select value={selectedItem?.type} onChange={e => updateSelectedItem('type', e.target.value)}>
                 {Object.values(PlannerEventType).map(t => <option key={t} value={t}>{t}</option>)}
               </Select>
             </div>
             <div className="space-y-1"><Label>Date</Label><Input type="date" value={selectedItem?.date} onChange={e => updateSelectedItem('date', e.target.value)} /></div>
             <div className="space-y-1 col-span-2">
               <SearchableSelect 
                 label="Associated Customer"
                 options={customers.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}`, sublabel: c.email }))}
                 value={selectedItem?.customerId}
                 onChange={id => {
                   const cust = customers.find(c => c.id === id);
                   updateSelectedItem('customerId', id);
                   if (cust) updateSelectedItem('customerName', `${cust.firstName} ${cust.lastName}`);
                 }}
               />
             </div>
          </FormSection>
          <FormSection title="Logistics" icon={Package}>
             <div className="space-y-1 col-span-2"><Label>Site Address</Label><Input value={selectedItem?.address} onChange={e => updateSelectedItem('address', e.target.value)} /></div>
             <div className="space-y-1 col-span-2"><Label>Notes</Label><Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('inventory')) {
      return (
        <div className="space-y-10">
          <FormSection title="Catalog Entry" icon={Package}>
            <div className="space-y-1 col-span-2"><Label>Product Name</Label><Input value={selectedItem?.name} onChange={e => updateSelectedItem('name', e.target.value)} /></div>
            <div className="space-y-1"><Label>SKU</Label><Input value={selectedItem?.sku} onChange={e => updateSelectedItem('sku', e.target.value)} /></div>
            <div className="space-y-1"><Label>Base Price ($)</Label><Input type="number" value={selectedItem?.price} onChange={e => updateSelectedItem('price', Number(e.target.value))} /></div>
            <div className="space-y-4 col-span-1">
              <Label>Track Inventory</Label>
              <button 
                onClick={() => updateSelectedItem('trackStock', !selectedItem?.trackStock)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${selectedItem?.trackStock ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
              >
                {selectedItem?.trackStock ? <Check size={14}/> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"/>}
                {selectedItem?.trackStock ? 'Active' : 'Off'}
              </button>
            </div>
            {selectedItem?.trackStock && (
              <div className="space-y-1"><Label>Current Qty</Label><Input type="number" value={selectedItem?.quantity} onChange={e => updateSelectedItem('quantity', Number(e.target.value))} /></div>
            )}
            <div className="space-y-1"><Label>Status</Label>
               <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                 <option value="In Stock">In Stock</option>
                 <option value="Low Stock">Low Stock</option>
                 <option value="Out of Stock">Out of Stock</option>
               </Select>
            </div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('store')) {
       return (
         <div className="space-y-10">
            <FormSection title="Store Identity" icon={Store}>
               <div className="space-y-1 col-span-2"><Label>Business Name</Label><Input value={selectedItem?.name} onChange={e => updateSelectedItem('name', e.target.value)} /></div>
               <div className="space-y-1"><Label>Custom Domain</Label><Input value={selectedItem?.domain} onChange={e => updateSelectedItem('domain', e.target.value)} /></div>
               <div className="space-y-1"><Label>Owner Email</Label><Input value={selectedItem?.ownerEmail} onChange={e => updateSelectedItem('ownerEmail', e.target.value)} /></div>
            </FormSection>
         </div>
       );
    }

    return <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">Interface Ready for: {displayType}</div>;
  };

  const renderTableActions = (actions: string[], type: string, item: any) => (
    <div className="flex items-center gap-1 justify-end">
       {actions.includes('convert') && <button onClick={() => handleConvertQuote(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Confirm Order"><ArrowRightCircle size={18} /></button>}
       {actions.includes('view') && <button onClick={() => openModal(`View ${type}`, item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="View"><Eye size={18} /></button>}
       {actions.includes('edit') && <button onClick={() => openModal(type, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit"><Edit2 size={18} /></button>}
       {actions.includes('delete') && currentUser.role === UserRole.ADMIN && <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete"><Trash2 size={18} /></button>}
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4"><Clock className="animate-spin" size={24} /> Syncing Records...</div>;
    
    // Admin Global Dashboard View
    if (currentUser.role === UserRole.ADMIN && activeTab === 'dashboard') {
      return (
        <div className="space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Platform Control</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Multi-tenant management & global operations</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl flex items-center gap-3">
                  <Activity size={18} className="text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">System Health</p>
                    <p className="text-sm font-bold text-slate-900">100% Online</p>
                  </div>
               </div>
               <div className="bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl flex items-center gap-3">
                  <Globe size={18} className="text-blue-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Active Regions</p>
                    <p className="text-sm font-bold text-slate-900">4 Data Centers</p>
                  </div>
               </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global ARR</p>
                <h3 className="text-4xl font-black tracking-tighter text-blue-400">$1.2M <span className="text-xs text-slate-500 font-bold tracking-normal text-white/50">USD</span></h3>
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1"><ArrowRightCircle size={12} /> +18% MoM Growth</p>
             </div>
             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Stores</p>
                <h3 className="text-4xl font-black tracking-tighter text-slate-900">{stores.length} <span className="text-xs text-slate-400 font-bold tracking-normal italic uppercase">Tenants</span></h3>
                <p className="text-xs text-blue-500 font-bold">2 Pending Provisioning</p>
             </div>
             <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Load</p>
                <h3 className="text-4xl font-black tracking-tighter text-slate-900">8 <span className="text-xs text-slate-400 font-bold tracking-normal italic uppercase">Avg Tix / Day</span></h3>
                <p className="text-xs text-rose-500 font-bold">Priority Resolution: Active</p>
             </div>
          </div>

          <StoreManager stores={stores} onSelectStore={(s) => { setSelectedAdminStoreId(s.id); setActiveTab('dashboard'); }} onProvisionStore={() => openModal('Store')} />
        </div>
      );
    }

    // Dynamic Routing based on Tab (Preserved Tab Content)
    switch (activeTab) {
      case 'dashboard': return <Dashboard leads={leads} orders={orders} claims={claims} customers={customers} />;
      case 'leads': return <LeadList leads={leads} role={currentUser.role} onUpdateStatus={(id, s) => setLeads((prev: Lead[]) => prev.map((l) => l.id === id ? {...l, status: s} : l))} onConvert={handleConvertLead} onDelete={(id) => handleDelete('lead', id)} onEdit={(lead) => openModal('Lead', lead)} />;
      case 'customers': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Customers</h3><button onClick={() => openModal('Customer')} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">Add Customer</button></div>
          <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: 'All Accounts' }]} />
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Account Holder</th>
                    {selectedAdminStoreId === 'all' && currentUser.role === UserRole.ADMIN && <th className="px-8 py-4">Tenant</th>}
                    <th className="px-8 py-4">Email Gateway</th>
                    <th className="px-8 py-4">Created On</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomersTable.map(c => {
                    const tenant = stores.find(s => s.id === c.storeId);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4"><p className="text-sm font-bold text-slate-800">{c.firstName} {c.lastName}</p><p className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(-6)}</p></td>
                        {selectedAdminStoreId === 'all' && currentUser.role === UserRole.ADMIN && (
                          <td className="px-8 py-4"><span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{tenant?.name || 'Unknown'}</span></td>
                        )}
                        <td className="px-8 py-4 text-sm text-blue-600 font-bold">{c.email}</td>
                        <td className="px-8 py-4"><DateBadge date={c.createdAt} /></td>
                        <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete'], 'Customer', c)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">{displayLabel} Operations</h3><button onClick={() => openModal(displayLabel)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">Draft {displayLabel}</button></div>
            <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: `All ${displayLabel}s` }]} />
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-4">Transaction ID</th><th className="px-8 py-4">Client</th><th className="px-8 py-4">Revenue</th><th className="px-8 py-4">Fulfillment</th><th className="px-8 py-4">Date</th><th className="px-8 py-4 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrdersTable.filter(o => o.status === statusFilter || (activeTab === 'sales-orders' && o.status !== 'Quote' && o.status !== 'Invoiced')).map(o => {
                      const customer = customers.find(c => c.id === o.customerId);
                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 text-xs font-mono text-slate-400">{o.id.slice(-8)}</td>
                          <td className="px-8 py-4 text-sm font-bold text-slate-800">{customer ? `${customer.firstName} ${customer.lastName}` : 'Direct Sale'}</td>
                          <td className="px-8 py-4 text-sm font-black text-blue-600">${o.amount.toFixed(2)}</td>
                          <td className="px-8 py-4"><span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 px-3 py-1 rounded-full">{o.status}</span></td>
                          <td className="px-8 py-4"><DateBadge date={o.createdAt} /></td>
                          <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete', 'convert'].filter(a => a !== 'convert' || statusFilter === 'Quote'), displayLabel, o)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'inventory': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Inventory</h3><button onClick={() => openModal('Inventory Item')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 tracking-widest"><Plus size={14} /> Provision Catalog</button></div>
          <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: 'Full Catalog' }, { value: 'In Stock', label: 'In Stock' }, { value: 'Low Stock', label: 'Low Stock' }, { value: 'Out of Stock', label: 'Depleted' }]} />
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="px-8 py-4">Asset Label</th><th className="px-8 py-4">SKU Code</th><th className="px-8 py-4">Physical Stock</th><th className="px-8 py-4">Listed On</th><th className="px-8 py-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4"><p className="text-sm font-bold text-slate-800">{item.name}</p><p className="text-[10px] text-blue-500 font-bold">${item.price.toFixed(2)} unit</p></td>
                      <td className="px-8 py-4 text-sm text-slate-500 font-mono tracking-tighter uppercase">{item.sku}</td>
                      <td className="px-8 py-4">{item.trackStock ? <span className={`text-sm font-black ${item.quantity < 5 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.quantity} units</span> : <span className="text-xs font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Unlimited</span>}</td>
                      <td className="px-8 py-4"><DateBadge date={item.createdAt} /></td>
                      <td className="px-8 py-4">{renderTableActions(['edit', 'delete'], 'Inventory Item', item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 'planner': return <Planner events={events} onAddEvent={() => openModal('Event')} onEditEvent={(e) => openModal('Event', e)} onDeleteEvent={(id) => handleDelete('event', id)} />;
      case 'claims': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Claims</h3><button onClick={() => openModal('Claim')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 tracking-widest"><Plus size={14} /> New Claim</button></div>
          <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: 'All Tickets' }, { value: ClaimStatus.OPEN, label: 'Open' }, { value: ClaimStatus.IN_PROGRESS, label: 'In Progress' }, { value: ClaimStatus.RESOLVED, label: 'Resolved' }]} />
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="px-8 py-4">Ref</th><th className="px-8 py-4">Customer</th><th className="px-8 py-4">Issue Description</th><th className="px-8 py-4">Workflow</th><th className="px-8 py-4">Opened On</th><th className="px-8 py-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map(claim => {
                    const customer = customers.find(c => c.id === claim.customerId);
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 text-xs font-mono text-slate-400">#{claim.id.slice(-6)}</td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-800">{customer ? `${customer.firstName} ${customer.lastName}` : 'Direct Sale'}</td>
                        <td className="px-8 py-4 text-sm text-slate-500 truncate max-w-[200px]">{claim.issue}</td>
                        <td className="px-8 py-4"><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${claim.status === ClaimStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{claim.status}</span></td>
                        <td className="px-8 py-4"><DateBadge date={claim.createdAt} /></td>
                        <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete'], 'Claim', claim)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 'reports': return <Reports leads={leads} orders={orders} claims={claims} />;
      case 'accounting': return <Accounting orders={orders} />;
      case 'settings': return <Settings storeId={effectiveStoreId} onLeadAdded={(newLead) => setLeads(prev => [newLead, ...prev])} />;
      default: return <Dashboard leads={leads} orders={orders} claims={claims} customers={customers} />;
    }
  };

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
      {/* Quick Add Modal (Content preserved) */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
           <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                 <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Quick Customer Add</h4>
                 <button onClick={() => setIsQuickCustomerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>First Name</Label><Input value={quickCustomer.firstName} onChange={e => setQuickCustomer((prev: any) => ({...prev, firstName: e.target.value}))}/></div>
                    <div className="space-y-1"><Label>Last Name</Label><Input value={quickCustomer.lastName} onChange={e => setQuickCustomer((prev: any) => ({...prev, lastName: e.target.value}))}/></div>
                 </div>
                 <div className="space-y-1"><Label>Email</Label><Input type="email" value={quickCustomer.email} onChange={e => setQuickCustomer((prev: any) => ({...prev, email: e.target.value}))}/></div>
                 <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={quickCustomer.phone} onChange={e => setQuickCustomer((prev: any) => ({...prev, phone: e.target.value}))}/></div>
              </div>
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setIsQuickCustomerOpen(false)} className="px-6 py-2 text-xs font-bold text-slate-500 uppercase">Cancel</button>
                 <button onClick={handleQuickCustomerSave} className="px-8 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-500/20">Add Customer</button>
              </div>
           </div>
        </div>
      )}

      {/* Main Form/View Modal (Content preserved) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg"><FileText size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{modalType}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{selectedItem?.id && !modalType.startsWith('View') ? 'LIVE SYSTEM REVISION' : 'NEW SYSTEM RECORD'}</p>
                  </div>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:scale-110 transition-all"><X size={20} /></button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">{renderModalContent()}</div>
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={closeModal} className="px-8 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-colors">Discard</button>
              {!modalType.startsWith('View') && <button onClick={handleSave} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Save size={14} /> Commit Changes</button>}
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
