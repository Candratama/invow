"use client";

import { create } from "zustand";
import { Invoice, StoreSettings, InvoiceItem } from "./types";
import { generateInvoiceNumber, generateUUID } from "./utils";
import { logger } from "./utils/logger";

interface InvoiceStore {
  // Current invoice being edited
  currentInvoice: Partial<Invoice> | null;

  // Store settings
  storeSettings: StoreSettings | null;

  // Completed invoices
  completedInvoices: Invoice[];

  // User ID for invoice number generation
  userId: string | null;

  
  // Actions
  setUserId: (userId: string | null) => void;
  setCurrentInvoice: (invoice: Partial<Invoice> | null) => void;
  updateCurrentInvoice: (updates: Partial<Invoice>) => void;
  addInvoiceItem: (item: Omit<InvoiceItem, "id" | "subtotal">) => void;
  updateInvoiceItem: (id: string, updates: Partial<InvoiceItem>) => void;
  removeInvoiceItem: (id: string) => void;

  setStoreSettings: (settings: StoreSettings | null) => void;

  saveCompleted: () => void;
  loadCompleted: (id: string) => void;
  deleteCompleted: (id: string) => void;
  setCompletedInvoices: (invoices: Invoice[]) => void;

  // Initialize new invoice
  initializeNewInvoice: () => void;

  // Calculate totals
  calculateTotals: () => void;
}

export const useStore = create<InvoiceStore>()((set, get) => ({
  currentInvoice: null,
  storeSettings: null,
  completedInvoices: [],
  userId: null,

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

      setStoreSettings: (settings) => {
        set({ storeSettings: settings });
      },

      saveCompleted: () => {
        const current = get().currentInvoice;
        const userId = get().userId;
        if (!current) {
          return;
        }

        const completed: Invoice = {
          id: current.id || generateUUID(),
          invoiceNumber: current.invoiceNumber || generateInvoiceNumber(userId || undefined),
          invoiceDate: current.invoiceDate || new Date(),
          dueDate: new Date(), // Keep for backward compatibility
          customer: {
            ...current.customer,
            name: current.customer?.name || "",
            email: current.customer?.email || "",
            status: current.customer?.status || "Customer",
          },
          items: current.items || [],
          subtotal: current.subtotal || 0,
          shippingCost: current.shippingCost || 0,
          total: current.total || 0,
          note: current.note, // Add the note field
          status: "completed",
          createdAt: current.createdAt || new Date(),
          updatedAt: new Date(),
        } as Invoice;

        const completed_list = get().completedInvoices.filter(
          (c) => c.id !== completed.id,
        );
        set({ completedInvoices: [...completed_list, completed] });
      },

      loadCompleted: (id) => {
        const completed = get().completedInvoices.find((c) => c.id === id);
        if (completed) {
          set({ currentInvoice: completed });
        }
      },

      deleteCompleted: (id) => {
        const completed = get().completedInvoices.filter((c) => c.id !== id);
        set({ completedInvoices: completed });
      },

      setCompletedInvoices: (invoices) => {
        set({ completedInvoices: invoices });
      },

      initializeNewInvoice: () => {
        const userId = get().userId;
        const newInvoice: Partial<Invoice> = {
          id: generateUUID(),
          invoiceNumber: generateInvoiceNumber(userId || undefined),
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
    }),
);

// Export with backward compatibility
export const useInvoiceStore = useStore;
