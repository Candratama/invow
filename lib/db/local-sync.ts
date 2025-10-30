/**
 * Local Storage to Supabase Sync
 * Handles syncing local data when user creates an account
 */

import { useInvoiceStore } from "@/lib/store";
import { settingsService, invoicesService, itemsService } from "./services";
import type { StoreSettings, Invoice } from "@/lib/types";

/**
 * Sync all local data to Supabase for a new user
 * This should be called after successful signup
 */
export async function syncLocalDataToSupabase(): Promise<{
  success: boolean;
  syncedSettings: boolean;
  syncedInvoices: number;
  errors: string[];
}> {
  const results = {
    success: true,
    syncedSettings: false,
    syncedInvoices: 0,
    errors: [] as string[],
  };

  try {
    // Get all local data from Zustand store
    const store = useInvoiceStore.getState();

    // Sync settings first
    if (store.storeSettings) {
      try {
        const { error } = await settingsService.upsertSettings({
          name: store.storeSettings.name,
          logo: store.storeSettings.logo || null,
          address: store.storeSettings.address,
          whatsapp: store.storeSettings.whatsapp,
          admin_name: store.storeSettings.adminName,
          admin_title: store.storeSettings.adminTitle || null,
          signature: store.storeSettings.signature || null,
          store_description: store.storeSettings.storeDescription || null,
          tagline: store.storeSettings.tagline || null,
          store_number: store.storeSettings.storeNumber || null,
          payment_method: store.storeSettings.paymentMethod || null,
          email: store.storeSettings.email || null,
          brand_color: store.storeSettings.brandColor,
        });

        if (error) {
          results.errors.push(`Failed to sync settings: ${error.message}`);
        } else {
          results.syncedSettings = true;
          console.log("✅ Settings synced to Supabase");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Settings sync error: ${errorMessage}`);
      }
    }

    // Sync all invoices (both drafts and completed)
    const allInvoices = [...store.draftInvoices, ...store.completedInvoices];

    for (const invoice of allInvoices) {
      try {
        // Sync invoice to database
        const { SyncService } = await import("./sync");
        const { error } = await SyncService.syncInvoiceToDb(invoice);

        if (error) {
          results.errors.push(
            `Failed to sync invoice ${invoice.invoiceNumber}: ${error.message}`
          );
        } else {
          results.syncedInvoices++;
          console.log(`✅ Invoice ${invoice.invoiceNumber} synced to Supabase`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(
          `Invoice ${invoice.invoiceNumber} sync error: ${errorMessage}`
        );
      }
    }

    // Clear local sync queue since we've synced everything
    try {
      const { syncQueueManager } = await import("./sync-queue");
      await syncQueueManager.clear();
      console.log("✅ Sync queue cleared");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.errors.push(`Failed to clear sync queue: ${errorMessage}`);
    }

    if (results.errors.length > 0) {
      results.success = false;
      console.warn("⚠️ Some sync operations failed:", results.errors);
    } else {
      console.log("🎉 All local data synced successfully to Supabase");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Sync process error: ${errorMessage}`);
    results.success = false;
  }

  return results;
}

/**
 * Check if there's local data to sync
 */
export function hasLocalDataToSync(): boolean {
  const store = useInvoiceStore.getState();
  return !!(
    store.storeSettings ||
    store.draftInvoices.length > 0 ||
    store.completedInvoices.length > 0
  );
}

/**
 * Get summary of local data for syncing
 */
export function getLocalDataSummary(): {
  hasSettings: boolean;
  draftCount: number;
  completedCount: number;
  totalInvoices: number;
} {
  const store = useInvoiceStore.getState();
  return {
    hasSettings: !!store.storeSettings,
    draftCount: store.draftInvoices.length,
    completedCount: store.completedInvoices.length,
    totalInvoices: store.draftInvoices.length + store.completedInvoices.length,
  };
}
