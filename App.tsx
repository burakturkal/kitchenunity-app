import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ResetPassword from './components/ResetPassword';
import { useRoute } from './components/SimpleRouter';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Planner from './components/Planner';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Accounting from './components/Accounting';
import Help from './components/Help';
import Notes from './components/Notes';
import StoreManager from './components/StoreManager';
import CustomerProfile from './components/CustomerProfile';
import OrderKanban from './components/OrderKanban';
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
  Store,
  Mail,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

// --- Shared Internal Components ---
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

// Update the calculation logic to fix discrepancies
// Update the taxRate logic to use the global sales tax rate as the fallback
const calculateOrderSummary = async (lineItems, taxRate, totalExpenses, effectiveStoreId) => {
  // Fetch global sales tax rate if no taxRate is provided
  const effectiveTaxRate = taxRate !== undefined && taxRate !== null ? taxRate : await getGlobalSalesTax(effectiveStoreId);

  // Calculate subtotal
  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate tax amount
  const taxAmount = parseFloat((subtotal * (effectiveTaxRate / 100)).toFixed(2));

  // Calculate total due (revenue)
  const totalDue = subtotal + taxAmount;

  // Calculate net profit (excluding tax)
  const netProfit = subtotal - totalExpenses;

  return { subtotal, taxAmount, totalDue, netProfit };
};

// Update the OrderSummaryCard to handle the asynchronous calculateOrderSummary
const OrderSummaryCard = ({ lineItems, taxRate, totalExpenses, effectiveStoreId }: { lineItems: OrderLineItem[], taxRate: number, totalExpenses: number, effectiveStoreId: string }) => {
  const [summary, setSummary] = useState({ subtotal: 0, taxAmount: 0, totalDue: 0, netProfit: 0 });

  useEffect(() => {
    const fetchSummary = async () => {
      const result = await calculateOrderSummary(lineItems, taxRate, totalExpenses, effectiveStoreId);
      setSummary(result);
    };
    fetchSummary();
  }, [lineItems, taxRate, totalExpenses, effectiveStoreId]);

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Order Summary</h3>
      <div className="text-sm text-slate-600">
        <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">${summary.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Sales Tax ({taxRate}%)</span><span className="font-medium">${summary.taxAmount.toFixed(2)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-bold">Total Due</span><span className="font-bold text-slate-900">${summary.totalDue.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Net Profit (Excluding Tax)</span><span className="font-medium text-emerald-600">${summary.netProfit.toFixed(2)}</span></div>
      </div>
    </div>
  );
};

// Updated function to fetch global sales tax from Supabase
const getGlobalSalesTax = async (effectiveStoreId: string) => {
  try {
    const stores = await db.stores.list(); // Fetch all stores
    const store = stores.find(store => store.id === effectiveStoreId); // Find the store by ID

    if (!store) {
      console.error('Store not found for the given ID:', effectiveStoreId);
      return 0; // Default to 0 if the store is not found
    }

    return store.salesTax || 0; // Return the fetched sales tax or default to 0
  } catch (err) {
    console.error('Unexpected error fetching sales tax:', err);
    return 0; // Default to 0 in case of an unexpected error
  }
};

const App: React.FC = () => {
  // Password reset routing logic (must be first)
  // Support both search and hash-based query params
  const [locationKey, setLocationKey] = useState(0);
  useEffect(() => {
    const handler = () => setLocationKey(k => k + 1);
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);

  // Detect abandoned Stripe checkout (Stripe cancel button OR browser back button)
  useEffect(() => {
    const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ffhdrhvstaonvcludbgn.supabase.co';
    const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_in95qOxRG0FXiOVUHrGF_g_LL7uwRYi';

    const fireCancelEmail = () => {
      const raw = sessionStorage.getItem('designCancelData');
      sessionStorage.removeItem('designCancelData');
      sessionStorage.removeItem('designPending');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        fetch(`${SUPABASE_URL}/functions/v1/send-design-cancelled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify(payload),
        }).catch(err => console.error('Failed to send cancelled notification:', err));
      } catch { /* ignore parse errors */ }
    };

    const params = new URLSearchParams(window.location.search);
    console.log('[Design] useEffect ran. URL:', window.location.search, '| designPending:', sessionStorage.getItem('designPending'), '| cancelData:', sessionStorage.getItem('designCancelData'));

    if (params.get('design_success') === '1') {
      // Payment completed — just clean up
      sessionStorage.removeItem('designCancelData');
      sessionStorage.removeItem('designPending');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (params.get('design_cancelled') === '1') {
      // Stripe's cancel button was clicked
      window.history.replaceState({}, '', window.location.pathname);
      fireCancelEmail();
      return;
    }

    // Browser back button (non-bfcache): page remounted without URL params
    if (sessionStorage.getItem('designPending') === '1') {
      fireCancelEmail();
    }

    // Browser back button (bfcache): page restored from cache, useEffect won't re-run
    const handlePageShow = (e: PageTransitionEvent) => {
      console.log('[Design] pageshow fired. persisted:', e.persisted, '| designPending:', sessionStorage.getItem('designPending'));
      if (e.persisted && sessionStorage.getItem('designPending') === '1') {
        fireCancelEmail();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  function getAllParams() {
    // Prefer search params if present, else parse hash
    let params = new URLSearchParams(window.location.search);
    if (!params.has('type') && window.location.hash) {
      // Remove leading # and possible leading /
      let hash = window.location.hash.replace(/^#\/?/, '');
      params = new URLSearchParams(hash);
    }
    return params;
  }
  const allParams = getAllParams();
  const isRecovery = allParams.get('type') === 'recovery';
  if (isRecovery) {
    return <ResetPassword />;
  }

  const {
    effectiveStoreId,
    activeStore,
    currentUser,
    handleRoleSwitch,
    selectedAdminStoreId,
    setSelectedAdminStoreId,
    stores,
    setStores
  } = useTenant();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [storeSettingsTarget, setStoreSettingsTarget] = useState<CabinetStore | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [ordersKanbanView, setOrdersKanbanView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); console.log('Effective Store ID:', effectiveStoreId); // Debugging: Log the effectiveStoreId
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [emailSending, setEmailSending] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'uploading' | 'done' | 'error'>('idle');
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [quickCustomer, setQuickCustomer] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
    billingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' }
  });

  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');

  useEffect(() => {
    setTableSearch('');
    setTableFilter('all');
  }, [activeTab]);

  const [newLineItemProduct, setNewLineItemProduct] = useState('');
  const [newLineItemQty, setNewLineItemQty] = useState(1);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setTableSearch('');
    setTableFilter('all');
  }, [activeTab]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [l, c, e, cl, o, inv] = await Promise.all([
          db.leads.list(effectiveStoreId),
          db.customers.list(effectiveStoreId),
          db.planner.list(effectiveStoreId),
          db.claims.list(effectiveStoreId),
          db.orders.list(effectiveStoreId),
          db.inventory.list(effectiveStoreId)
        ]);
        
        setLeads(l);
        setCustomers(c);
        setEvents(e);
        setClaims(cl);
        setOrders(o);
        setInventory(inv);
      } catch (err) {
        console.error("Data fetch error:", err);
        setLeads([]);
        setCustomers([]);
        setOrders([]);
        setClaims([]);
        setInventory([]);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [effectiveStoreId]);

  const calculateSubtotal = (lineItems: OrderLineItem[]) => {
    return lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTax = (subtotal: number, taxRate: number) => {
    return parseFloat((subtotal * (taxRate / 100)).toFixed(2));
  };

  const openModal = async (type: string, item: any = null) => {
    setModalType(type);
    const globalSalesTax = await getGlobalSalesTax(effectiveStoreId); // Await the function to fetch the global sales tax from settings

    const defaultLineItems = item?.lineItems || [];
    const defaultSubtotal = calculateSubtotal(defaultLineItems);
    const defaultTax = calculateTax(defaultSubtotal, globalSalesTax);

    setSelectedItem(item ? {
      ...JSON.parse(JSON.stringify(item)),
      subtotal: defaultSubtotal,
      tax: calculateTax(defaultSubtotal, item.taxRate ?? globalSalesTax),
    } : {
      status: type.includes('Lead') ? LeadStatus.NEW :
        type.includes('Event') ? PlannerEventStatus.SCHEDULED :
        type.includes('Claim') ? ClaimStatus.OPEN :
        type.includes('Quote') ? 'Quote' :
        type.includes('Invoice') ? 'Invoiced' :
        type.includes('Store') ? 'active' : 'Processing',
      type: type.includes('Event') ? PlannerEventType.MEASUREMENT : undefined,
      trackStock: type.includes('Inventory') ? true : undefined,
      quantity: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
      shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
      attachments: [],
      lineItems: defaultLineItems,
      amount: 0,
      subtotal: defaultSubtotal,
      tax: defaultTax,
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

  const updateSelectedItem = async (key: string, value: any) => {
    if (key === 'lineItems') {
      const newSubtotal = calculateSubtotal(value);
      const globalSalesTax = await getGlobalSalesTax(effectiveStoreId); // Await the function to fetch the global sales tax
      const newTax = calculateTax(newSubtotal, globalSalesTax);
      setSelectedItem((prev: any) => ({
        ...prev,
        [key]: value,
        subtotal: newSubtotal,
        tax: newTax,
        amount: newSubtotal + newTax,
      }));
    } else {
      setSelectedItem((prev: any) => ({ ...prev, [key]: value }));
    }
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
      notes: 'Added from order flow.',
      createdAt: new Date().toISOString()
    };

    try {
      const saved = await db.customers.create(newCustPayload);
      const mappedSaved = { ...saved, id: saved.id || `gen-${Date.now()}` };
      setCustomers((prev: Customer[]) => [mappedSaved as any, ...prev]);
      updateSelectedItem('customerId', mappedSaved.id);
      setIsQuickCustomerOpen(false);
      setQuickCustomer({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
        billingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' }
      });
    } catch (err) {
      console.error('Customer create error:', err);
      alert("Database persistence failure.");
    }
  };

  const handleSendInvoiceEmail = useCallback(async (orderItem?: any, overrideType?: string) => {
    const order = orderItem || selectedItem;
    const type = overrideType || modalType.replace('View ', '').toLowerCase();

    if (!order) {
      alert('No record selected.');
      return;
    }

    const supportsEmail = type.includes('order') || type.includes('quote') || type.includes('invoice');
    if (!supportsEmail) {
      alert('Emailing invoices is only available for order and quote records.');
      return;
    }

    const customer = customers.find(c => c.id === order.customerId);
    const recipientEmail = customer?.email || '';
    const recipientName = customer ? `${customer.firstName} ${customer.lastName}` : '';

    if (!recipientEmail) {
      alert('No customer email on file for this record.');
      return;
    }

    const currentStore = stores.find(s => s.id === effectiveStoreId);
    const replyTo = currentStore?.ownerEmail || '';
    const storeName = currentStore?.name || 'KitchenUnity';

    setEmailSending(true);
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/send-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          toName: recipientName,
          replyTo,
          storeName,
          orderId: order.id,
          orderStatus: order.status,
          orderDate: order.createdAt,
          lineItems: order.lineItems || [],
          taxRate: order.taxRate || 0,
          isNonTaxable: order.isNonTaxable || false,
          amount: order.amount || 0,
          notes: order.notes || '',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      alert(`Invoice emailed to ${recipientName} (${recipientEmail}).`);
    } catch (err) {
      console.error('Email send failed:', err);
      alert('Failed to send email. Please check your SMTP settings and try again.');
    } finally {
      setEmailSending(false);
    }
  }, [selectedItem, customers, modalType, stores, effectiveStoreId]);

  const handleSave = async () => {
    const displayType = modalType.replace('View ', '').toLowerCase();
    if (!selectedItem) {
      alert('Nothing to save.');
      return;
    }
    
    try {
      // Helper to get the global sales tax rate for the current store
      const getDefaultTaxRate = async () => {
        const storesList = stores && stores.length ? stores : await db.stores.list();
        const store = storesList.find(s => s.id === effectiveStoreId);
        return store && typeof store.salesTax === 'number' ? store.salesTax : 0;
      };

      if (selectedItem?.id && !selectedItem.id.toString().startsWith('gen-')) {
        const updatePromises = [];
        if (displayType.includes('lead')) {
          updatePromises.push(db.leads.update(selectedItem.id, selectedItem));
          updatePromises.push(setLeads((prev: Lead[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item)));
        } else if (displayType.includes('customer')) {
          updatePromises.push(db.customers.update(selectedItem.id, selectedItem));
          updatePromises.push(setCustomers((prev: Customer[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item)));
        } else if (displayType.includes('event')) {
          updatePromises.push(db.planner.update(selectedItem.id, selectedItem));
          updatePromises.push(setEvents((prev: PlannerEvent[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item)));
        } else if (displayType.includes('claim')) {
          updatePromises.push(db.claims.update(selectedItem.id, selectedItem));
          updatePromises.push(setClaims((prev: Claim[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item)));
        } else if (displayType.includes('store')) {
          updatePromises.push(db.stores.update(selectedItem.id, selectedItem));
          updatePromises.push(setStores((prev: CabinetStore[]) => prev.map((s) => s.id === selectedItem.id ? { ...s, ...selectedItem } : s)));
        } else if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice') || displayType.includes('sale')) {
          // Patch: Ensure taxRate is set to global sales tax if no override
          let patched = { ...selectedItem };
          if (
            (patched.salesTaxOverride === undefined || patched.salesTaxOverride === null || patched.salesTaxOverride === '') &&
            (patched.taxRate === undefined || patched.taxRate === null || patched.taxRate === '')
          ) {
            patched.taxRate = await getDefaultTaxRate();
          } else if (
            patched.salesTaxOverride !== undefined && patched.salesTaxOverride !== null && patched.salesTaxOverride !== ''
          ) {
            patched.taxRate = Number(patched.salesTaxOverride);
          }
          updatePromises.push(db.orders.update(selectedItem.id, patched));
          updatePromises.push(setOrders((prev: Order[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...patched } : item)));
        } else if (displayType.includes('inventory')) {
          updatePromises.push(db.inventory.update(selectedItem.id, selectedItem));
          updatePromises.push(setInventory((prev: InventoryItem[]) => prev.map((item) => item.id === selectedItem.id ? { ...item, ...selectedItem } : item)));
        }
        await Promise.all(updatePromises);
      } else {
        if (displayType.includes('store')) {
          const name = (selectedItem.name || '').trim();
          const domain = (selectedItem.domain || '').trim();
          if (!name || !domain) {
            alert('Store name and store key are required.');
            return;
          }
        }

        let newItemPayload = { ...selectedItem, storeId: effectiveStoreId };
        // Patch: Ensure taxRate is set to global sales tax if no override
        if (
          (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice') || displayType.includes('sale'))
        ) {
          if (
            (newItemPayload.salesTaxOverride === undefined || newItemPayload.salesTaxOverride === null || newItemPayload.salesTaxOverride === '') &&
            (newItemPayload.taxRate === undefined || newItemPayload.taxRate === null || newItemPayload.taxRate === '')
          ) {
            newItemPayload.taxRate = await getDefaultTaxRate();
          } else if (
            newItemPayload.salesTaxOverride !== undefined && newItemPayload.salesTaxOverride !== null && newItemPayload.salesTaxOverride !== ''
          ) {
            newItemPayload.taxRate = Number(newItemPayload.salesTaxOverride);
          }
        }

        if (displayType.includes('lead')) {
          const saved = await db.leads.create(newItemPayload);
          setLeads((prev: Lead[]) => [saved as any, ...prev]);
        } else if (displayType.includes('customer')) {
          const saved = await db.customers.create(newItemPayload);
          setCustomers((prev: Customer[]) => [saved as any, ...prev]);
        } else if (displayType.includes('event')) {
          const saved = await db.planner.create(newItemPayload);
          setEvents((prev: PlannerEvent[]) => [saved as any, ...prev]);
        } else if (displayType.includes('claim')) {
          const saved = await db.claims.create(newItemPayload);
          setClaims((prev: Claim[]) => [saved as any, ...prev]);
        } else if (displayType.includes('store')) {
          const saved = await db.stores.create(newItemPayload);
          setStores((prev: CabinetStore[]) => [saved as any, ...prev]);
        } else if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice') || displayType.includes('sale')) {
          const saved = await db.orders.create(newItemPayload);
          setOrders((prev: Order[]) => [saved as any, ...prev]);
        } else if (displayType.includes('inventory')) {
          const saved = await db.inventory.create(newItemPayload);
          setInventory((prev: InventoryItem[]) => [saved as any, ...prev]);
        } else {
          const mockId = `gen-${Date.now()}`;
          const mockItem = { ...selectedItem, id: mockId, createdAt: new Date().toISOString() };
          if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('sale')) setOrders((prev: Order[]) => [mockItem, ...prev]);
          else if (displayType.includes('inventory')) setInventory((prev: InventoryItem[]) => [mockItem, ...prev]);
        }
      }
      closeModal();
    } catch (err) {
      console.error('Save failed:', err);
      const message = (err as any)?.message || 'Persistence error.';
      alert(message);
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
      } else if (t === 'claim') {
        await db.claims.delete(id);
        setClaims((prev: Claim[]) => prev.filter((c) => c.id !== id));
      } else if (t.includes('store')) {
        await db.stores.delete(id);
        setStores((prev: CabinetStore[]) => prev.filter((s) => s.id !== id));
      } else if (['order', 'quote', 'invoice', 'sale'].includes(t)) {
        await db.orders.delete(id);
        setOrders((prev: Order[]) => prev.filter((o) => o.id !== id));
      } else if (t.includes('inventory')) {
        await db.inventory.delete(id);
        setInventory((prev: InventoryItem[]) => prev.filter((i) => i.id !== id));
      } else {
        if (['order', 'quote', 'invoice', 'sale'].includes(t)) setOrders((prev: Order[]) => prev.filter((o) => o.id !== id));
        else if (t.includes('inventory')) setInventory((prev: InventoryItem[]) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failure.');
    }
  };

  const handleImportLeads = async () => {
    if (!importFile || !effectiveStoreId) return;
    setImportStatus('parsing');
    setImportResult(null);
    try {
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV has no data rows.');

      // Normalize header names
      const rawHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, '_'));
      const col = (names: string[]) => {
        for (const n of names) { const i = rawHeaders.indexOf(n); if (i !== -1) return i; }
        return -1;
      };
      const iFirst    = col(['first_name', 'firstname', 'first']);
      const iLast     = col(['last_name', 'lastname', 'last']);
      const iName     = col(['name', 'full_name']);
      const iEmail    = col(['email', 'email_address']);
      const iPhone    = col(['phone', 'phone_number', 'mobile']);
      const iSource   = col(['source', 'lead_source', 'channel']);
      const iStatus   = col(['status', 'lead_status']);
      const iNotes    = col(['notes', 'message', 'description']);
      const iDate     = col(['created_at', 'createdat', 'date', 'lead_date', 'submitted_at', 'submitted']);

      const parseRow = (line: string) =>
        line.split(',').map(v => v.replace(/^"|"$/g, '').trim());

      const validStatuses = Object.values(LeadStatus) as string[];
      const errors: string[] = [];
      const toInsert: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseRow(lines[i]);
        const email = iEmail !== -1 ? row[iEmail] : '';
        const phone = iPhone !== -1 ? row[iPhone] : '';

        // Derive first/last from split name if dedicated cols missing
        let firstName = iFirst !== -1 ? row[iFirst] : '';
        let lastName  = iLast  !== -1 ? row[iLast]  : '';
        if (!firstName && !lastName && iName !== -1) {
          const parts = (row[iName] || '').split(' ');
          firstName = parts[0] || '';
          lastName  = parts.slice(1).join(' ');
        }

        if (!firstName && !email && !phone) {
          errors.push(`Row ${i + 1}: skipped — no name, email, or phone.`);
          continue;
        }

        let status = iStatus !== -1 ? row[iStatus] : '';
        if (!validStatuses.includes(status)) status = LeadStatus.NEW;

        toInsert.push({
          storeId: effectiveStoreId,
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || null,
          phone: phone || null,
          source: iSource !== -1 ? row[iSource] || 'Import' : 'Import',
          status,
          notes: iNotes !== -1 ? row[iNotes] || null : null,
          createdAt: (() => {
            if (iDate === -1 || !row[iDate]) return new Date().toISOString();
            const raw = row[iDate].trim();
            // Handle "MM/DD/YYYY H:MM AM" or "MM/DD/YYYY H:MMAM" (uppercase AM/PM required)
            const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/);
            if (m) {
              let hours = parseInt(m[4], 10);
              const minutes = parseInt(m[5], 10);
              const meridiem = m[6];
              if (meridiem === 'PM' && hours !== 12) hours += 12;
              if (meridiem === 'AM' && hours === 12) hours = 0;
              const d = new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]), hours, minutes);
              return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
            }
            const parsed = new Date(raw);
            return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
          })(),
        });
      }

      if (toInsert.length === 0) throw new Error('No valid rows found to import.');

      setImportStatus('uploading');
      let imported = 0;
      for (const lead of toInsert) {
        try {
          const saved = await db.leads.create(lead);
          setLeads(prev => [saved as any, ...prev]);
          imported++;
        } catch {
          errors.push(`Failed to save: ${lead.firstName} ${lead.lastName} (${lead.email || lead.phone})`);
        }
      }

      setImportResult({ imported, skipped: toInsert.length - imported + (lines.length - 1 - toInsert.length), errors });
      setImportStatus('done');
      setImportFile(null);
      if (importFileRef.current) importFileRef.current.value = '';
    } catch (err: any) {
      setImportResult({ imported: 0, skipped: 0, errors: [err.message || 'Unknown error'] });
      setImportStatus('error');
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

  const handleConvertQuote = async (quote: Order) => {
    if (!window.confirm(`Confirm order placement for Quote #${quote.id.slice(-6)}?`)) return;
    const updated = { ...quote, status: 'Processing' };
    try {
      if (quote.id && !quote.id.toString().startsWith('gen-')) {
        await db.orders.update(quote.id, updated);
      }
      setOrders((prev: Order[]) => prev.map((o) => o.id === quote.id ? updated : o));
    } catch (err) {
      console.error('Quote conversion failed:', err);
      alert('Conversion failure.');
      return;
    }
    setActiveTab('sales-orders');
  };

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

  const renderModalContent = () => {
    const isView = modalType.startsWith('View');
    const displayType = modalType.replace('View ', '').toLowerCase();
    const attachments: Attachment[] = selectedItem?.attachments || [];
    const lineItems: OrderLineItem[] = selectedItem?.lineItems || [];

    // Restore detailed metadata for view modals, but remove id/storeId and add customer email/phone
    let metadataEntries: { label: string; value: string }[] = [];
    if (isView && (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice'))) {
      const customer = customers.find(c => c.id === selectedItem?.customerId);
      if (customer) {
        metadataEntries.push({ label: 'Customer', value: `${customer.firstName} ${customer.lastName}` });
        metadataEntries.push({ label: 'Customer Email', value: customer.email });
        metadataEntries.push({ label: 'Customer Phone', value: customer.phone || '' });
      }
      if (selectedItem?.createdAt) {
        const date = new Date(selectedItem.createdAt);
        metadataEntries.push({ label: 'Created At', value: isNaN(date.getTime()) ? String(selectedItem.createdAt) : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) });
      }
      if (selectedItem?.updatedAt) {
        const date = new Date(selectedItem.updatedAt);
        metadataEntries.push({ label: 'Updated At', value: isNaN(date.getTime()) ? String(selectedItem.updatedAt) : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) });
      }
      // Add all other primitive fields except id, storeId, customerId
      Object.entries(selectedItem || {}).forEach(([key, val]) => {
        if (['id', 'storeId', 'customerId', 'createdAt', 'updatedAt', 'attachments', 'lineItems'].includes(key) || typeof val === 'object') return;
        metadataEntries.push({ label: key.replace(/([A-Z])/g, ' $1').trim(), value: String(val) });
      });
    } else if (isView && displayType.includes('customer')) {
      // View customer modal: grouped, read-only layout
      const shipping = selectedItem?.shippingAddress || {};
      const billing = selectedItem?.billingAddress || {};
      const billingDifferent = selectedItem?.billingDifferent;
      return (
        <div className="space-y-10">
          <FormSection title="Profile" icon={Users}>
            <div className="space-y-1"><Label>First Name</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{selectedItem?.firstName || <span className="text-slate-400">—</span>}</div></div>
            <div className="space-y-1"><Label>Last Name</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{selectedItem?.lastName || <span className="text-slate-400">—</span>}</div></div>
            <div className="grid grid-cols-2 gap-2 col-span-2">
              <div className="space-y-1"><Label>Email</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{selectedItem?.email || <span className="text-slate-400">—</span>}</div></div>
              <div className="space-y-1"><Label>Phone</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{selectedItem?.phone || <span className="text-slate-400">—</span>}</div></div>
            </div>
            <div className="space-y-1 col-span-2"><Label>Notes</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700 whitespace-pre-line">{selectedItem?.notes || <span className="text-slate-400">—</span>}</div></div>
          </FormSection>
          <FormSection title="Shipping Address" icon={Users}>
            <div className="space-y-1"><Label>Address Line 1</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{shipping.address1 || <span className="text-slate-400">—</span>}</div></div>
            <div className="space-y-1"><Label>Address Line 2</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{shipping.address2 || <span className="text-slate-400">—</span>}</div></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label>City</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{shipping.city || <span className="text-slate-400">—</span>}</div></div>
              <div className="space-y-1"><Label>State</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{shipping.state || <span className="text-slate-400">—</span>}</div></div>
              <div className="space-y-1"><Label>Zip</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{shipping.zip || <span className="text-slate-400">—</span>}</div></div>
            </div>
          </FormSection>
          {billingDifferent && (
            <FormSection title="Billing Address" icon={Users}>
              <div className="space-y-1"><Label>Address Line 1</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{billing.address1 || <span className="text-slate-400">—</span>}</div></div>
              <div className="space-y-1"><Label>Address Line 2</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{billing.address2 || <span className="text-slate-400">—</span>}</div></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1"><Label>City</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{billing.city || <span className="text-slate-400">—</span>}</div></div>
                <div className="space-y-1"><Label>State</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{billing.state || <span className="text-slate-400">—</span>}</div></div>
                <div className="space-y-1"><Label>Zip</Label><div className="rounded bg-slate-50 px-3 py-2 text-slate-700">{billing.zip || <span className="text-slate-400">—</span>}</div></div>
              </div>
            </FormSection>
          )}
        </div>
      );
    }

    if (displayType.includes('customer')) {
      return (
        <div className="space-y-10">
          <FormSection title="Profile" icon={Users}>
            <div className="space-y-1"><Label>First Name</Label><Input value={selectedItem?.firstName} onChange={e => updateSelectedItem('firstName', e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input value={selectedItem?.lastName} onChange={e => updateSelectedItem('lastName', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Email</Label><Input value={selectedItem?.email} onChange={e => updateSelectedItem('email', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Phone</Label><Input value={selectedItem?.phone} onChange={e => updateSelectedItem('phone', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Notes</Label><Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} /></div>
            <div className="space-y-1 col-span-2">
              <Label>Shipping Address</Label>
              <Input placeholder="Address Line 1" value={selectedItem?.shippingAddress?.address1 || ''} onChange={e => updateSelectedItem('shippingAddress', { ...selectedItem?.shippingAddress, address1: e.target.value })} />
              <Input placeholder="Address Line 2" value={selectedItem?.shippingAddress?.address2 || ''} onChange={e => updateSelectedItem('shippingAddress', { ...selectedItem?.shippingAddress, address2: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={selectedItem?.shippingAddress?.city || ''} onChange={e => updateSelectedItem('shippingAddress', { ...selectedItem?.shippingAddress, city: e.target.value })} />
                <Input placeholder="State" value={selectedItem?.shippingAddress?.state || ''} onChange={e => updateSelectedItem('shippingAddress', { ...selectedItem?.shippingAddress, state: e.target.value })} />
                <Input placeholder="Zip" value={selectedItem?.shippingAddress?.zip || ''} onChange={e => updateSelectedItem('shippingAddress', { ...selectedItem?.shippingAddress, zip: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 my-2 col-span-2">
              <input type="checkbox" id="modalBillingDifferent" checked={selectedItem?.billingDifferent} onChange={e => updateSelectedItem('billingDifferent', e.target.checked)} />
              <label htmlFor="modalBillingDifferent" className="text-xs font-medium">Billing address is different than shipping address</label>
            </div>
            {selectedItem?.billingDifferent && (
              <div className="space-y-1 col-span-2">
                <Label>Billing Address</Label>
                <Input placeholder="Address Line 1" value={selectedItem?.billingAddress?.address1 || ''} onChange={e => updateSelectedItem('billingAddress', { ...selectedItem?.billingAddress, address1: e.target.value })} />
                <Input placeholder="Address Line 2" value={selectedItem?.billingAddress?.address2 || ''} onChange={e => updateSelectedItem('billingAddress', { ...selectedItem?.billingAddress, address2: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="City" value={selectedItem?.billingAddress?.city || ''} onChange={e => updateSelectedItem('billingAddress', { ...selectedItem?.billingAddress, city: e.target.value })} />
                  <Input placeholder="State" value={selectedItem?.billingAddress?.state || ''} onChange={e => updateSelectedItem('billingAddress', { ...selectedItem?.billingAddress, state: e.target.value })} />
                  <Input placeholder="Zip" value={selectedItem?.billingAddress?.zip || ''} onChange={e => updateSelectedItem('billingAddress', { ...selectedItem?.billingAddress, zip: e.target.value })} />
                </div>
              </div>
            )}
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
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice') || displayType.includes('sale')) {
      const isQuoteFlow = displayType.includes('quote');
      const statusOptions = isQuoteFlow
        ? ['Quote']
        : ['Quote', 'Processing', 'Shipped', 'Invoiced', 'Completed'];

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
              {isQuoteFlow ? (
                <div className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-3xl text-sm font-black text-slate-700 uppercase tracking-widest">
                  {selectedItem?.status || 'Quote'}
                </div>
              ) : (
                <Select
                  value={selectedItem?.status}
                  onChange={e => updateSelectedItem('status', e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              )}
              {isQuoteFlow && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Quotes are locked to Quote status until converted.</p>
              )}
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
            </div>
          </FormSection>

          {/* Revenue Section */}
          <div className="bg-slate-900 text-white p-6 rounded-[24px] flex flex-col shadow-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-blue-400">Subtotal</span>
              <span className="text-lg font-bold">${(selectedItem?.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-blue-400">Tax</span>
              <span className="text-lg font-bold">${(selectedItem?.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-blue-400">Total</span>
              <span className="text-3xl font-black">${(selectedItem?.amount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Expenses Section - collapsible with checkbox */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm col-span-2 mb-4">
            <label className="flex items-center gap-2 text-sm font-bold mb-2">
              <input
                type="checkbox"
                checked={Array.isArray(selectedItem.expenses) && selectedItem.expenses.length > 0}
                onChange={e => {
                  if (e.target.checked) {
                    updateSelectedItem('expenses', [{ id: `exp-inst-${Date.now()}`, typeId: '', typeName: '', amount: 0, note: '' }]);
                  } else {
                    updateSelectedItem('expenses', []);
                  }
                }}
              />
              Want to add expenses too?
            </label>
            {Array.isArray(selectedItem.expenses) && selectedItem.expenses.length > 0 && (
              <div className="space-y-2 mt-2">
                {(selectedItem.expenses || []).map((exp: any, idx: number) => (
                  <div key={exp.id || idx} className="flex items-center gap-2">
                    <Select
                      value={exp.typeId}
                      onChange={e => {
                        const updated = [...(selectedItem.expenses || [])];
                        let typeName = '';
                        if (e.target.value === 'exp-1') typeName = 'Shipping';
                        else if (e.target.value === 'exp-2') typeName = 'Labor';
                        else if (e.target.value === 'exp-3') typeName = 'Materials';
                        updated[idx] = { ...exp, typeId: e.target.value, typeName };
                        updateSelectedItem('expenses', updated);
                      }}
                      className="w-32"
                    >
                      <option value="">Type</option>
                      <option value="exp-1">Shipping</option>
                      <option value="exp-2">Labor</option>
                      <option value="exp-3">Materials</option>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      value={exp.amount}
                      onChange={e => {
                        const updated = [...(selectedItem.expenses || [])];
                        updated[idx] = { ...exp, amount: Number(e.target.value) };
                        updateSelectedItem('expenses', updated);
                      }}
                      placeholder="Expense Amount"
                      className="w-32"
                    />
                    <Input
                      type="text"
                      value={exp.note || ''}
                      onChange={e => {
                        const updated = [...(selectedItem.expenses || [])];
                        updated[idx] = { ...exp, note: e.target.value };
                        updateSelectedItem('expenses', updated);
                      }}
                      placeholder="Note"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                      onClick={() => {
                        const updated = [...(selectedItem.expenses || [])];
                        updated.splice(idx, 1);
                        updateSelectedItem('expenses', updated);
                      }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2"
                  onClick={() => {
                    const updated = [...(selectedItem.expenses || []), { id: `exp-inst-${Date.now()}`, typeId: '', typeName: '', amount: 0, note: '' }];
                    updateSelectedItem('expenses', updated);
                  }}
                >+ Add Expense</button>
              </div>
            )}
          </div>

          {/* Sales Tax Override - checkbox and input */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm col-span-2 flex flex-col gap-2 mb-4">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={selectedItem.salesTaxOverride !== undefined && selectedItem.salesTaxOverride !== null && selectedItem.salesTaxOverride !== ''}
                onChange={e => {
                  if (e.target.checked) {
                    updateSelectedItem('salesTaxOverride', 0);
                  } else {
                    updateSelectedItem('salesTaxOverride', undefined);
                  }
                }}
              />
              Different sales tax?
            </label>
            {selectedItem.salesTaxOverride !== undefined && selectedItem.salesTaxOverride !== null && selectedItem.salesTaxOverride !== '' && (
              <div className="flex items-center gap-2 mt-2">
                <Label>Sales Tax Override (%)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={selectedItem.salesTaxOverride}
                  onChange={e => updateSelectedItem('salesTaxOverride', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="Override global tax rate"
                  className="w-32"
                />
                <span className="text-[10px] text-slate-400 ml-2">Leave blank to use the default store tax rate.</span>
              </div>
            )}
          </div>

          {/* Profit Section - only if expenses enabled */}
          {Array.isArray(selectedItem.expenses) && selectedItem.expenses.length > 0 && (
            (() => {
              const totalExpenses = selectedItem.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
              // Use the same tax value as the Revenue section above
              const salesTax = selectedItem.tax || 0;
              const netProfit = (selectedItem.amount || 0) - totalExpenses - salesTax;
              return (
                <div className="bg-emerald-50 p-6 rounded-[24px] flex flex-col md:flex-row justify-between items-center shadow-lg">
                  <div className="flex flex-col items-center md:items-start mb-2 md:mb-0">
                    <span className="text-xs font-black uppercase text-emerald-600">Profit</span>
                    <span className="text-2xl font-black text-emerald-900">${netProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center md:items-end">
                    <span className="text-xs font-black uppercase text-rose-600">Total Expenses</span>
                    <span className="text-lg font-black text-rose-900">${totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center md:items-end">
                    <span className="text-xs font-black uppercase text-blue-600">Sales Tax</span>
                    <span className="text-lg font-black text-blue-900">${salesTax.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()
          )}
          <FormSection title="Attachments & Notes" icon={Paperclip}>
            <div className="col-span-2 space-y-4">
              <div className="space-y-1">
                <Label>Internal Notes</Label>
                <Input type="textarea" value={selectedItem?.notes || ''} onChange={e => updateSelectedItem('notes', e.target.value)} />
              </div>
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Documents ({attachments.length})</Label>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">PDF, PNG, JPG supported</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em]"><Paperclip size={12}/> Link File</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-xs font-bold truncate pr-2" title={att.name}>{att.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => downloadAttachment(att)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Download"><Download size={14} /></button>
                      <button onClick={() => removeAttachment(att.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded" title="Remove"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    No documents added yet
                  </div>
                )}
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
               <div className="space-y-1"><Label>Store Key (URL SLUG)</Label><Input value={selectedItem?.domain} onChange={e => updateSelectedItem('domain', e.target.value)} /></div>
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
       {actions.includes('email') && <button onClick={() => handleSendInvoiceEmail(item, type.toLowerCase())} disabled={emailSending} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50" title="Email Invoice"><Mail size={18} /></button>}
       {actions.includes('edit') && <button onClick={() => openModal(type, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit"><Edit2 size={18} /></button>}
       {actions.includes('delete') && currentUser.role === UserRole.ADMIN && <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete"><Trash2 size={18} /></button>}
    </div>
  );

  const globalArr = useMemo(() => orders.reduce((sum, o) => sum + (o.amount || 0), 0), [orders]);
  const ordersLast30Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return orders.filter(o => {
      const created = new Date(o.createdAt);
      return !isNaN(created.getTime()) && created >= cutoff;
    }).length;
  }, [orders]);
  const newStoresLast30Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return stores.filter(s => {
      const created = new Date(s.createdAt);
      return !isNaN(created.getTime()) && created >= cutoff;
    }).length;
  }, [stores]);

  const renderContent = () => {
    if (isLoading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4"><Clock className="animate-spin" size={24} /> Syncing Records...</div>;
    
    if (currentUser.role === UserRole.ADMIN && activeTab === 'dashboard') {
      return (
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Platform Control</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Multi-tenant management & global operations</p>
            </div>
            <div className="flex gap-3">
               <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">System Health</p>
                    <p className="text-xs font-bold text-slate-900">100% Online</p>
                  </div>
               </div>
               <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Globe size={14} className="text-blue-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Active Regions</p>
                    <p className="text-xs font-bold text-slate-900">4 Data Centers</p>
                  </div>
               </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-2">
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Revenue</p>
               <h3 className="text-2xl font-black tracking-tighter text-blue-400">${globalArr.toLocaleString()} <span className="text-xs text-white/40 font-bold">USD</span></h3>
               <p className="text-xs text-emerald-400 font-bold flex items-center gap-1"><ArrowRightCircle size={12} /> Orders (30d): {ordersLast30Days}</p>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Stores</p>
               <h3 className="text-2xl font-black tracking-tighter text-slate-900">{stores.length} <span className="text-xs text-slate-400 font-bold italic uppercase">Tenants</span></h3>
               <p className="text-xs text-blue-500 font-bold">New (30d): {newStoresLast30Days}</p>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Load</p>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">{claims.length} <span className="text-xs text-slate-400 font-bold italic uppercase">Tickets</span></h3>
                <p className="text-xs text-rose-500 font-bold">Priority Resolution: Active</p>
             </div>
          </div>

          <StoreManager stores={stores} leads={leads} orders={orders} onSelectStore={(s) => { setSelectedAdminStoreId(s.id); setActiveTab('dashboard'); handleRoleSwitch(UserRole.CUSTOMER); }} onProvisionStore={() => openModal('Store')} onOpenSettings={(s) => setStoreSettingsTarget(s)} />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard leads={leads} orders={orders} claims={claims} customers={customers} />;
      case 'leads': {
        const activeStore = stores.find((s: any) => s.id === effectiveStoreId) || null;
        const exportLeadsCSV = () => {
          const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Status', 'Created At'];
          const rows = leads.map(l => [l.firstName, l.lastName, l.email, l.phone, l.source, l.status, new Date(l.createdAt).toLocaleDateString()]);
          const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        };
        return (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              {currentUser.role === UserRole.ADMIN && (
                <button onClick={() => { setImportStatus('idle'); setImportResult(null); setImportFile(null); setImportModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
                  <Upload size={13} /> Import CSV
                </button>
              )}
              <button onClick={exportLeadsCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
                <Download size={13} /> Export CSV
              </button>
            </div>
            <LeadList leads={leads} role={currentUser.role} activeStore={activeStore} onUpdateStatus={async (id, s) => { const lead = leads.find((l: Lead) => l.id === id); if (lead) { try { await db.leads.update(id, { ...lead, status: s }); setLeads((prev: Lead[]) => prev.map((l: Lead) => l.id === id ? {...l, status: s} : l)); } catch (err) { console.error('Failed to update lead status:', err); } } }} onConvert={handleConvertLead} onDelete={(id) => handleDelete('lead', id)} onBulkDelete={async (ids) => { for (const id of ids) { await db.leads.delete(id); } setLeads(prev => prev.filter(l => !ids.includes(l.id))); }} onEdit={(lead) => openModal('Lead', lead)} onSaveDigest={async (enabled, time, statuses) => { await db.stores.update(effectiveStoreId, { dailyDigestEnabled: enabled, dailyDigestTime: time, dailyDigestStatuses: statuses }); setStores((prev: any[]) => prev.map((s: any) => s.id === effectiveStoreId ? { ...s, dailyDigestEnabled: enabled, dailyDigestTime: time, dailyDigestStatuses: statuses } : s)); }} />
          </div>
        );
      }
      case 'customers': {
        if (selectedCustomerId) {
          const profileCustomer = customers.find(c => c.id === selectedCustomerId);
          if (profileCustomer) {
            return (
              <CustomerProfile
                customer={profileCustomer}
                orders={orders}
                events={events}
                claims={claims}
                onBack={() => setSelectedCustomerId(null)}
                onEdit={() => openModal('Customer', profileCustomer)}
                onNewOrder={() => { openModal('Order'); }}
                onNewEvent={() => { openModal('Event'); }}
                onNewClaim={() => { openModal('Claim'); }}
              />
            );
          }
        }
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-900 tracking-tighter">Customers</h3><button onClick={() => openModal('Customer')} className="px-5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"><Plus size={13} /> New</button></div>
            <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: 'All Accounts' }]} />
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4">Name</th>
                      <th className="px-8 py-4">Email</th>
                      <th className="px-8 py-4">Phone</th>
                      <th className="px-8 py-4">Orders</th>
                      <th className="px-8 py-4">Created At</th>
                      {selectedAdminStoreId === 'all' && currentUser.role === UserRole.ADMIN && <th className="px-8 py-4">Tenant</th>}
                      <th className="px-8 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomersTable.map(c => {
                      const tenant = stores.find(s => s.id === c.storeId);
                      const custOrderCount = orders.filter(o => o.customerId === c.id).length;
                      return (
                        <tr key={c.id} onClick={() => setSelectedCustomerId(c.id)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black flex-shrink-0">
                                {c.firstName[0]}{c.lastName[0]}
                              </div>
                              <span className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">{c.firstName} {c.lastName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-blue-600 font-bold">{c.email}</td>
                          <td className="px-8 py-4 text-sm text-slate-800">{c.phone || '-'}</td>
                          <td className="px-8 py-4 text-sm font-black text-slate-700">{custOrderCount}</td>
                          <td className="px-8 py-4 text-sm text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                          {selectedAdminStoreId === 'all' && currentUser.role === UserRole.ADMIN && (
                            <td className="px-8 py-4"><span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{tenant?.name || 'Unknown'}</span></td>
                          )}
                          <td className="px-8 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              {renderTableActions(['view', 'edit', 'delete'], 'Customer', c)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }
      case 'sales-orders':
      case 'sales-quotes': {
        const statusFilter = activeTab === 'sales-quotes' ? 'Quote' : activeTab === 'sales-invoices' ? 'Invoiced' : 'Processing';
        const displayLabel = activeTab === 'sales-quotes' ? 'Quote' : activeTab === 'sales-invoices' ? 'Invoice' : 'Order';
        const displayPlural = `${displayLabel}${displayLabel.endsWith('s') ? 'es' : 's'}`;
        const scopedOrders = filteredOrdersTable.filter(o => (
          activeTab === 'sales-orders'
            ? o.status !== 'Quote' && o.status !== 'Invoiced'
            : o.status === statusFilter
        ));

        const showKanban = ordersKanbanView && activeTab === 'sales-orders';
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter">{displayLabel}s</h3>
              <div className="flex items-center gap-3">
                {activeTab === 'sales-orders' && (
                  <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
                    <button onClick={() => setOrdersKanbanView(false)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!ordersKanbanView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Table</button>
                    <button onClick={() => setOrdersKanbanView(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ordersKanbanView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Kanban</button>
                  </div>
                )}
                <button onClick={() => openModal(displayLabel)} className="px-5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"><Plus size={13} /> New</button>
              </div>
            </div>
            {showKanban ? (
              <OrderKanban orders={orders} customers={customers} onEdit={(o) => openModal('Order', o)} />
            ) : (
            <>
            <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: `All ${displayPlural}` }]} />
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-4">Transaction ID</th><th className="px-8 py-4">Client</th><th className="px-8 py-4">Revenue</th><th className="px-8 py-4">Workflow</th><th className="px-8 py-4 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scopedOrders.map(order => {
                      const customer = customers.find(c => c.id === order.customerId);
                      const allowConvert = activeTab === 'sales-quotes';
                      const actions = allowConvert ? ['view', 'email', 'edit', 'delete', 'convert'] : ['view', 'email', 'edit', 'delete'];
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 text-xs font-mono text-slate-400">{order.id.slice(-8)}</td>
                          <td className="px-8 py-4 text-sm font-bold text-slate-800">{customer ? `${customer.firstName} ${customer.lastName}` : 'Direct Sale'}</td>
                          <td className="px-8 py-4 text-sm font-black text-blue-600">${order.amount.toFixed(2)}</td>
                          <td className="px-8 py-4"><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${order.status === ClaimStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{order.status}</span></td>
                          <td className="px-8 py-4"><DateBadge date={order.createdAt} /></td>
                          <td className="px-8 py-4">{renderTableActions(actions, displayLabel, order)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {scopedOrders.length === 0 && (
                  <div className="py-16 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">No {displayPlural.toLowerCase()} found.</div>
                )}
              </div>
            </div>
            </>
            )}
          </div>
        );
      }
      case 'inventory': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Inventory</h3><button onClick={() => openModal('Inventory Item')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 tracking-widest"><Plus size={14} /> Provision Catalog</button></div>
          <FilterBar query={tableSearch} setQuery={setTableSearch} filter={tableFilter} setFilter={setTableFilter} options={[{ value: 'all', label: 'Full Catalog' }, { value: 'In Stock', label: 'In Stock' }, { value: 'Low Stock', label: 'Low Stock' }, { value: 'Out of Stock', label: 'Depleted' }]} />
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="px-8 py-4">Asset Label</th><th className="px-8 py-4">SKU Code</th><th className="px-8 py-4">Physical Stock</th><th className="px-8 py-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4"><p className="text-sm font-bold text-slate-800">{item.name}</p><p className="text-[10px] text-blue-500 font-bold">${item.price.toFixed(2)} unit</p></td>
                      <td className="px-8 py-4 text-sm text-slate-500 font-mono tracking-tighter uppercase">{item.sku}</td>
                      <td className="px-8 py-4">{item.trackStock ? <span className={`text-sm font-black ${item.quantity < 5 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.quantity} units</span> : <span className="text-xs font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Unlimited</span>}</td>
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
                  <tr><th className="px-8 py-4">Ref</th><th className="px-8 py-4">Customer</th><th className="px-8 py-4">Issue Description</th><th className="px-8 py-4">Workflow</th><th className="px-8 py-4 text-right">Action</th></tr>
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
      case 'help': return <Help />;
      case 'notes': return <Notes />;
      case 'settings': {
        const currentStore = stores.find(s => s.id === effectiveStoreId) || null;
        const isGlobalView = currentUser.role === UserRole.ADMIN && selectedAdminStoreId === 'all';
        return (
          <Settings
            storeId={effectiveStoreId}
            activeStore={currentStore}
            stores={stores}
            currentUserRole={currentUser.role}
            onLeadAdded={(newLead) => setLeads(prev => [newLead, ...prev])}
            variant={isGlobalView ? 'platform' : 'full'}
            onStoreUpdated={(sid, updates) => setStores(prev => prev.map(s => s.id === sid ? { ...s, ...updates } : s))}
          />
        );
      }
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
      leads={leads}
      activeStore={activeStore}
    >
      {storeSettingsTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start justify-center p-6 overflow-y-auto animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setStoreSettingsTarget(null); }}>
          <div className="bg-slate-50 w-full max-w-3xl rounded-[32px] shadow-2xl border border-slate-200 my-8">
            <div className="px-8 py-6 bg-white rounded-t-[32px] border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Store Settings</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">{storeSettingsTarget.name}</h3>
              </div>
              <button onClick={() => setStoreSettingsTarget(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="p-8">
              <Settings
                storeId={storeSettingsTarget.id}
                activeStore={storeSettingsTarget}
                stores={stores}
                currentUserRole={currentUser.role}
                variant="store"
                onStoreUpdated={(sid, updates) => setStores(prev => prev.map(s => s.id === sid ? { ...s, ...updates } : s))}
              />
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setImportModalOpen(false); }}>
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Superadmin Tool</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">Import Leads from CSV</h3>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-1.5"><Info size={11} /> CSV Format Instructions</p>
                <div className="space-y-2 text-xs text-blue-800 font-semibold">
                  <p>Your CSV must have a <strong>header row</strong> as the first line. Supported column names:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    {[
                      ['first_name / firstname', 'First name'],
                      ['last_name / lastname', 'Last name'],
                      ['name / full_name', 'Full name (split automatically)'],
                      ['email', 'Email address'],
                      ['phone', 'Phone number'],
                      ['source', 'Lead source (e.g. Facebook)'],
                      ['status', 'New / Contacted / Qualified / Closed'],
                      ['notes / message', 'Notes or message'],
                      ['created_at / date', 'Original lead date — e.g. 03/14/2026 4:11PM (AM/PM must be uppercase)'],
                    ].map(([col, desc]) => (
                      <div key={col} className="contents">
                        <code className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{col}</code>
                        <span className="text-[10px] text-blue-600">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="pt-1 text-[10px] text-blue-600">Column names are <strong>case-insensitive</strong>. Extra columns are ignored. Rows missing a name, email, and phone are skipped. Status defaults to <strong>New</strong> if unrecognized.</p>
                </div>
                <div className="border-t border-blue-100 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Example Row</p>
                  <code className="text-[10px] font-mono text-blue-700 block bg-blue-100/60 px-3 py-2 rounded-lg">first_name,last_name,email,phone,source,created_at<br/>John,Smith,john@example.com,555-1234,Facebook,03/14/2026 4:11PM</code>
                </div>
              </div>

              {/* File picker */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select CSV File</label>
                <div
                  onClick={() => importFileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${importFile ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                >
                  <Upload size={24} className={`mx-auto mb-2 ${importFile ? 'text-blue-500' : 'text-slate-300'}`} />
                  {importFile
                    ? <p className="text-sm font-black text-blue-700">{importFile.name}</p>
                    : <p className="text-sm font-bold text-slate-400">Click to choose a .csv file</p>
                  }
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={e => { setImportFile(e.target.files?.[0] || null); setImportStatus('idle'); setImportResult(null); }}
                  />
                </div>
              </div>

              {/* Result */}
              {importStatus === 'done' && importResult && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-1 animate-in fade-in duration-200">
                  <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5"><CheckCircle2 size={14} /> Import complete</p>
                  <p className="text-xs text-emerald-600 font-semibold">{importResult.imported} leads imported · {importResult.skipped} skipped</p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                      {importResult.errors.map((e, i) => <p key={i} className="text-[10px] text-amber-600 font-semibold">{e}</p>)}
                    </div>
                  )}
                </div>
              )}
              {importStatus === 'error' && importResult && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 animate-in fade-in duration-200">
                  <p className="text-xs font-black text-rose-700 flex items-center gap-1.5"><AlertTriangle size={14} /> Import failed</p>
                  {importResult.errors.map((e, i) => <p key={i} className="text-[10px] text-rose-600 font-semibold mt-1">{e}</p>)}
                </div>
              )}

              {/* Action */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImportLeads}
                  disabled={!importFile || importStatus === 'uploading' || importStatus === 'parsing'}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Upload size={14} />
                  {importStatus === 'parsing' ? 'Parsing...' : importStatus === 'uploading' ? 'Uploading...' : 'Import Leads'}
                </button>
                <button onClick={() => setImportModalOpen(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isQuickCustomerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase">Quick Customer Add</h4>
                <button onClick={() => setIsQuickCustomerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1"><Label>First Name</Label><Input value={quickCustomer.firstName} onChange={e => setQuickCustomer((prev: any) => ({...prev, firstName: e.target.value}))}/></div>
                   <div className="space-y-1"><Label>Last Name</Label><Input value={quickCustomer.lastName} onChange={e => setQuickCustomer((prev: any) => ({...prev, lastName: e.target.value}))}/></div>
                 </div>
                 <div className="space-y-1"><Label>Email</Label><Input type="email" value={quickCustomer.email} onChange={e => setQuickCustomer((prev: any) => ({...prev, email: e.target.value}))}/></div>
                 <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={quickCustomer.phone} onChange={e => setQuickCustomer((prev: any) => ({...prev, phone: e.target.value}))}/></div>
                   <div className="space-y-1">
                      <Label>Shipping Address</Label>
                      <Input placeholder="Address Line 1" value={quickCustomer.shippingAddress.address1} onChange={e => setQuickCustomer((prev: any) => ({...prev, shippingAddress: {...prev.shippingAddress, address1: e.target.value}}))}/>
                      <Input placeholder="Address Line 2" value={quickCustomer.shippingAddress.address2} onChange={e => setQuickCustomer((prev: any) => ({...prev, shippingAddress: {...prev.shippingAddress, address2: e.target.value}}))}/>
                      <Input placeholder="City" value={quickCustomer.shippingAddress.city} onChange={e => setQuickCustomer((prev: any) => ({...prev, shippingAddress: {...prev.shippingAddress, city: e.target.value}}))}/>
                      <Input placeholder="State" value={quickCustomer.shippingAddress.state} onChange={e => setQuickCustomer((prev: any) => ({...prev, shippingAddress: {...prev.shippingAddress, state: e.target.value}}))}/>
                      <Input placeholder="Zip" value={quickCustomer.shippingAddress.zip} onChange={e => setQuickCustomer((prev: any) => ({...prev, shippingAddress: {...prev.shippingAddress, zip: e.target.value}}))}/>
                   </div>
                   <div className="flex items-center gap-2 my-2">
                      <input type="checkbox" id="billingDifferent" checked={quickCustomer.billingDifferent} onChange={e => setQuickCustomer((prev: any) => ({...prev, billingDifferent: e.target.checked}))} />
                      <label htmlFor="billingDifferent" className="text-xs font-medium">Billing address is different than shipping address</label>
                   </div>
                   {quickCustomer.billingDifferent && (
                     <div className="space-y-1">
                        <Label>Billing Address</Label>
                        <Input placeholder="Address Line 1" value={quickCustomer.billingAddress?.address1} onChange={e => setQuickCustomer((prev: any) => ({...prev, billingAddress: {...prev.billingAddress, address1: e.target.value}}))}/>
                        <Input placeholder="Address Line 2" value={quickCustomer.billingAddress?.address2} onChange={e => setQuickCustomer((prev: any) => ({...prev, billingAddress: {...prev.billingAddress, address2: e.target.value}}))}/>
                        <Input placeholder="City" value={quickCustomer.billingAddress?.city} onChange={e => setQuickCustomer((prev: any) => ({...prev, billingAddress: {...prev.billingAddress, city: e.target.value}}))}/>
                        <Input placeholder="State" value={quickCustomer.billingAddress?.state} onChange={e => setQuickCustomer((prev: any) => ({...prev, billingAddress: {...prev.billingAddress, state: e.target.value}}))}/>
                        <Input placeholder="Zip" value={quickCustomer.billingAddress?.zip} onChange={e => setQuickCustomer((prev: any) => ({...prev, billingAddress: {...prev.billingAddress, zip: e.target.value}}))}/>
                     </div>
                   )}
                </div>
              </div>
              <div className="px-4 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setIsQuickCustomerOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Cancel</button>
                <button onClick={handleQuickCustomerSave} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-500/20">Add Customer</button>
              </div>
            </div>
        </div>
      )}

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
              {(modalType.toLowerCase().includes('order') || modalType.toLowerCase().includes('quote')) && (
                <button onClick={() => handleSendInvoiceEmail()} disabled={emailSending} className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"><Mail size={14} /> {emailSending ? 'Sending...' : 'Email Invoice'}</button>
              )}
              {(!modalType.startsWith('View') || modalType.toLowerCase().includes('order') || modalType.toLowerCase().includes('quote')) && <button onClick={handleSave} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Save size={14} /> Save</button>}
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
