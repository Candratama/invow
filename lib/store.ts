"use client";

import { create } from "zustand";
import { Invoice, InvoiceItem } from "./types";
import { generateInvoiceNumber, generateUUID, parseLocalDate } from "./utils";

interface InvoiceStore {
  // Current invoice being edited (form state)
  currentInvoice: Partial<Invoice> | null;

  // User ID for invoice number generation
  userId: string | null;

  // UI state
  isFormOpen: boolean;

  // Actions
  setUserId: (userId: string | null) => void;
  setCurrentInvoice: (invoice: Partial<Invoice> | null) => void;
  updateCurrentInvoice: (updates: Partial<Invoice>) => void;
  addInvoiceItem: (item: Omit<InvoiceItem, "id" | "subtotal">) => void;
  updateInvoiceItem: (id: string, updates: Partial<InvoiceItem>) => void;
  removeInvoiceItem: (id: string) => void;

  // Initialize new invoice
  initializeNewInvoice: () => void;

  // Calculate totals
  calculateTotals: () => void;

  // UI actions
  setFormOpen: (isOpen: boolean) => void;

  // Backward compatibility methods (for transition period)
  saveCompleted: () => Promise<{ success: boolean; error?: string }>;
  loadCompleted: (invoiceId: string) => Promise<void>;
}

export const useStore = create<InvoiceStore>()((set, get) => ({
  currentInvoice: null,
  userId: null,
  isFormOpen: false,

  setUserId: (userId) => set({ userId }),
  
  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

  updateCurrentInvoice: (updates) => {
    const current = get().currentInvoice;
    if (!current) return;

    const updated = { ...current, ...updates };
    set({ currentInvoice: updated });

    // Auto-calculate totals when items change
    if (updates.items) {
      get().calculateTotals();
    }
  },

  addInvoiceItem: (item) => {
    const current = get().currentInvoice;
    if (!current) return;

    const newItem: InvoiceItem = {
      ...item,
      id: generateUUID(),
      subtotal: item.quantity * item.price,
    };

    const items = [...(current.items || []), newItem];
    get().updateCurrentInvoice({ items });
  },

  updateInvoiceItem: (id, updates) => {
    const current = get().currentInvoice;
    if (!current || !current.items) return;

    const items = current.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.subtotal = updated.quantity * updated.price;
        return updated;
      }
      return item;
    });

    get().updateCurrentInvoice({ items });
  },

  removeInvoiceItem: (id) => {
    const current = get().currentInvoice;
    if (!current || !current.items) return;

    const items = current.items.filter((item) => item.id !== id);
    get().updateCurrentInvoice({ items });
  },

  initializeNewInvoice: () => {
    const newInvoice: Partial<Invoice> = {
      id: generateUUID(),
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate: new Date(), // Keep for backward compatibility
      customer: { name: "", email: "", status: "Customer" },
      items: [],
      subtotal: 0,
      shippingCost: 0,
      total: 0,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set({ currentInvoice: newInvoice });
  },

  calculateTotals: () => {
    const current = get().currentInvoice;
    if (!current || !current.items) return;

    const subtotal = current.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const shippingCost = current.shippingCost || 0;
    const total = subtotal + shippingCost;

    get().updateCurrentInvoice({
      subtotal,
      shippingCost,
      total,
    });
  },

  setFormOpen: (isOpen) => set({ isFormOpen: isOpen }),

  // Backward compatibility methods
  saveCompleted: async () => {
    // This method is kept for backward compatibility during transition
    // The actual saving is now handled by React Query mutations in the components
    // This is a no-op that returns success
    return { success: true };
  },

  loadCompleted: async (invoiceId: string) => {
    // This method is kept for backward compatibility during transition
    // The actual loading is now handled by React Query
    // Load the invoice and set it as current
    const { invoicesService } = await import("./db/services");
    const { data, error } = await invoicesService.getInvoiceWithItems(invoiceId);
    
    if (error || !data) {
      console.error("Failed to load invoice:", error);
      return;
    }

    // Transform database format to app format
    const invoice: Partial<Invoice> = {
      id: data.id,
      invoiceNumber: data.invoice_number,
      invoiceDate: parseLocalDate(data.invoice_date),
      dueDate: parseLocalDate(data.invoice_date),
      customer: {
        name: data.customer_name,
        email: data.customer_email || "",
        status: (data.customer_status as "Distributor" | "Reseller" | "Customer") || "Customer",
        address: data.customer_address || ""
      },
      items: data.invoice_items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      subtotal: data.subtotal,
      shippingCost: data.shipping_cost,
      total: data.total, // Total already includes tax from database
      note: data.note || undefined,
      status: 'completed' as const,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set({ currentInvoice: invoice });
  },
}));

// Export with backward compatibility
export const useInvoiceStore = useStore;
