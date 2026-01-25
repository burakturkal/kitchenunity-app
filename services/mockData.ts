
import { CabinetStore, Lead, LeadStatus, Order, Claim, Customer, ClaimStatus, InventoryItem, ExpenseType, Expense } from '../types';

// Mock global sales tax and expense types for accounting
export const MOCK_SALES_TAX = 8.25;
export const MOCK_EXPENSE_TYPES: ExpenseType[] = [
  { id: 'exp-1', name: 'Shipping', description: 'Shipping and delivery costs' },
  { id: 'exp-2', name: 'Labor', description: 'Labor costs' },
  { id: 'exp-3', name: 'Materials', description: 'Material costs' },
];

export const MOCK_STORES: CabinetStore[] = [
  { id: 'store-1', name: 'Elite Cabinets A', domain: 'acab.com', ownerEmail: 'john@acab.com', status: 'active', createdAt: '2023-01-15' },
  { id: 'store-2', name: 'Premium Woodworks', domain: 'bcab.com', ownerEmail: 'jane@bcab.com', status: 'active', createdAt: '2023-03-22' },
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    storeId: 'store-1',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    phone: '555-0123',
    email: 'sarah.j@example.com',
    message: 'Looking for shaker cabinets.',
    source: 'Google Ads',
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-10-05T14:30:00Z',
    status: LeadStatus.QUALIFIED,
  },
  {
    id: 'lead-2',
    storeId: 'store-1',
    firstName: 'Robert',
    lastName: 'Miller',
    phone: '555-0456',
    email: 'robert.m@example.com',
    message: 'Interested in pantry storage.',
    source: 'Website Form',
    createdAt: '2023-10-10T08:15:00Z',
    updatedAt: '2023-10-10T08:15:00Z',
    status: LeadStatus.NEW,
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { 
    id: 'cust-1', 
    storeId: 'store-1', 
    firstName: 'Alice', 
    lastName: 'Cooper', 
    email: 'alice@rock.com', 
    createdAt: '2023-09-20',
    shippingAddress: {
      address1: '123 Rock Ave',
      address2: '',
      city: 'Detroit',
      state: 'MI',
      zip: '48201',
      country: 'US'
    },
    billingDifferent: false,
    notes: 'Preferred customer.'
  }
];

export const MOCK_ORDERS: Order[] = [
  { 
    id: 'ord-1', 
    storeId: 'store-1', 
    customerId: 'cust-1', 
    amount: 4500, 
    status: 'Completed', 
    createdAt: '2023-09-25',
    lineItems: [
      { id: 'li-1', productId: 'inv-1', productName: 'Shaker Cabinet Base', sku: 'CAB-SHK-BS', quantity: 10, price: 450 }
    ],
    taxRate: 8.25,
    isNonTaxable: false,
    notes: 'Standard delivery.',
    expenses: [
      { id: 'exp-inst-1', typeId: 'exp-1', typeName: 'Shipping', amount: 120, note: 'FedEx ground' },
      { id: 'exp-inst-2', typeId: 'exp-2', typeName: 'Labor', amount: 300, note: 'Installers' }
    ]
  }
];

export const MOCK_CLAIMS: Claim[] = [
  { 
    id: 'clm-1', 
    storeId: 'store-1', 
    customerId: 'cust-1', 
    issue: 'Damaged left door panel', 
    status: ClaimStatus.OPEN, 
    createdAt: '2023-10-05',
    notes: 'Customer reported damage upon delivery.'
  }
];

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    storeId: 'store-1',
    name: 'Shaker Base Cabinet',
    sku: 'CAB-SHK-BS',
    price: 450,
    quantity: 70,
    status: 'In Stock',
    trackStock: true,
    description: 'Basic cabinet hardware',
    createdAt: '2023-05-10'
  },
  {
    id: 'inv-2',
    storeId: 'store-1',
    name: 'Premium Hinge Set',
    sku: 'HNG-PRM',
    price: 25,
    quantity: 6,
    status: 'Low Stock',
    trackStock: true,
    description: 'Premium soft-close hinge',
    createdAt: '2023-06-15'
  },
  {
    id: 'inv-3',
    storeId: 'store-1',
    name: 'Custom Oak Panel',
    sku: 'PNL-OAK-CST',
    price: 120,
    quantity: 4,
    status: 'Out of Stock',
    trackStock: true,
    description: 'Solid oak side panel',
    createdAt: '2023-08-22'
  }
];
