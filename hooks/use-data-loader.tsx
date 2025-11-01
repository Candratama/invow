"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useInvoiceStore } from "@/lib/store";
import { SyncService } from "@/lib/db/sync";
import { hasMigrated } from "@/lib/db/migration-utils";

/**
 * Hook to load data from Supabase after login/migration
 * Automatically loads settings and invoices for authenticated users
 * With retry logic for failed attempts
 */
export function useDataLoader() {
  const { user, loading: authLoading } = useAuth();
  const { setStoreSettings } = useInvoiceStore();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Only load if user is authenticated and we haven't loaded yet
    if (!user || authLoading || loaded) return;

    // Only load if user has migrated (meaning they have cloud data)
    if (!hasMigrated()) return;

    async function loadDataWithRetry(attempt = 0) {
      const maxRetries = 3;
      const retryDelay = 1000 * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s

      setLoading(true);
      setError(null);
      setRetryCount(attempt);

      try {
        // Load settings from Supabase
        const settings = await SyncService.syncSettingsFromDb();
        if (settings) {
          await setStoreSettings(settings);
        }

        // Load completed invoices from Supabase for consistency across devices
        const { success, error } = await SyncService.syncCompletedInvoicesToLocal();
        if (!success) {
          console.warn("Failed to sync completed invoices from DB:", error);
          // Don't fail completely if invoice sync fails, just log warning
        }

        setLoaded(true);
        setRetryCount(0);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to load data");
        console.error(
          `Failed to load data from Supabase (attempt ${attempt + 1}/${maxRetries}):`,
          error,
        );

        if (attempt < maxRetries - 1) {
          // Retry with exponential backoff
          console.log(`Retrying in ${retryDelay}ms...`);
          setTimeout(() => {
            loadDataWithRetry(attempt + 1);
          }, retryDelay);
        } else {
          // Max retries exceeded
          setError(error);
          console.error("Max retries exceeded. Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadDataWithRetry();
  }, [user, authLoading, loaded, setStoreSettings]);

  return { loading, loaded, error, retryCount };
}

/**
 * Hook to sync data periodically while online
 * Auto-syncs settings at regular intervals
 */
export function useAutoDataSync(intervalMinutes: number = 5) {
  const { user } = useAuth();
  const { isOffline, storeSettings } = useInvoiceStore();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Don't sync if offline or not authenticated
    if (!user || isOffline) return;

    // Don't sync if no data to sync
    if (!storeSettings) return;

    const syncData = async () => {
      try {
        // Sync settings if they exist
        if (storeSettings) {
          await SyncService.syncSettingsToDb(storeSettings);
        }

        setLastSync(new Date());
        console.log("✅ Auto-sync completed");
      } catch (error) {
        console.error("Auto-sync failed:", error);
      }
    };

    // Initial sync after 30 seconds
    const initialTimer = setTimeout(syncData, 30000);

    // Periodic sync
    const interval = setInterval(syncData, intervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user, isOffline, storeSettings, intervalMinutes]);

  return { lastSync };
}
