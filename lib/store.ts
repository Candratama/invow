"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Invoice, StoreSettings, InvoiceItem } from "./types";
import { generateInvoiceNumber, generateUUID } from "./utils";
import { syncQueueManager } from "./db/sync-queue";

interface InvoiceStore {
  // Current invoice being edited
  currentInvoice: Partial<Invoice> | null;

  // Store settings
  storeSettings: StoreSettings | null;

  // Draft invoices (offline storage)
  draftInvoices: Invoice[];

  // Completed invoices
  completedInvoices: Invoice[];

  // UI state
  isOffline: boolean;
  pendingSync: number;
  _hasHydrated: boolean;

  // Actions
  setCurrentInvoice: (invoice: Partial<Invoice> | null) => void;
  updateCurrentInvoice: (updates: Partial<Invoice>) => void;
  addInvoiceItem: (item: Omit<InvoiceItem, "id" | "subtotal">) => void;
  updateInvoiceItem: (id: string, updates: Partial<InvoiceItem>) => void;
  removeInvoiceItem: (id: string) => void;

  setStoreSettings: (settings: StoreSettings) => void;

  saveDraft: () => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;

  saveCompleted: () => void;
  loadCompleted: (id: string) => void;
  deleteCompleted: (id: string) => void;

  setOfflineStatus: (offline: boolean) => void;
  setPendingSync: (count: number) => void;

  // Initialize new invoice
  initializeNewInvoice: () => void;

  // Calculate totals
  calculateTotals: () => void;
}

export const useStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      currentInvoice: null,
      storeSettings: null,
      draftInvoices: [],
      completedInvoices: [],
      isOffline: false,
      pendingSync: 0,
      _hasHydrated: false,

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

        // Queue sync if offline or user is authenticated
        if (typeof window !== "undefined") {
          syncQueueManager
            .enqueue({
              action: "upsert",
              entityType: "settings",
              entityId: "user-settings",
              data: settings,
            })
            .catch((err) =>
              console.error("Failed to queue settings sync:", err),
            );
        }
      },

      saveDraft: () => {
        const current = get().currentInvoice;
        if (!current) return;

        const draft: Invoice = {
          id: current.id || generateUUID(),
          invoiceNumber: current.invoiceNumber || generateInvoiceNumber(),
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
          status: "draft",
          createdAt: current.createdAt || new Date(),
          updatedAt: new Date(),
        } as Invoice;

        const drafts = get().draftInvoices.filter((d) => d.id !== draft.id);
        set({ draftInvoices: [...drafts, draft] });

        // Queue sync
        if (typeof window !== "undefined") {
          syncQueueManager
            .enqueue({
              action: "upsert",
              entityType: "invoice",
              entityId: draft.id,
              data: draft,
            })
            .catch((err) => console.error("Failed to queue draft sync:", err));
        }
      },

      loadDraft: (id) => {
        const draft = get().draftInvoices.find((d) => d.id === id);
        if (draft) {
          set({ currentInvoice: draft });
        }
      },

      deleteDraft: (id) => {
        const drafts = get().draftInvoices.filter((d) => d.id !== id);
        set({ draftInvoices: drafts });

        // Queue deletion sync
        if (typeof window !== "undefined") {
          syncQueueManager
            .enqueue({
              action: "delete",
              entityType: "invoice",
              entityId: id,
              data: null,
            })
            .catch((err) =>
              console.error("Failed to queue draft deletion:", err),
            );
        }
      },

      saveCompleted: () => {
        const current = get().currentInvoice;
        if (!current) return;

        const completed: Invoice = {
          id: current.id || generateUUID(),
          invoiceNumber: current.invoiceNumber || generateInvoiceNumber(),
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
          status: "synced",
          createdAt: current.createdAt || new Date(),
          updatedAt: new Date(),
        } as Invoice;

        const completed_list = get().completedInvoices.filter(
          (c) => c.id !== completed.id,
        );
        set({ completedInvoices: [...completed_list, completed] });

        // Queue sync for completed invoice
        if (typeof window !== "undefined") {
          syncQueueManager
            .enqueue({
              action: "upsert",
              entityType: "invoice",
              entityId: completed.id,
              data: completed,
            })
            .catch((err) =>
              console.error("Failed to queue completed sync:", err),
            );
        }
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

        // Queue deletion sync
        if (typeof window !== "undefined") {
          syncQueueManager
            .enqueue({
              action: "delete",
              entityType: "invoice",
              entityId: id,
              data: null,
            })
            .catch((err) =>
              console.error("Failed to queue completed deletion:", err),
            );
        }
      },

      setOfflineStatus: (offline) => set({ isOffline: offline }),
      setPendingSync: (count) => set({ pendingSync: count }),

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
    }),
    {
      name: "invoice-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        storeSettings: state.storeSettings,
        draftInvoices: state.draftInvoices,
        completedInvoices: state.completedInvoices,
      }),
      onRehydrateStorage: () => (state) => {
        console.log("🔄 Zustand hydration started");
        if (state) {
          state._hasHydrated = true;
          console.log("✅ Zustand hydrated with:", {
            hasSettings: !!state.storeSettings,
            draftCount: state.draftInvoices.length,
          });
        }
      },
    },
  ),
);

// Export with backward compatibility
export const useInvoiceStore = useStore;
