/**
 * Sync utilities for syncing local Zustand store with Supabase
 * Handles bidirectional synchronization between localStorage and database
 */

import { settingsService, storesService, invoicesService, storeContactsService } from "./services";
import { toISOString, toDate } from "./date-utils";
import type { StoreSettings, Invoice } from "@/lib/types";
import type { UserSettings } from "./database.types";
import type { Store } from "./services/stores.service";

/**
 * Convert database UserSettings to app StoreSettings format
 */
export function dbToStoreSettings(dbSettings: UserSettings): StoreSettings {
  return {
    name: dbSettings.name,
    logo: dbSettings.logo || "",
    address: dbSettings.address,
    whatsapp: dbSettings.whatsapp,
    adminName: dbSettings.admin_name,
    adminTitle: dbSettings.admin_title || undefined,
    signature: dbSettings.signature || undefined,
    storeDescription: dbSettings.store_description || undefined,
    tagline: dbSettings.tagline || undefined,
    storeNumber: dbSettings.store_number || undefined,
    paymentMethod: dbSettings.payment_method || undefined,
    email: dbSettings.email || undefined,
    brandColor: dbSettings.brand_color,
    lastUpdated: toDate(dbSettings.updated_at),
  };
}

/**
 * Convert app StoreSettings to database UserSettings format
 */
export function storeToDbSettings(
  storeSettings: StoreSettings,
): Omit<
  import("./database.types").UserSettingsInsert,
  "user_id" | "id" | "created_at" | "updated_at"
> {
  return {
    name: storeSettings.name,
    logo: storeSettings.logo || null,
    address: storeSettings.address,
    whatsapp: storeSettings.whatsapp,
    admin_name: storeSettings.adminName,
    admin_title: storeSettings.adminTitle || null,
    signature: storeSettings.signature || null,
    store_description: storeSettings.storeDescription || null,
    tagline: storeSettings.tagline || null,
    store_number: storeSettings.storeNumber || null,
    payment_method: storeSettings.paymentMethod || null,
    email: storeSettings.email || null,
    brand_color: storeSettings.brandColor,
  };
}

/**
 * Convert app Invoice to database format
 * Note: store_id should be added separately by the caller if needed
 */
export function storeToDbInvoice(
  invoice: Invoice,
  storeId?: string,
): Omit<
  import("./database.types").InvoiceInsert,
  "user_id" | "created_at" | "updated_at" | "synced_at"
> {
  return {
    id: invoice.id,
    store_id: storeId || (invoice as { store_id?: string }).store_id || "",
    invoice_number: invoice.invoiceNumber,
    invoice_date: toISOString(invoice.invoiceDate),
    customer_name: invoice.customer.name,
    customer_email: invoice.customer.email || null,
    customer_address: invoice.customer.address || null,
    customer_status: invoice.customer.status || null,
    subtotal: invoice.subtotal,
    shipping_cost: invoice.shippingCost,
    total: invoice.total,
    note: invoice.note || null,
    status: invoice.status as "draft" | "pending" | "synced",
  };
}

/**
 * Convert database invoice to app Invoice format
 */
export function dbToStoreInvoice(
  dbInvoice: import("./database.types").Invoice,
): Invoice {
  return {
    id: dbInvoice.id,
    invoiceNumber: dbInvoice.invoice_number,
    invoiceDate: toDate(dbInvoice.invoice_date),
    dueDate: toDate(dbInvoice.invoice_date), // Keep for backward compatibility
    customer: {
      name: dbInvoice.customer_name,
      email: dbInvoice.customer_email || "",
      address: dbInvoice.customer_address || undefined,
      status: (dbInvoice.customer_status as "Distributor" | "Reseller" | "Customer") || "Customer",
    },
    items: [], // Items need to be fetched separately or joined
    subtotal: Number(dbInvoice.subtotal),
    shippingCost: Number(dbInvoice.shipping_cost),
    total: Number(dbInvoice.total),
    note: dbInvoice.note || undefined,
    status: dbInvoice.status,
    createdAt: toDate(dbInvoice.created_at),
    updatedAt: toDate(dbInvoice.updated_at),
  };
}

/**
 * Convert database invoice items to app format
 */
export function dbToStoreItems(
  dbItems: import("./database.types").InvoiceItem[],
): import("@/lib/types").InvoiceItem[] {
  return dbItems.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    price: Number(item.price),
    subtotal: Number(item.subtotal),
  }));
}

/**
 * Convert app invoice items to database format
 */
export function storeToDbItems(
  items: import("@/lib/types").InvoiceItem[],
): Omit<
  import("./database.types").InvoiceItemInsert,
  "invoice_id" | "id" | "created_at" | "updated_at"
>[] {
  // Sort items by existing position if available, then assign sequential positions
  const sortedItems = [...items].sort((a, b) => {
    // Simple sort by description if no original position is available
    // The actual position will be overridden in the service
    return a.description.localeCompare(b.description);
  });

  return sortedItems.map((item, index) => ({
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    position: index, // Sequential position will be recalculated in service
  }));
}

/**
 * Convert database Store to app StoreSettings format
 * Note: Admin fields (adminName, adminTitle, signature) are now in store_contacts table
 * and need to be fetched separately if needed
 */
export function dbStoreToStoreSettings(dbStore: Store, primaryContact?: { name: string; title?: string | null; signature?: string | null }): StoreSettings {
  return {
    name: dbStore.name,
    logo: dbStore.logo || "",
    address: dbStore.address,
    whatsapp: dbStore.whatsapp,
    adminName: primaryContact?.name || "",
    adminTitle: primaryContact?.title || undefined,
    signature: primaryContact?.signature || undefined,
    storeDescription: dbStore.store_description || undefined,
    tagline: dbStore.tagline || undefined,
    storeNumber: dbStore.store_number || undefined,
    paymentMethod: dbStore.payment_method || undefined,
    email: dbStore.email || undefined,
    brandColor: dbStore.brand_color,
    lastUpdated: toDate(dbStore.updated_at),
  };
}

/**
 * Sync service for managing synchronization operations
 */
export class SyncService {
  /**
   * Sync settings from database to local store
   * @returns Settings or null if not found
   */
  static async syncSettingsFromDb(): Promise<StoreSettings | null> {
    // Get default store
    const { data: storeData, error: storeError } =
      await storesService.getDefaultStore();

    if (storeError) {
      console.error("Failed to sync settings from DB:", storeError);
      return null;
    }

    if (!storeData) {
      console.log("No store found in database");
      return null;
    }

    // Also fetch primary contact for admin fields
    const { data: primaryContact } = await storeContactsService.getPrimaryContact(storeData.id);

    return dbStoreToStoreSettings(storeData, primaryContact ? {
      name: primaryContact.name,
      title: primaryContact.title,
      signature: primaryContact.signature,
    } : undefined);
  }

  /**
   * Sync settings from local store to database
   * @param settings - Settings to sync
   * @returns Success status
   */
  static async syncSettingsToDb(
    settings: StoreSettings,
  ): Promise<{ success: boolean; error: Error | null }> {
    // First, try to get the default store
    let { data: existingStore } = await storesService.getDefaultStore();

    // If no default store, check if user has any stores at all
    if (!existingStore) {
      const { data: allStores } = await storesService.getStores();
      if (allStores && allStores.length > 0) {
        // Use the first store as the existing one to update
        existingStore = allStores[0];
        console.log("No default store found, using first available store");
      }
    }

    if (existingStore) {
      // Update existing store (without admin fields)
      const { error: storeError } = await storesService.updateStore(existingStore.id, {
        name: settings.name,
        logo: settings.logo || null,
        address: settings.address,
        whatsapp: settings.whatsapp,
        store_description: settings.storeDescription || null,
        tagline: settings.tagline || null,
        store_number: settings.storeNumber || null,
        payment_method: settings.paymentMethod || null,
        email: settings.email || null,
        brand_color: settings.brandColor,
      });

      if (storeError) {
        console.error("Failed to sync settings to DB:", storeError);
        return { success: false, error: storeError };
      }

      // Update or create primary contact if admin info exists
      if (settings.adminName) {
        const { data: primaryContact } = await storeContactsService.getPrimaryContact(existingStore.id);

        if (primaryContact) {
          // Update existing primary contact
          const { error: contactError } = await storeContactsService.updateContact(primaryContact.id, {
            name: settings.adminName,
            title: settings.adminTitle || null,
            signature: settings.signature || null,
          });

          if (contactError) {
            console.warn("Failed to update primary contact:", contactError);
            // Don't fail the whole operation, just log warning
          }
        } else {
          // Create new primary contact
          const { error: contactError } = await storeContactsService.createContact({
            store_id: existingStore.id,
            name: settings.adminName,
            title: settings.adminTitle || null,
            signature: settings.signature || null,
            is_primary: true,
          });

          if (contactError) {
            console.warn("Failed to create primary contact:", contactError);
            // Don't fail the whole operation, just log warning
          }
        }
      }
    } else {
      // No stores exist, create new default store
      const { data: newStore, error } =
        await storesService.createDefaultStoreFromSettings(settings);

      if (error) {
        console.error("Failed to create store in DB:", error);
        return { success: false, error };
      }

      // Create primary contact if store was created and admin info exists
      if (newStore && settings.adminName) {
        const { error: contactError } = await storeContactsService.createContact({
          store_id: newStore.id,
          name: settings.adminName,
          title: settings.adminTitle || null,
          signature: settings.signature || null,
          is_primary: true,
        });

        if (contactError) {
          console.warn("Failed to create primary contact:", contactError);
          // Don't fail the whole operation, just log warning
        }
      }
    }

    return { success: true, error: null };
  }

  /**
   * Sync invoices from database to local store
   * @param status - Optional filter by status
   * @returns Array of invoices
   */
  static async syncInvoicesFromDb(
    status?: "draft" | "pending" | "synced",
  ): Promise<Invoice[]> {
    const { data, error } = await invoicesService.getInvoices(status);

    if (error) {
      console.error("Failed to sync invoices from DB:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(dbToStoreInvoice);
  }

  /**
   * Sync a single invoice with items to database
   * @param invoice - Invoice to sync
   * @returns Success status
   */
  static async syncInvoiceToDb(
    invoice: Invoice,
  ): Promise<{ success: boolean; error: Error | null }> {
    const dbInvoice = storeToDbInvoice(invoice);
    const dbItems = storeToDbItems(invoice.items || []);

    // Use upsert to handle both create and update cases
    const { data: upsertedInvoice, error } =
      await invoicesService.upsertInvoiceWithItems(dbInvoice, dbItems);

    if (error || !upsertedInvoice) {
      console.error("Failed to upsert invoice in DB:", error);
      return { success: false, error };
    }

    console.log(`Invoice synced to database successfully`);

    return { success: true, error: null };
  }

  /**
   * Delete invoice from database
   * @param invoiceId - Invoice ID to delete
   * @returns Success status
   */
  static async deleteInvoiceFromDb(
    invoiceId: string,
  ): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await invoicesService.deleteInvoice(invoiceId);

    if (error) {
      console.error("Failed to delete invoice from DB:", error);
      return { success: false, error };
    }

    return { success, error: null };
  }

  /**
   * Load all completed invoices from database
   * @returns Array of completed invoices or null if error
   */
  static async loadCompletedInvoicesFromDb(): Promise<import("@/lib/types").Invoice[] | null> {
    try {
      const { data: dbInvoices, error } = await invoicesService.getInvoices();

      if (error) {
        console.error("Failed to load invoices from DB:", error);
        return null;
      }

      if (!dbInvoices || dbInvoices.length === 0) {
        return [];
      }

      // Transform database invoices to app format
      const completedInvoices = dbInvoices
        .filter(invoice => invoice.status === 'synced') // Only load synced/completed invoices
        .map(dbInvoice => dbToStoreInvoice(dbInvoice));

      console.log(`✅ Loaded ${completedInvoices.length} completed invoices from database`);
      return completedInvoices;
    } catch (error) {
      console.error("Error loading completed invoices from DB:", error);
      return null;
    }
  }

  /**
   * Sync all completed invoices from database to local store
   * @returns Success status
   */
  static async syncCompletedInvoicesToLocal(): Promise<{ success: boolean; error: Error | null }> {
    const completedInvoices = await this.loadCompletedInvoicesFromDb();

    if (completedInvoices === null) {
      return { success: false, error: new Error("Failed to load completed invoices") };
    }

    // Update local store with completed invoices
    if (typeof window !== 'undefined') {
      const { useInvoiceStore } = await import("@/lib/store");
      const { setCompletedInvoices } = useInvoiceStore.getState();
      setCompletedInvoices(completedInvoices);

      console.log(`✅ Synced ${completedInvoices.length} completed invoices to local store`);
    }

    return { success: true, error: null };
  }
}
