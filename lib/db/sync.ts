/**
 * Sync utilities for syncing local Zustand store with Supabase
 * Handles bidirectional synchronization between localStorage and database
 */

import { settingsService, invoicesService } from "./services";
import { toISOString, toDate } from "./date-utils";
import type { StoreSettings, Invoice } from "@/lib/types";
import type { UserSettings } from "./database.types";

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
 */
export function storeToDbInvoice(
  invoice: Invoice,
): Omit<
  import("./database.types").InvoiceInsert,
  "user_id" | "created_at" | "updated_at" | "synced_at"
> {
  return {
    id: invoice.id,
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
      status: dbInvoice.customer_status || "Customer",
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
  "invoice_id" | "created_at" | "updated_at"
>[] {
  return items.map((item, index) => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    position: index,
  }));
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
    const { data, error } = await settingsService.getSettings();

    if (error) {
      console.error("Failed to sync settings from DB:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return dbToStoreSettings(data);
  }

  /**
   * Sync settings from local store to database
   * @param settings - Settings to sync
   * @returns Success status
   */
  static async syncSettingsToDb(
    settings: StoreSettings,
  ): Promise<{ success: boolean; error: Error | null }> {
    const dbSettings = storeToDbSettings(settings);
    const { data, error } = await settingsService.upsertSettings(dbSettings);

    if (error) {
      console.error("Failed to sync settings to DB:", error);
      return { success: false, error };
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

    // Check if invoice exists
    const { data: existing } = await invoicesService.getInvoiceWithItems(
      invoice.id,
    );

    if (existing) {
      // Update existing invoice with items
      const { data, error } = await invoicesService.updateInvoiceWithItems(
        invoice.id,
        dbInvoice,
        dbItems,
      );

      if (error) {
        console.error("Failed to update invoice in DB:", error);
        return { success: false, error };
      }
    } else {
      // Create new invoice
      const { data: newInvoice, error: createError } =
        await invoicesService.createInvoice(dbInvoice);

      if (createError || !newInvoice) {
        console.error("Failed to create invoice in DB:", createError);
        return { success: false, error: createError };
      }

      // Add items
      if (dbItems.length > 0) {
        const itemsService = await import("./services").then(
          (m) => m.itemsService,
        );
        const { error: itemsError } = await itemsService.replaceItems(
          newInvoice.id,
          dbItems,
        );

        if (itemsError) {
          console.error("Failed to add items to invoice:", itemsError);
          return { success: false, error: itemsError };
        }
      }
    }

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
}
