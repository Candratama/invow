export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number; // Changed from taxPercentage/taxAmount
  total: number;
  note?: string; // Optional note field
  status: "draft" | "pending" | "synced";
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface Customer {
  name: string;
  email?: string; // Optional, not used in form
  address?: string;
  status?: "Distributor" | "Reseller" | "Customer";
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface StoreSettings {
  name: string;
  logo: string; // base64 compressed (supports PNG transparency)
  address: string;
  whatsapp: string;
  adminName: string; // For signature on PDF
  adminTitle?: string; // Optional job title shown under signature
  signature?: string; // Base64 encoded drawn signature
  storeDescription?: string;
  tagline?: string;
  storeNumber?: string;
  paymentMethod?: string;
  email?: string;
  brandColor: string; // Hex color for app and PDF theming
  lastUpdated: Date | string; // Can be Date or ISO string from localStorage
}

export interface PWAState {
  version: string;
  cachedAssets: string[];
  pendingRequests: PendingRequest[];
  lastSync: Date;
}

export interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body: unknown;
  timestamp: Date;
  retryCount: number;
}
