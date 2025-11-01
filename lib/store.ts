"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Invoice, StoreSettings, InvoiceItem } from "./types";
import { generateInvoiceNumber, generateUUID } from "./utils";

interface InvoiceStore {
  // Current invoice being edited (temporary, not saved to DB until complete)
  currentInvoice: Partial<Invoice> | null;

  // Store settings (loaded from Supabase)
  storeSettings: StoreSettings | null;

  // Completed invoices (loaded from Supabase)
  completedInvoices: Invoice[];

  // User ID for invoice number generation
  userId: string | null;

  // UI state
  isOffline: boolean;

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

  // Clear all data (for logout)
  clearAll: () => void;

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
        // Phase 4: Optimistic update pattern - update UI immediately
        set({ storeSettings: settings });

        if (typeof window !== "undefined") {
          const isOffline = get().isOffline;

          if (isOffline) {
            return {
              success: false,
              error: "Cannot save settings while offline. Please check your connection."
            };
          }

          try {
            // Phase 4: Direct mutation to Supabase (no queue when online)
            // Real-time subscription will confirm the update via Phase 3
            const { SyncService } = await import("./db/sync");
            const { success, error } = await SyncService.syncSettingsToDb(settings);

            if (success) {
              console.log("✅ Settings saved to cloud (direct mutation)");
              return { success: true };
            } else {
              console.error("❌ Failed to save settings:", error);
              return { success: false, error: String(error || "Failed to save settings") };
            }
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to save settings";
            console.error("Failed to save settings:", err);
            return { success: false, error: errorMessage };
          }
        }
        return { success: true };
      },

      saveCompleted: async () => {
        const current = get().currentInvoice;
        const userId = get().userId;
        const isOffline = get().isOffline;

        if (!current) {
          return { success: false, error: "No current invoice to save" };
        }

        if (isOffline) {
          return {
            success: false,
            error: "Cannot save invoice while offline. Please check your connection."
          };
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
          note: current.note || undefined,
          status: "synced",
          createdAt: current.createdAt || new Date(),
          updatedAt: new Date(),
        } as Invoice;

        // Phase 4: Optimistic update - UI updates immediately
        const completed_list = get().completedInvoices.filter(
          (c) => c.id !== completed.id,
        );
        set({ completedInvoices: [...completed_list, completed] });

        if (typeof window !== "undefined") {
          try {
            // Phase 4: Direct mutation to Supabase (no queue when online)
            const { SyncService } = await import("./db/sync");
            const { success, error } = await SyncService.syncInvoiceToDb(completed);

            if (success) {
              console.log("✅ Invoice saved to cloud");
              return { success: true };
            } else {
              console.error("❌ Failed to save invoice:", error);
              return { success: false, error: String(error || "Failed to save invoice") };
            }
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to save invoice";
            console.error("Failed to save invoice:", err);
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
        const isOffline = get().isOffline;

        if (isOffline) {
          return {
            success: false,
            error: "Cannot delete invoice while offline. Please check your connection."
          };
        }

        // Phase 4: Optimistic update - UI updates immediately
        const completed = get().completedInvoices.filter((c) => c.id !== id);
        set({ completedInvoices: completed });

        if (typeof window !== "undefined") {
          try {
            // Phase 4: Direct mutation to Supabase (no queue when online)
            const { SyncService } = await import("./db/sync");
            const { success, error } = await SyncService.deleteInvoiceFromDb(id);

            if (success) {
              console.log("✅ Invoice deleted from cloud");
              return { success: true };
            } else {
              console.error("❌ Failed to delete invoice:", error);
              return { success: false, error: String(error || "Failed to delete invoice") };
            }
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to delete invoice";
            console.error("Failed to delete invoice:", err);
            return { success: false, error: errorMessage };
          }
        }
        return { success: true };
      },

      setCompletedInvoices: (invoices) => {
        set({ completedInvoices: invoices });
      },

      setOfflineStatus: (offline) => set({ isOffline: offline }),

      clearAll: () => {
        set({
          currentInvoice: null,
          storeSettings: null,
          completedInvoices: [],
          userId: null,
        });
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
    {
      name: "invoice-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist storeSettings, not invoices (they load fresh from Supabase)
      partialize: (state) => ({
        storeSettings: state.storeSettings,
      }),
    }
  )
);

// Export with backward compatibility
export const useInvoiceStore = useStore;
