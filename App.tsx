
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Planner from './components/Planner';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Accounting from './components/Accounting';
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
  OrderLineItem
} from './types';
import { MOCK_LEADS, MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CLAIMS, MOCK_INVENTORY } from './services/mockData';
import { db, getCurrentStoreId } from './services/supabase';
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
  Clock
} from 'lucide-react';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Temporary state for the line item creation process
  const [newLineItemProduct, setNewLineItemProduct] = useState('');
  const [newLineItemQty, setNewLineItemQty] = useState(1);

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
    setSelectedItem(item ? JSON.parse(JSON.stringify(item)) : {
      status: type.includes('Lead') ? LeadStatus.NEW : 
              type.includes('Event') ? PlannerEventStatus.SCHEDULED : 
              type.includes('Claim') ? ClaimStatus.OPEN : 'Processing',
      type: type.includes('Event') ? PlannerEventType.MEASUREMENT : undefined,
      trackStock: type.includes('Inventory') ? true : undefined,
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
    setSelectedItem(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-recalculate amount based on line items whenever lineItems array changes
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

  const updateAddress = (key: string, value: any) => {
    setSelectedItem(prev => ({
      ...prev,
      shippingAddress: {
        ...(prev.shippingAddress || {}),
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    const displayType = modalType.replace('View ', '').toLowerCase();
    
    try {
      if (selectedItem?.id && !selectedItem.id.toString().startsWith('gen-')) {
        if (displayType.includes('lead')) {
          await db.leads.update(selectedItem.id, selectedItem);
          setLeads(prev => prev.map(item => item.id === selectedItem.id ? { ...item, ...selectedItem } : item));
        } else if (displayType.includes('customer')) {
          await db.customers.update(selectedItem.id, selectedItem);
          setCustomers(prev => prev.map(item => item.id === selectedItem.id ? { ...item, ...selectedItem } : item));
        } else if (displayType.includes('event')) {
          await db.planner.update(selectedItem.id, selectedItem);
          setEvents(prev => prev.map(item => item.id === selectedItem.id ? { ...item, ...selectedItem } : item));
        }
      } else {
        const newItemPayload = { ...selectedItem, storeId: activeStoreId };
        
        if (displayType.includes('lead')) {
          const saved = await db.leads.create(newItemPayload);
          setLeads(prev => [saved as any, ...prev]);
        } else if (displayType.includes('customer')) {
          const saved = await db.customers.create(newItemPayload);
          setCustomers(prev => [saved as any, ...prev]);
        } else if (displayType.includes('event')) {
          const saved = await db.planner.create(newItemPayload);
          setEvents(prev => [saved as any, ...prev]);
        } else {
          const mockId = `gen-${Date.now()}`;
          const mockItem = { 
            ...selectedItem, 
            id: mockId, 
            createdAt: new Date().toISOString() 
          };
          if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('sale')) setOrders(prev => [mockItem, ...prev]);
          else if (displayType.includes('claim')) setClaims(prev => [mockItem, ...prev]);
          else if (displayType.includes('inventory')) setInventory(prev => [mockItem, ...prev]);
        }
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save record:', err);
      alert('Error saving to database. See console for details.');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm(`Permanently delete this ${type}?`)) return;
    const t = type.toLowerCase();
    
    try {
      if (t === 'lead') {
        await db.leads.delete(id);
        setLeads(prev => prev.filter(l => l.id !== id));
      } else if (t === 'customer') {
        await db.customers.delete(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
      } else if (t === 'event') {
        await db.planner.delete(id);
        setEvents(prev => prev.filter(e => e.id !== id));
      } else {
        if (['order', 'quote', 'invoice', 'sale'].includes(t)) setOrders(prev => prev.filter(o => o.id !== id));
        else if (t === 'claim') setClaims(prev => prev.filter(c => c.id !== id));
        else if (t.includes('inventory')) setInventory(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete from database.');
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    if (!window.confirm(`Convert ${lead.firstName} to a customer?`)) return;
    
    const newCustPayload = {
      storeId: lead.storeId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      shippingAddress: { address1: '', address2: '', city: '', state: '', zip: '', country: 'US' },
      billingDifferent: false,
      notes: `Converted from lead.`,
      createdAt: new Date().toISOString()
    };

    try {
      const savedCustomer = await db.customers.create(newCustPayload);
      await db.leads.update(lead.id, { ...lead, status: LeadStatus.QUALIFIED });
      
      setCustomers(prev => [savedCustomer as any, ...prev]);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.QUALIFIED } : l));
      setActiveTab('customers');
    } catch (err) {
      console.error('Lead conversion failed:', err);
      alert('Failed to convert lead.');
    }
  };

  const handleConvertQuote = (quote: Order) => {
    if (!window.confirm(`Confirm order placement for Quote #${quote.id.slice(-6)}?`)) return;
    setOrders(prev => prev.map(o => o.id === quote.id ? { ...o, status: 'Processing' } : o));
    setActiveTab('sales-orders');
  };

  const renderModalContent = () => {
    const isView = modalType.startsWith('View');
    const displayType = modalType.replace('View ', '').toLowerCase();
    const attachments: Attachment[] = selectedItem?.attachments || [];
    const lineItems: OrderLineItem[] = selectedItem?.lineItems || [];
    
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

           {lineItems.length > 0 && (
             <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                 <ShoppingCart size={16} className="text-blue-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Purchase Details</h4>
               </div>
               <table className="w-full">
                 <thead>
                   <tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-50">
                     <th className="text-left pb-2">Product</th>
                     <th className="text-center pb-2">Qty</th>
                     <th className="text-right pb-2">Price</th>
                     <th className="text-right pb-2">Subtotal</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {lineItems.map(item => (
                     <tr key={item.id}>
                       <td className="py-3 text-sm font-bold text-slate-800">{item.productName} <span className="text-[10px] text-slate-400 block font-normal">{item.sku}</span></td>
                       <td className="py-3 text-center text-sm font-bold text-slate-600">{item.quantity}</td>
                       <td className="py-3 text-right text-sm font-medium text-slate-500">${item.price.toFixed(2)}</td>
                       <td className="py-3 text-right text-sm font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               <div className="pt-4 border-t border-slate-100 flex justify-end">
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Transaction</p>
                    <p className="text-2xl font-black text-slate-900">${(selectedItem?.amount || 0).toFixed(2)}</p>
                 </div>
               </div>
             </div>
           )}

           {attachments.length > 0 && (
             <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                  <FileText size={16} className="text-blue-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Linked Documents ({attachments.length})</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-blue-500 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate" title={att.name}>{att.name}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{(att.type.split('/')[1] || 'DOC').toUpperCase()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadAttachment(att)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                        title="Download Document"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      );
    }

    if (displayType.includes('customer')) {
      return (
        <div className="space-y-10">
          <FormSection title="Basic Profile" icon={Users}>
            <div className="space-y-1"><Label>First Name</Label><Input value={selectedItem?.firstName} onChange={e => updateSelectedItem('firstName', e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input value={selectedItem?.lastName} onChange={e => updateSelectedItem('lastName', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Email Address</Label><Input value={selectedItem?.email} onChange={e => updateSelectedItem('email', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Phone Number</Label><Input value={selectedItem?.phone} onChange={e => updateSelectedItem('phone', e.target.value)} /></div>
          </FormSection>
          
          <FormSection title="Shipping Details" icon={Package}>
            <div className="space-y-1 col-span-2"><Label>Street Address</Label><Input value={selectedItem?.shippingAddress?.address1} onChange={e => updateAddress('address1', e.target.value)} /></div>
            <div className="space-y-1"><Label>City</Label><Input value={selectedItem?.shippingAddress?.city} onChange={e => updateAddress('city', e.target.value)} /></div>
            <div className="space-y-1"><Label>State</Label><Input value={selectedItem?.shippingAddress?.state} onChange={e => updateAddress('state', e.target.value)} /></div>
            <div className="space-y-1"><Label>Zip Code</Label><Input value={selectedItem?.shippingAddress?.zip} onChange={e => updateAddress('zip', e.target.value)} /></div>
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
            <div className="space-y-1"><Label>Email</Label><Input value={selectedItem?.email} onChange={e => updateSelectedItem('email', e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={selectedItem?.phone} onChange={e => updateSelectedItem('phone', e.target.value)} /></div>
            <div className="space-y-1"><Label>Current Status</Label>
              <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="space-y-1"><Label>Lead Source</Label><Input value={selectedItem?.source} onChange={e => updateSelectedItem('source', e.target.value)} placeholder="e.g. Website, Google" /></div>
          </FormSection>
          <FormSection title="Client Message" icon={AlertCircle}>
            <div className="space-y-1 col-span-2"><Label>Message / Requirements</Label><Input type="textarea" value={selectedItem?.message} onChange={e => updateSelectedItem('message', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('order') || displayType.includes('quote') || displayType.includes('invoice') || displayType.includes('sale')) {
      return (
        <div className="space-y-10">
          <FormSection title="Client & Workflow" icon={DollarSign}>
            <div className="space-y-1 col-span-2">
              <Label>Select Customer</Label>
              <Select value={selectedItem?.customerId} onChange={e => updateSelectedItem('customerId', e.target.value)}>
                <option value="">Choose a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Workflow Status</Label>
              <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                <option value="Quote">Quote</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          </FormSection>

          <FormSection title="Product Line Items" icon={ShoppingCart}>
             <div className="col-span-2 space-y-4">
                <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex-1 space-y-1">
                      <Label>Add Product from Inventory</Label>
                      <Select value={newLineItemProduct} onChange={e => setNewLineItemProduct(e.target.value)}>
                         <option value="">Select a product to add...</option>
                         {inventory.map(i => <option key={i.id} value={i.id}>{i.name} - ${i.price.toFixed(2)} (SKU: {i.sku})</option>)}
                      </Select>
                   </div>
                   <div className="w-24 space-y-1">
                      <Label>Quantity</Label>
                      <Input type="number" value={newLineItemQty} onChange={e => setNewLineItemQty(Number(e.target.value))} min={1} />
                   </div>
                   <button 
                     onClick={addLineItem}
                     className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                   >
                     Add Item
                   </button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                         <tr>
                            <th className="px-6 py-3">Catalog Item</th>
                            <th className="px-6 py-3 text-center">Qty</th>
                            <th className="px-6 py-3 text-right">Unit Price</th>
                            <th className="px-6 py-3 text-right">Subtotal</th>
                            <th className="px-6 py-3 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {lineItems.length > 0 ? (
                          lineItems.map(item => (
                            <tr key={item.id} className="text-sm group">
                               <td className="px-6 py-3">
                                  <span className="font-bold text-slate-800">{item.productName}</span>
                                  <span className="text-[10px] text-slate-400 block font-mono uppercase">{item.sku}</span>
                               </td>
                               <td className="px-6 py-3 text-center font-bold text-slate-600">{item.quantity}</td>
                               <td className="px-6 py-3 text-right text-slate-500">${item.price.toFixed(2)}</td>
                               <td className="px-6 py-3 text-right font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</td>
                               <td className="px-6 py-3 text-right">
                                  <button onClick={() => removeLineItem(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                               </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No products in this {displayType} yet.</td></tr>
                        )}
                      </tbody>
                   </table>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-[32px] flex justify-between items-center shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <DollarSign size={80} />
                   </div>
                   <div className="space-y-1 relative z-10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Auto-Computed Grand Total</p>
                      <h4 className="text-3xl font-black tracking-tighter uppercase leading-none">Total Due (USD)</h4>
                   </div>
                   <div className="text-5xl font-black text-blue-400 relative z-10 tabular-nums">
                      ${(selectedItem?.amount || 0).toFixed(2)}
                   </div>
                </div>
             </div>
          </FormSection>

          <FormSection title="Administrative Notes & Files" icon={Package}>
            <div className="space-y-1 col-span-2">
              <Label>Internal Order Notes</Label>
              <Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} placeholder="Type private notes here..." />
            </div>
            
            <div className="col-span-2 pt-4">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <Label>Linked Project Documents ({attachments.length})</Label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  <Paperclip size={12} /> Link Document
                </button>
              </div>

              {attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-blue-500 transition-all shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate" title={att.name}>{att.name}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{(att.type.split('/')[1] || 'DOC').toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => downloadAttachment(att)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={() => removeAttachment(att.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[28px] flex flex-col items-center justify-center text-slate-400">
                  <FileText size={24} className="mb-2 opacity-20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">No Documents Linked</span>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('claim')) {
      return (
        <div className="space-y-10">
          <FormSection title="Support Request" icon={AlertCircle}>
             <div className="space-y-1 col-span-2">
              <Label>Affected Customer</Label>
              <Select value={selectedItem?.customerId} onChange={e => updateSelectedItem('customerId', e.target.value)}>
                <option value="">Choose a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </Select>
            </div>
            <div className="space-y-1"><Label>Current Status</Label>
              <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                {Object.values(ClaimStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </FormSection>
          <FormSection title="Problem Details" icon={Package}>
            <div className="space-y-1 col-span-2"><Label>Issue Description</Label><Input type="textarea" value={selectedItem?.issue} onChange={e => updateSelectedItem('issue', e.target.value)} /></div>
            <div className="space-y-1 col-span-2"><Label>Resolution Notes</Label><Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('event')) {
      return (
        <div className="space-y-10">
          <FormSection title="Scheduling" icon={Calendar}>
             <div className="space-y-1">
              <Label>Event Type</Label>
              <Select value={selectedItem?.type} onChange={e => updateSelectedItem('type', e.target.value)}>
                {Object.values(PlannerEventType).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={selectedItem?.date} onChange={e => updateSelectedItem('date', e.target.value)} />
            </div>
            <div className="space-y-1"><Label>Customer Name</Label><Input value={selectedItem?.customerName} onChange={e => updateSelectedItem('customerName', e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Event Status</Label>
              <Select value={selectedItem?.status} onChange={e => updateSelectedItem('status', e.target.value)}>
                {Object.values(PlannerEventStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </FormSection>
          <FormSection title="Location & Context" icon={Package}>
             <div className="space-y-1 col-span-2"><Label>Site Address</Label><Input value={selectedItem?.address} onChange={e => updateSelectedItem('address', e.target.value)} /></div>
             <div className="space-y-1 col-span-2"><Label>Task Notes</Label><Input type="textarea" value={selectedItem?.notes} onChange={e => updateSelectedItem('notes', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    if (displayType.includes('inventory')) {
      return (
        <div className="space-y-10">
          <FormSection title="Catalog Item" icon={Package}>
            <div className="space-y-1 col-span-2"><Label>Product Name</Label><Input value={selectedItem?.name} onChange={e => updateSelectedItem('name', e.target.value)} /></div>
            <div className="space-y-1"><Label>SKU Code</Label><Input value={selectedItem?.sku} onChange={e => updateSelectedItem('sku', e.target.value)} /></div>
            <div className="space-y-1"><Label>Unit Price ($)</Label><Input type="number" value={selectedItem?.price} onChange={e => updateSelectedItem('price', Number(e.target.value))} /></div>
            <div className="space-y-4 col-span-1">
              <Label>Stock Tracking</Label>
              <button 
                onClick={() => updateSelectedItem('trackStock', !selectedItem?.trackStock)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                  selectedItem?.trackStock ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${selectedItem?.trackStock ? 'bg-white text-blue-600 border-white' : 'bg-white border-slate-200'}`}>
                  {selectedItem?.trackStock && <Check size={12} strokeWidth={4} />}
                </div>
                {selectedItem?.trackStock ? 'Tracking Active' : 'Not Tracked (Service/Misc)'}
              </button>
            </div>
            {selectedItem?.trackStock && (
              <div className="space-y-1"><Label>Current Stock Qty</Label><Input type="number" value={selectedItem?.quantity} onChange={e => updateSelectedItem('quantity', Number(e.target.value))} /></div>
            )}
          </FormSection>
          <FormSection title="Warehouse Notes" icon={AlertCircle}>
            <div className="space-y-1 col-span-2"><Label>Description</Label><Input type="textarea" value={selectedItem?.description} onChange={e => updateSelectedItem('description', e.target.value)} /></div>
          </FormSection>
        </div>
      );
    }

    return <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">Interface Ready for: {displayType}</div>;
  };

  const renderTableActions = (actions: string[], type: string, item: any) => (
    <div className="flex items-center gap-1">
       {actions.includes('convert') && <button onClick={() => handleConvertQuote(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Confirm Order"><ArrowRightCircle size={18} /></button>}
       {actions.includes('view') && <button onClick={() => openModal(`View ${type}`, item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="View"><Eye size={18} /></button>}
       {actions.includes('edit') && <button onClick={() => openModal(type, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit"><Edit2 size={18} /></button>}
       {actions.includes('delete') && currentUser.role === UserRole.ADMIN && <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete"><Trash2 size={18} /></button>}
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4"><Clock className="animate-spin" size={24} /> Syncing Enterprise Pipeline...</div>;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard leads={leads} orders={orders} claims={claims} customers={customers} />;
      case 'leads': return <LeadList leads={leads} role={currentUser.role} onUpdateStatus={(id, s) => setLeads(prev => prev.map(l => l.id === id ? {...l, status: s} : l))} onConvert={handleConvertLead} onDelete={(id) => handleDelete('lead', id)} onEdit={(lead) => openModal('Lead', lead)} />;
      case 'customers': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Customer Directory</h3><button onClick={() => openModal('Customer')} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">Add New Account</button></div>
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr><th className="px-8 py-4">Account Holder</th><th className="px-8 py-4">Contact Gateway</th><th className="px-8 py-4">Created On</th><th className="px-8 py-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-8 py-4">
                        <p className="text-sm font-bold text-slate-800">{c.firstName} {c.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase">ID: {c.id.slice(-6)}</p>
                    </td>
                    <td className="px-8 py-4 text-sm text-blue-600 font-bold">{c.email}</td>
                    <td className="px-8 py-4"><DateBadge date={c.createdAt} /></td>
                    <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete'], 'Customer', c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'claims': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Support & Claim Ledger</h3>
            <button onClick={() => openModal('Claim')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
              <Plus size={14} /> File New Claim
            </button>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4">Ref Ticket</th>
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-8 py-4">Issue Priority</th>
                  <th className="px-8 py-4">Workflow</th>
                  <th className="px-8 py-4">Opened On</th>
                  <th className="px-8 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map(claim => {
                  const customer = customers.find(c => c.id === claim.customerId);
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 text-xs font-mono text-slate-400">#{claim.id.slice(-6)}</td>
                      <td className="px-8 py-4 text-sm font-bold text-slate-800">{customer ? `${customer.firstName} ${customer.lastName}` : 'Direct Claim'}</td>
                      <td className="px-8 py-4 text-sm text-slate-500 truncate max-w-[200px]">{claim.issue}</td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                          claim.status === ClaimStatus.RESOLVED ? 'bg-emerald-100 text-emerald-600' :
                          claim.status === ClaimStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-8 py-4"><DateBadge date={claim.createdAt} /></td>
                      <td className="px-8 py-4">{renderTableActions(['view', 'edit', 'delete'], 'Claim', claim)}</td>
                    </tr>
                  );
                })}
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
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tighter">{displayLabel} Operations</h3><button onClick={() => openModal(displayLabel)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">Draft {displayLabel}</button></div>
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Transaction ID</th>
                    <th className="px-8 py-4">Gross Revenue</th>
                    <th className="px-8 py-4">Fulfillment</th>
                    <th className="px-8 py-4">Created On</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.filter(o => o.status === statusFilter || (activeTab === 'sales-orders' && o.status !== 'Quote' && o.status !== 'Invoiced')).map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 text-xs font-mono text-slate-400">{o.id.slice(-8)}</td>
                      <td className="px-8 py-4 text-sm font-black text-blue-600">${o.amount.toFixed(2)}</td>
                      <td className="px-8 py-4"><span className="text-[10px] font-black uppercase tracking-tighter bg-slate-100 px-3 py-1 rounded-full">{o.status}</span></td>
                      <td className="px-8 py-4"><DateBadge date={o.createdAt} /></td>
                      <td className="px-8 py-4 text-right">{renderTableActions(['view', 'edit', 'delete', 'convert'].filter(a => a !== 'convert' || statusFilter === 'Quote'), displayLabel, o)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'inventory': return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Inventory & SKU Catalog</h3>
            <button onClick={() => openModal('Inventory Item')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 tracking-widest">
              <Plus size={14} /> Provision Catalog
            </button>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr><th className="px-8 py-4">Asset Label</th><th className="px-8 py-4">SKU / Code</th><th className="px-8 py-4">Physical Stock</th><th className="px-8 py-4">Listed On</th><th className="px-8 py-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-blue-500 font-bold">${item.price.toFixed(2)} unit</p>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-500 font-mono tracking-tighter uppercase">{item.sku}</td>
                    <td className="px-8 py-4">
                      {item.trackStock ? (
                        <span className={`text-sm font-black ${item.quantity < 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.quantity} units
                        </span>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                          Unlimited/Service
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4"><DateBadge date={item.createdAt} /></td>
                    <td className="px-8 py-4 text-right">{renderTableActions(['edit', 'delete'], 'Inventory Item', item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'reports': return <Reports leads={leads} orders={orders} claims={claims} />;
      case 'accounting': return <Accounting orders={orders} />;
      case 'planner': return <Planner events={events} onAddEvent={() => openModal('Event')} onEditEvent={(e) => openModal('Event', e)} onDeleteEvent={(id) => handleDelete('event', id)} />;
      case 'settings': return <Settings storeId={activeStoreId} />;
      default: return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Enterprise Module Active: {activeTab}</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onRoleSwitch={handleRoleSwitch}>
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{modalType}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{selectedItem?.id && !modalType.startsWith('View') ? `LIVE REVISION: ${selectedItem.id}` : 'NEW SYSTEM RECORD'}</p>
                  </div>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:scale-110 transition-transform"><X size={20} /></button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">{renderModalContent()}</div>
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={closeModal} className="px-8 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-colors">Discard Draft</button>
              {!modalType.startsWith('View') && (
                <button onClick={handleSave} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <Save size={14} />
                  Commit System Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
