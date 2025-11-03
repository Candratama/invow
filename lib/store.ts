"use client";

import { create } from "zustand";
import { Invoice, StoreSettings, InvoiceItem } from "./types";
import { generateInvoiceNumber, generateUUID } from "./utils";
import { invoicesService, storesService } from "./db/services";

interface InvoiceStore {
  // Current invoice being edited
  currentInvoice: Partial<Invoice> | null;

  // Store settings
  storeSettings: StoreSettings | null;

  // Completed invoices
  completedInvoices: Invoice[];

  // User ID for invoice number generation
  userId: string | null;

  // Loading states
  isLoading: boolean;
  isInitialLoad: boolean;

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
  deleteCompleted: (id: string) => Promise<void>;
  setCompletedInvoices: (invoices: Invoice[]) => void;

  // Initialize new invoice
  initializeNewInvoice: () => void;

  // Calculate totals
  calculateTotals: () => void;

  // Set loading state
  setLoading: (isLoading: boolean, isInitialLoad?: boolean) => void;
}

export const useStore = create<InvoiceStore>()((set, get) => ({
  currentInvoice: null,
  storeSettings: null,
  completedInvoices: [],
  userId: null,
  isLoading: true,
  isInitialLoad: true,

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

      saveCompleted: async () => {
        const current = get().currentInvoice;
        const userId = get().userId;
        if (!current || !userId) {
          return;
        }

        // First, save to memory for immediate UI update
        const completed: Invoice = {
          id: current.id || generateUUID(),
          invoiceNumber: current.invoiceNumber || generateInvoiceNumber(userId),
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
          note: current.note,
          status: "completed",
          createdAt: current.createdAt || new Date(),
          updatedAt: new Date(),
        } as Invoice;

        // Update memory immediately for responsive UI
        const completed_list = get().completedInvoices.filter(
          (c) => c.id !== completed.id,
        );
        set({ completedInvoices: [...completed_list, completed] });

        // Then save to database in background
        try {
          // Get default store
          const { data: defaultStore } = await storesService.getDefaultStore();
          if (!defaultStore) {
            console.error("No default store found for saving invoice");
            return;
          }

          // Prepare invoice data for database
          const invoiceData = {
            id: completed.id,
            store_id: defaultStore.id,
            invoice_number: completed.invoiceNumber,
            invoice_date: completed.invoiceDate.toISOString(),
            customer_name: completed.customer.name,
            customer_email: completed.customer.email || "",
            customer_address: completed.customer.address || "",
            customer_status: completed.customer.status || "Customer",
            subtotal: completed.subtotal,
            shipping_cost: completed.shippingCost,
            total: completed.total,
            note: completed.note || "",
            status: "synced" as const,
          };

          // Prepare items for database
          const itemsData = completed.items.map((item, index) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            position: index,
          }));

          // Save to database
          const { error } = await invoicesService.upsertInvoiceWithItems(
            invoiceData,
            itemsData,
          );

          if (error) {
            console.error("Failed to save invoice to database:", error);
            // Remove from memory if database save failed
            set({
              completedInvoices: get().completedInvoices.filter(
                (c) => c.id !== completed.id,
              ),
            });
          } else {
            console.log("✅ Invoice saved to database successfully");
          }
        } catch (error) {
          console.error("Error saving invoice:", error);
          // Remove from memory if database save failed
          set({
            completedInvoices: get().completedInvoices.filter(
              (c) => c.id !== completed.id,
            ),
          });
        }
      },

      loadCompleted: (id) => {
        const completed = get().completedInvoices.find((c) => c.id === id);
        if (completed) {
          set({ currentInvoice: completed });
        }
      },

      deleteCompleted: async (id) => {
        // Get current invoice data for rollback if needed
        const invoiceToDelete = get().completedInvoices.find((c) => c.id === id);

        // Immediately remove from local state for responsive UI
        const completed = get().completedInvoices.filter((c) => c.id !== id);
        set({ completedInvoices: completed });

        // Then delete from database
        try {
          const { error } = await invoicesService.deleteInvoice(id);

          if (error) {
            console.error("Failed to delete invoice from database:", error);
            // Rollback: add invoice back to local state if database delete failed
            if (invoiceToDelete) {
              set({
                completedInvoices: [...get().completedInvoices, invoiceToDelete],
              });
            }
            alert("Failed to delete invoice. Please try again.");
          } else {
            console.log("✅ Invoice deleted from database successfully");
          }
        } catch (error) {
          console.error("Error deleting invoice:", error);
          // Rollback: add invoice back to local state if database delete failed
          if (invoiceToDelete) {
            set({
              completedInvoices: [...get().completedInvoices, invoiceToDelete],
            });
          }
          alert("Failed to delete invoice. Please try again.");
        }
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

      setLoading: (isLoading, isInitialLoad) => {
        const newState: Partial<InvoiceStore> = { isLoading };
        if (isInitialLoad !== undefined) {
          newState.isInitialLoad = isInitialLoad;
        }
        set(newState);
      },
    }),
);

// Export with backward compatibility
export const useInvoiceStore = useStore;
