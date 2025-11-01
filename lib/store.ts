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

  // Completed invoices
  completedInvoices: Invoice[];

  // User ID for invoice number generation
  userId: string | null;

  // UI state
  isOffline: boolean;
  pendingSync: number;
  _hasHydrated: boolean;

  // Actions
  setUserId: (userId: string | null) => void;
  setCurrentInvoice: (invoice: Partial<Invoice> | null) => void;
  updateCurrentInvoice: (updates: Partial<Invoice>) => void;
  addInvoiceItem: (item: Omit<InvoiceItem, "id" | "subtotal">) => void;
  updateInvoiceItem: (id: string, updates: Partial<InvoiceItem>) => void;
  removeInvoiceItem: (id: string) => void;

  setStoreSettings: (
    settings: StoreSettings,
  ) => Promise<{ success: boolean; error?: string }>;

  saveCompleted: () => Promise<{ success: boolean; error?: string }>;
  loadCompleted: (id: string) => void;
  deleteCompleted: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
  setCompletedInvoices: (invoices: Invoice[]) => void;

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
      completedInvoices: [],
      userId: null,
      isOffline: false,
      pendingSync: 0,
      _hasHydrated: false,

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

      setStoreSettings: async (settings) => {
        set({ storeSettings: settings });

        // Queue sync if offline or user is authenticated
        if (typeof window !== "undefined") {
          try {
            await syncQueueManager.enqueue({
              action: "upsert",
              entityType: "settings",
              entityId: "user-settings",
              data: settings,
            });
            return { success: true };
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to queue settings sync";
            console.error("Failed to queue settings sync:", err);
            return { success: false, error: errorMessage };
          }
        }
        return { success: true };
      },

      saveCompleted: async () => {
        const current = get().currentInvoice;
        const userId = get().userId;
        if (!current) {
          return { success: false, error: "No current invoice to save" };
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
          try {
            await syncQueueManager.enqueue({
              action: "upsert",
              entityType: "invoice",
              entityId: completed.id,
              data: completed,
            });
            return { success: true };
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to queue completed sync";
            console.error("Failed to queue completed sync:", err);
            return { success: false, error: errorMessage };
          }
        }
        return { success: true };
      },

      loadCompleted: (id) => {
        const completed = get().completedInvoices.find((c) => c.id === id);
        if (completed) {
          set({ currentInvoice: completed });
        }
      },

      deleteCompleted: async (id) => {
        const completed = get().completedInvoices.filter((c) => c.id !== id);
        set({ completedInvoices: completed });

        // Queue deletion sync
        if (typeof window !== "undefined") {
          try {
            await syncQueueManager.enqueue({
              action: "delete",
              entityType: "invoice",
              entityId: id,
              data: null,
            });
            return { success: true };
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to queue completed deletion";
            console.error("Failed to queue completed deletion:", err);
            return { success: false, error: errorMessage };
          }
        }
        return { success: true };
      },

      setCompletedInvoices: (invoices) => {
        set({ completedInvoices: invoices });
      },

      setOfflineStatus: (offline) => set({ isOffline: offline }),
      setPendingSync: (count) => set({ pendingSync: count }),

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
    {
      name: "invoice-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        storeSettings: state.storeSettings,
        completedInvoices: state.completedInvoices,
      }),
      onRehydrateStorage: () => (state) => {
        console.log("🔄 Zustand hydration started");
        if (state) {
          state._hasHydrated = true;
          console.log("✅ Zustand hydrated with:", {
            hasSettings: !!state.storeSettings,
            completedCount: state.completedInvoices.length,
          });
        }
      },
    },
  ),
);

// Export with backward compatibility
export const useInvoiceStore = useStore;
