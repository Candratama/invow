/**
 * Sync Service
 * Processes sync queue and handles online/offline synchronization
 */

import { syncQueueManager, type SyncQueueItem } from "./sync-queue";
import { storesService, storeContactsService, invoicesService } from "./services";
import type { StoreSettings, Invoice } from "@/lib/types";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 second

export class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Process a single sync queue item
   */
  private async processItem(
    item: SyncQueueItem,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { action, entityType, entityId, data } = item;

      if (entityType === "settings") {
        const settings = data as StoreSettings;
        if (action === "create" || action === "update" || action === "upsert") {
          // Check if default store exists
          const { data: existingStore } =
            await storesService.getDefaultStore();

          if (existingStore) {
            // Update existing store with denormalized admin fields
            const { error: storeError } = await storesService.updateStore(
              existingStore.id,
              {
                name: settings.name,
                logo: settings.logo || null,
                address: settings.address,
                whatsapp: settings.whatsapp,
                admin_name: settings.adminName || null,
                admin_title: settings.adminTitle || null,
                admin_signature: settings.signature || null,
                store_description: settings.storeDescription || null,
                tagline: settings.tagline || null,
                store_number: settings.storeNumber || null,
                payment_method: settings.paymentMethod || null,
                email: settings.email || null,
                brand_color: settings.brandColor,
              },
            );
            if (storeError) throw storeError;

            // Also sync to store_contacts for backward compatibility
            if (settings.adminName) {
              const { data: primaryContact } =
                await storeContactsService.getPrimaryContact(existingStore.id);

              if (primaryContact) {
                // Update existing primary contact
                const { error: contactError } =
                  await storeContactsService.updateContact(primaryContact.id, {
                    name: settings.adminName,
                    title: settings.adminTitle || null,
                    signature: settings.signature || null,
                  });
                if (contactError) {
                  console.warn("Failed to sync to store_contacts:", contactError);
                  // Don't throw, denormalized field is the source of truth
                }
              } else {
                // Create new primary contact for backward compatibility
                const { error: contactError } =
                  await storeContactsService.createContact({
                    store_id: existingStore.id,
                    name: settings.adminName,
                    title: settings.adminTitle || null,
                    signature: settings.signature || null,
                    is_primary: true,
                  });
                if (contactError) {
                  console.warn("Failed to sync to store_contacts:", contactError);
                  // Don't throw, denormalized field is the source of truth
                }
              }
            }
          } else {
            // Create new default store (this handles migration internally)
            const { data: newStore, error: storeError } =
              await storesService.createDefaultStoreFromSettings(settings);
            if (storeError) throw storeError;

            // Create primary contact if store was created and admin info exists
            if (newStore && settings.adminName) {
              const { error: contactError } =
                await storeContactsService.createContact({
                  store_id: newStore.id,
                  name: settings.adminName,
                  title: settings.adminTitle || null,
                  signature: settings.signature || null,
                  is_primary: true,
                });
              if (contactError) throw contactError;
            }
          }
        } else if (action === "delete") {
          // Soft delete the default store
          const { data: existingStore } =
            await storesService.getDefaultStore();
          if (existingStore) {
            const { error } = await storesService.deleteStore(existingStore.id);
            if (error) throw error;
          }
        }
      } else if (entityType === "invoice") {
        const invoice = data as Invoice;
        if (action === "create" || action === "update" || action === "upsert") {
          // Use the sync service to handle the full invoice with items
          const { SyncService: SyncUtil } = await import("./sync");
          const { error } = await SyncUtil.syncInvoiceToDb(invoice);
          if (error) throw error;
        } else if (action === "delete") {
          const { error } = await invoicesService.deleteInvoice(entityId);
          if (error) throw error;
        }
      } else if (entityType === "invoice_item") {
        // Invoice items are handled as part of invoice sync
        // This is here for completeness but typically not used directly
        console.warn(
          "Direct invoice_item sync not implemented, use invoice sync",
        );
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Sync item failed:", item, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process all items in the sync queue
   */
  async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    if (this.isSyncing) {
      console.log("Sync already in progress");
      return { processed: 0, succeeded: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;

    // Check if online (after setting isSyncing to avoid race conditions)
    if (!navigator.onLine) {
      console.log("Offline, skipping sync");
      this.isSyncing = false;
      return { processed: 0, succeeded: 0, failed: 0, errors: ["Offline"] };
    }
    const stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      const items = await syncQueueManager.getAll();
      console.log(`Processing ${items.length} sync items`);

      for (const item of items) {
        stats.processed++;

        // Skip items that have exceeded max retries
        if (item.retryCount >= MAX_RETRIES) {
          console.warn(
            `Item ${item.id} exceeded max retries, removing from queue`,
          );
          if (item.id) {
            await syncQueueManager.remove(item.id);
          }
          stats.failed++;
          stats.errors.push(
            `${item.entityType} ${item.action} failed after ${MAX_RETRIES} retries`,
          );
          continue;
        }

        // Process the item
        const result = await this.processItem(item);

        if (result.success) {
          // Remove from queue on success
          if (item.id) {
            await syncQueueManager.remove(item.id);
          }
          stats.succeeded++;
          console.log(`✅ Synced ${item.entityType} ${item.action}`);
        } else {
          // Update retry count on failure
          if (item.id) {
            await syncQueueManager.updateRetry(
              item.id,
              result.error || "Unknown error",
            );
          }
          stats.failed++;
          stats.errors.push(result.error || "Unknown error");
          console.error(
            `❌ Failed to sync ${item.entityType} ${item.action}:`,
            result.error,
          );

          // Wait before processing next item (exponential backoff)
          const delay = BASE_RETRY_DELAY * Math.pow(2, item.retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      console.log("Sync complete:", stats);
      return stats;
    } catch (error) {
      console.error("Sync queue processing error:", error);
      stats.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      return stats;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start automatic syncing at regular intervals
   */
  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      console.log("Auto-sync already running");
      return;
    }

    console.log(`Starting auto-sync (every ${intervalMinutes} minutes)`);

    // Initial sync after 30 seconds
    setTimeout(() => this.processQueue(), 30000);

    // Periodic sync
    this.syncInterval = setInterval(
      () => this.processQueue(),
      intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("Auto-sync stopped");
    }
  }

  /**
   * Manually trigger sync
   */
  async manualSync(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    console.log("Manual sync triggered");
    return await this.processQueue();
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<{
    isSyncing: boolean;
    queueCount: number;
    autoSyncEnabled: boolean;
  }> {
    const queueCount = await syncQueueManager.getCount();
    return {
      isSyncing: this.isSyncing,
      queueCount,
      autoSyncEnabled: this.syncInterval !== null,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
