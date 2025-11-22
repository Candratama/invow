"use client";

import {
  ClassicInvoiceTemplate,
  SimpleInvoiceTemplate,
  ModernInvoiceTemplate,
  ElegantInvoiceTemplate,
  BoldInvoiceTemplate,
  CompactInvoiceTemplate,
  CreativeInvoiceTemplate,
  CorporateInvoiceTemplate,
} from "@/components/features/invoice/templates";
import { Invoice, StoreSettings } from "@/lib/types";

export default function DebugInvoicePreviewPage() {
  // Mock invoice data for debugging
  const mockInvoice: Invoice = {
    id: "debug-invoice-001",
    invoiceNumber: "INV-211125-88A60EE2-004",
    invoiceDate: new Date("2025-11-21"),
    dueDate: new Date("2025-11-21"),
    customer: {
      name: "Budi Santoso",
      email: "budi@example.com",
      status: "Customer",
      address: "Jl. Merdeka No. 123, Jakarta Pusat",
    },
    items: [
      {
        id: "item-1",
        description: "Silverium Bullion 500gr",
        quantity: 1,
        price: 2100000,
        subtotal: 2100000,
      },
      {
        id: "item-2",
        description: "Gold Bar 100gr",
        quantity: 2,
        price: 8500000,
        subtotal: 17000000,
      },
      {
        id: "item-3",
        description: "Platinum Coin Set",
        quantity: 1,
        price: 5500000,
        subtotal: 5500000,
      },
    ],
    subtotal: 24600000,
    shippingCost: 150000,
    total: 24750000,
    note: "Please transfer to BCA account 1234567890\nThank you for your purchase!",
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock store settings
  const mockStoreSettings: StoreSettings = {
    name: "My Store",
    logo: "/icons/web-app-manifest-192x192.png",
    address: "Store Address Line 1\nStore Address Line 2",
    whatsapp: "+62 812 3456 7890",
    email: "store@example.com",
    brandColor: "#e7b624",
    adminName: "Wahyu Candra Tama",
    adminTitle: "Admin Store",
    signature: "/signature.png",
    paymentMethod: "Bank Transfer - BCA 1234567890",
    tagline: "Your trusted store",
    storeDescription: "Premium products and services",
    storeNumber: "STORE-001",
    lastUpdated: new Date(),
  };

  const templates = [
    { name: "Classic", component: ClassicInvoiceTemplate },
    { name: "Simple", component: SimpleInvoiceTemplate },
    { name: "Modern", component: ModernInvoiceTemplate },
    { name: "Elegant", component: ElegantInvoiceTemplate },
    { name: "Bold", component: BoldInvoiceTemplate },
    { name: "Compact", component: CompactInvoiceTemplate },
    { name: "Creative", component: CreativeInvoiceTemplate },
    { name: "Corporate", component: CorporateInvoiceTemplate },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
            Invoice Templates Gallery
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Preview all {templates.length} available invoice templates
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {templates.map(({ name, component: TemplateComponent }) => (
          <div key={name} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                Template
              </span>
            </div>
            <TemplateComponent
              invoice={mockInvoice}
              storeSettings={mockStoreSettings}
              preview={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
