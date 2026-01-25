
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  AlertCircle, 
  ListTodo, 
  Package, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Settings, 
  LogOut,
  Store,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Lock,
  Clock,
  Check,
  FileText,
  Quote
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  subItems?: { id: string; label: string; icon: any }[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { 
    id: 'sales', 
    label: 'Sales', 
    icon: DollarSign,
    subItems: [
      { id: 'sales-orders', label: 'Orders', icon: FileText },
      { id: 'sales-invoices', label: 'Invoices', icon: BookOpen },
      { id: 'sales-quotes', label: 'Quotes', icon: Quote },
    ]
  },
  { id: 'claims', label: 'Claim Management', icon: AlertCircle },
  { id: 'leads', label: 'Lead Management', icon: ListTodo },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'planner', label: 'Planner', icon: Calendar },
  { id: 'accounting', label: 'Accounting', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-700 border-blue-200',
  'Contacted': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Qualified': 'bg-purple-100 text-purple-700 border-purple-200',
  'Closed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Archived': 'bg-slate-100 text-slate-700 border-slate-200',
  'Open': 'bg-rose-100 text-rose-700 border-rose-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const STATUS_ICONS: Record<string, React.ReactNode> = {
  'New': <Sparkles size={12} />,
  'Contacted': <MessageSquare size={12} />,
  'Qualified': <CheckCircle2 size={12} />,
  'Closed': <Lock size={12} />,
  'Archived': <Package size={12} />,
  'Open': <AlertCircle size={12} />,
  'In Progress': <Clock size={12} />,
  'Resolved': <Check size={12} />,
};
