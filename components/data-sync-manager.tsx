"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useInvoiceStore } from "@/lib/store";
import { syncService } from "@/lib/db/sync-service";
import { SyncService } from "@/lib/db/sync";

/**
 * DataSyncManager Component
 *
 * Automatically handles bidirectional data synchronization:
 * 1. On login: Uploads all local data (settings, invoices) to Supabase
 * 2. On login: Downloads existing data from Supabase
 * 3. While online: Auto-syncs changes every 2 minutes
 * 4. On data change: Queues changes for sync
 *
 * This component should be placed in the root layout to ensure
 * sync works across the entire app.
 */
export function DataSyncManager() {
  const { user, loading: authLoading } = useAuth();
  const { setStoreSettings, storeSettings, completedInvoices } =
    useInvoiceStore();
  const hasInitialSynced = useRef(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial sync when user logs in
  useEffect(() => {
    if (authLoading || !user || hasInitialSynced.current) return;

    async function performInitialSync() {
      console.log("🔄 Starting initial data sync...");

      try {
        // Step 1: Upload all local data to Supabase
        console.log("📤 Uploading local data to Supabase...");

        // Upload settings if they exist locally
        if (storeSettings) {
          console.log("  ↳ Syncing store settings...");
          await SyncService.syncSettingsToDb(storeSettings);
        }

        // Upload all local invoices (only if we have a store)
        if (completedInvoices.length > 0) {
          // Ensure we have a default store before syncing invoices
          const { storesService } = await import("@/lib/db/services");
          const { data: defaultStore } = await storesService.getDefaultStore();

          if (!defaultStore) {
            console.warn("⚠️ No default store found. Skipping invoice sync. Please create a store first.");
            console.log("  ℹ️ You can create a store by updating your settings in the app.");
          } else {
            console.log(`  ↳ Syncing ${completedInvoices.length} invoices...`);
            for (const invoice of completedInvoices) {
              await SyncService.syncInvoiceToDb(invoice);
            }
          }
        }

        console.log("✅ Local data uploaded to Supabase");

        // Step 2: Download data from Supabase
        console.log("📥 Loading data from Supabase...");

        // Load settings from Supabase (this will merge with local)
        const cloudSettings = await SyncService.syncSettingsFromDb();
        if (cloudSettings) {
          console.log("  ↳ Store settings loaded from cloud");
          await setStoreSettings(cloudSettings);
        }

        // Note: Invoices are loaded on-demand in the UI
        // to improve initial load performance

        console.log("✅ Initial sync completed");
        hasInitialSynced.current = true;

        // Step 3: Process any queued sync operations
        await syncService.processQueue();
      } catch (error) {
        console.error("❌ Initial sync failed:", error);
        // Don't mark as synced so it will retry
      }
    }

    performInitialSync();
  }, [
    user,
    authLoading,
    storeSettings,
    completedInvoices,
    setStoreSettings,
  ]);

  // Auto-sync while user is online and authenticated
  useEffect(() => {
    if (!user || authLoading) {
      // Clear interval if user logs out
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    // Don't start auto-sync until initial sync is complete
    if (!hasInitialSynced.current) return;

    // Start the sync service auto-sync
    syncService.startAutoSync(2); // Every 2 minutes

    console.log("🔄 Auto-sync started (every 2 minutes)");

    // Cleanup on unmount or user logout
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      syncService.stopAutoSync();
      console.log("⏸️ Auto-sync stopped");
    };
  }, [user, authLoading]);

  // This component doesn't render anything
  return null;
}
