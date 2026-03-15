
import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Users,
  ListTodo,
  ShoppingBag,
  Package,
  Calendar,
  BarChart3,
  BookMarked,
  Settings,
  AlertCircle,
  Zap,
  CheckCircle2,
  ArrowRight,
  Search,
  Play,
  Info
} from 'lucide-react';

interface Section {
  id: string;
  icon: any;
  title: string;
  color: string;
  bg: string;
  steps: { title: string; desc: string }[];
  tips?: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'leads',
    icon: ListTodo,
    title: 'Lead Management',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    steps: [
      { title: 'Add a new lead', desc: 'Click the "+ New Lead" button at the top of the Lead Management page. Fill in the contact\'s name, email, phone, and where they came from (source).' },
      { title: 'Set a status', desc: 'Each lead has a status: New → Contacted → Qualified → Closed. Update the status as you progress through the sales conversation.' },
      { title: 'Use the filters', desc: 'Filter leads by status, source, or date range using the filter bar at the top of the list. This helps you focus on the right prospects.' },
      { title: 'Export leads', desc: 'Click "Export CSV" to download your full lead list as a spreadsheet — great for reporting or importing into other tools.' },
      { title: 'Embed form on your website', desc: 'Go to Settings → Lead Capture to get an HTML embed code you can paste on your website. Leads submitted through the form appear here automatically.' },
    ],
    tips: [
      'Archive old leads instead of deleting so you keep a history.',
      'Set a source for every lead — the Dashboard will show you which channels are converting best.',
    ],
  },
  {
    id: 'customers',
    icon: Users,
    title: 'Customer Management',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-100',
    steps: [
      { title: 'Add a customer', desc: 'Click "+ New Customer" on the Customers page. Enter name, email, phone, and address details.' },
      { title: 'View a customer profile', desc: 'Click on any customer row to open their full profile. You\'ll see their contact info, all their orders, appointments, and claims in one place.' },
      { title: 'Attach notes', desc: 'Inside a customer profile you can add notes to keep track of conversations, preferences, or special requests.' },
      { title: 'Connect orders', desc: 'When creating a new order, search for and select the customer. The order will then appear on their profile automatically.' },
    ],
    tips: [
      'Keep the shipping address updated — it\'s used to auto-fill orders.',
      'Use the search bar at the top of the customer list to find anyone instantly.',
    ],
  },
  {
    id: 'orders',
    icon: ShoppingBag,
    title: 'Orders & Quotes',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
    steps: [
      { title: 'Create a quote', desc: 'Go to Sales → Quotes and click "+ New Quote". Select the customer, add line items (products/services with quantities and prices), and save.' },
      { title: 'Convert to an order', desc: 'Open a quote and click "Convert to Order". The status will change to Processing and it will appear under Sales → Orders.' },
      { title: 'Track order progress', desc: 'Orders move through 5 stages: Quote → Processing → Invoiced → Shipped → Completed. Update the status as work progresses.' },
      { title: 'Use the Kanban view', desc: 'On the Orders page, click the "Kanban" toggle to see orders as cards in columns — great for a visual overview of your pipeline.' },
      { title: 'Add line items', desc: 'Each order supports multiple line items. Enter the product/service name, unit price, quantity, and the total calculates automatically.' },
    ],
    tips: [
      'Always mark orders as "Completed" once paid — this keeps the Accounting page accurate.',
      'The Accounting tab uses order statuses to calculate receivables vs cleared revenue.',
    ],
  },
  {
    id: 'inventory',
    icon: Package,
    title: 'Inventory',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    steps: [
      { title: 'Add inventory items', desc: 'Click "+ New Item" on the Inventory page. Enter the item name, SKU, quantity on hand, and unit cost.' },
      { title: 'Monitor stock levels', desc: 'Items with low stock are flagged with a warning. Set a reorder threshold so you know when to restock.' },
      { title: 'Update quantities', desc: 'Click the edit icon on any item to update the quantity, price, or description. Changes are saved immediately.' },
    ],
    tips: [
      'Use consistent SKUs to make searching easier.',
      'Check inventory before creating a quote to avoid promising items you don\'t have.',
    ],
  },
  {
    id: 'planner',
    icon: Calendar,
    title: 'Planner & Appointments',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-100',
    steps: [
      { title: 'Schedule an event', desc: 'Click a date on the Planner or use the "+ New Event" button. Set the type (Measurement, Installation, Follow-Up, etc.), customer, and location.' },
      { title: 'View by month', desc: 'The planner defaults to a monthly calendar view. Click any event to see its details or edit it.' },
      { title: 'Update event status', desc: 'Mark events as Scheduled, Completed, or Cancelled so your team stays in sync.' },
    ],
    tips: [
      'Link every appointment to a customer record — it shows up on their profile.',
      'Use the "Follow-Up" type to remind yourself to call a lead back.',
    ],
  },
  {
    id: 'claims',
    icon: AlertCircle,
    title: 'Claim Management',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-100',
    steps: [
      { title: 'File a claim', desc: 'Click "+ New Claim" on the Claim Management page. Link it to a customer and order if applicable, describe the issue, and set the initial status to "Open".' },
      { title: 'Track resolution', desc: 'Update the status as you work through the issue: Open → In Progress → Resolved. Add notes to document what steps were taken.' },
      { title: 'Review open claims', desc: 'Sort by status to see all unresolved claims at a glance. Prioritize older open claims to avoid customer frustration.' },
    ],
    tips: [
      'Resolve claims promptly — open claims reflect in your dashboard.',
      'Attach photos or reference order IDs in the notes field for context.',
    ],
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Reports',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-100',
    steps: [
      { title: 'View revenue trends', desc: 'The Reports page shows revenue over time, lead sources, and order volume. Use date filters to zoom into a specific period.' },
      { title: 'Lead source performance', desc: 'See which channels (website, referral, Google, etc.) are sending the most leads and converting best.' },
      { title: 'Export data', desc: 'Most report tables have a CSV export. Use these for monthly business reviews or to share with your accountant.' },
    ],
    tips: [
      'Check reports weekly to catch slow periods early.',
      'Combine with the Accounting tab for a full financial picture.',
    ],
  },
  {
    id: 'accounting',
    icon: BookMarked,
    title: 'Accounting',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-100',
    steps: [
      { title: 'Read the ledger', desc: 'Every order appears as a line in the General Ledger. The status shows whether it\'s paid (Completed) or still outstanding.' },
      { title: 'Tax tracking', desc: 'Orders marked with a tax rate show estimated tax liability. Mark orders as "Non-Taxable" (e.g. resellers) to exclude them.' },
      { title: 'Export for your accountant', desc: 'Click "Export CSV" to download the full ledger. Share this with your accountant at tax time.' },
    ],
    tips: [
      'This module is for reference and light bookkeeping — connect a dedicated accounting tool for full accrual accounting.',
      'Keep order statuses accurate to get correct receivables figures.',
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    steps: [
      { title: 'Update store info', desc: 'Set your store name, email, phone number, and address. This info appears on invoices and customer communications.' },
      { title: 'Lead capture embed', desc: 'Generate an HTML embed code to place a lead form on your website. Leads come directly into your CRM automatically.' },
      { title: 'Notification preferences', desc: 'Configure your contact email and SMS number to receive alerts when new leads come in.' },
    ],
    tips: [
      'Keep your store email up to date — it\'s used for lead notifications.',
      'Test your embed form after installing it on your website.',
    ],
  },
];

const Help: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('leads');
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.steps.some(st => st.title.toLowerCase().includes(search.toLowerCase()) || st.desc.toLowerCase().includes(search.toLowerCase()))
      )
    : SECTIONS;

  return (
    <div className="space-y-10 pb-24 max-w-4xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-10 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <BookOpen size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">KitchenUnity CRM</p>
              <h3 className="text-2xl font-black tracking-tighter leading-none">Help & Documentation</h3>
            </div>
          </div>
          <p className="text-blue-100 text-sm font-semibold max-w-lg">
            Everything you need to know to run your cabinet store using KitchenUnity. Click any section below to expand step-by-step instructions.
          </p>
        </div>
      </div>

      {/* Quick start banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-6 flex items-start gap-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Zap size={18} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-900 tracking-tight">Quick Start Checklist</p>
          <div className="mt-2 space-y-1.5">
            {[
              'Go to Settings → update your store name, email, and phone',
              'Add your first customer under the Customers tab',
              'Create a quote under Sales → Quotes',
              'Install the lead capture form on your website (Settings → Lead Capture)',
              'Check the Dashboard daily to monitor leads and revenue',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search documentation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all shadow-sm"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filtered.map(section => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center gap-4 px-7 py-5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${section.bg}`}>
                  <Icon size={18} className={section.color} />
                </div>
                <span className="flex-1 text-sm font-black text-slate-900 tracking-tight">{section.title}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">
                  {section.steps.length} steps
                </span>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-7 pb-7 space-y-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    {section.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-500 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{step.title}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {section.tips && section.tips.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                        <Info size={11} /> Pro Tips
                      </p>
                      {section.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-blue-700 font-semibold">
                          <ArrowRight size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm font-semibold">
            No results for "{search}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-6 flex items-center gap-4">
        <Play size={18} className="text-slate-400 flex-shrink-0" />
        <p className="text-xs text-slate-500 font-semibold">
          Need more help? Contact KitchenUnity support at <span className="text-blue-600 font-black">support@kitchenunity.com</span> — we typically respond within one business day.
        </p>
      </div>
    </div>
  );
};

export default Help;
