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
  status: "draft" | "pending" | "completed" | "synced";
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface Customer {
  name: string;
  phone?: string; // Optional phone number
  email?: string; // Optional email
  address?: string;
  status?: "Distributor" | "Reseller" | "Customer";
}

export interface InvoiceItem {
  id: string;

  // Common fields
  description: string;

  // Regular invoice fields (optional for buyback items)
  quantity?: number;
  price?: number;
  subtotal?: number;

  // Buyback invoice fields (optional for regular items)
  is_buyback?: boolean;
  gram?: number;
  buyback_rate?: number;
  custom_buyback_rate?: number; // Custom rate for individual items (overrides global rate)
  total?: number; // Auto-calculated: gram × buyback_rate

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StoreSettings {
  name: string;
  logo: string; // base64 compressed (supports PNG transparency)
  address: string;
  whatsapp: string;
  phone?: string; // Optional phone number
  email?: string; // Optional email
  website?: string; // Optional website URL
  adminName: string; // For signature on PDF
  adminTitle?: string; // Optional job title shown under signature
  signature?: string; // Base64 encoded drawn signature
  storeDescription?: string;
  tagline?: string;
  storeNumber?: string;
  paymentMethod?: string;
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

// Export Quality Types
export type ExportQualityValue = 50 | 100 | 150;
export type ExportQualityLabel = 'small' | 'medium' | 'high';

export interface ExportQualityOption {
  label: ExportQualityLabel;
  sizeKB: ExportQualityValue;
  displayName: string;
}

// Export quality constants
export const EXPORT_QUALITY_OPTIONS: ExportQualityOption[] = [
  { label: 'small', sizeKB: 50, displayName: 'Small (~50KB)' },
  { label: 'medium', sizeKB: 100, displayName: 'Medium (~100KB)' },
  { label: 'high', sizeKB: 150, displayName: 'High (~150KB)' },
];

// Tax Calculation Types
export interface TaxCalculation {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}

// Export Options
export interface ExportOptions {
  qualityLimitKB: ExportQualityValue;
}
