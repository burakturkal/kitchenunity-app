
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER'
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  CLOSED = 'Closed',
  ARCHIVED = 'Archived'
}

export enum ClaimStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum PlannerEventType {
  MEASUREMENT = 'Site Measurement',
  DESIGN = 'Design Appointment',
  DELIVERY = 'Delivery',
  INSTALL = 'Installation',
  SERVICE = 'Service',
  INTERNAL = 'Internal Task'
}

export enum PlannerEventStatus {
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  RESCHEDULED = 'Rescheduled'
}

export interface Address {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderLineItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface PlannerEvent {
  id: string;
  storeId: string;
  type: PlannerEventType;
  customerId?: string;
  customerName?: string;
  date: string;
  time?: string;
  address: string;
  assignedTo?: string;
  notes: string;
  status: PlannerEventStatus;
}

export interface CabinetStore {
  id: string;
  name: string;
  domain: string;
  ownerEmail: string;
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
}

export interface Lead {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  status: LeadStatus;
}

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  amount: number;
  status: string;
  createdAt: string;
  trackingNumber?: string;
  lineItems: OrderLineItem[];
  taxRate: number;
  isNonTaxable: boolean;
  notes: string;
}

export interface Claim {
  id: string;
  storeId: string;
  customerId: string;
  issue: string;
  status: ClaimStatus;
  createdAt: string;
  notes: string;
}

export interface Customer {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  billingDifferent: boolean;
  notes: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  trackStock: boolean;
  description: string;
}
