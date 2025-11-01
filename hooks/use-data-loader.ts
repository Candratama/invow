"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { SyncService } from "@/lib/db/sync";

interface DataLoaderState {
  isLoading: boolean;
  lastSync: Date | null;
  error: string | null;
}

/**
 * Supabase-only data loader hook
 * Strategy: Load data directly from Supabase on mount and when coming online
 */
export function useDataLoader() {
  const [state, setState] = useState<DataLoaderState>({
    isLoading: false,
    lastSync: null,
    error: null,
  });

  const isOffline = useStore((state) => state.isOffline);
  const setCompletedInvoices = useStore((state) => state.setCompletedInvoices);

  /**
   * Load data from Supabase
   */
  const loadFromSupabase = useCallback(async () => {
    // Don't load if offline
    if (isOffline) {
      console.log("📴 Offline - cannot load data");
      setState((prev) => ({
        ...prev,
        error: "Cannot load data while offline"
      }));
      return;
    }

    console.log("☁️ Loading data from Supabase...");
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch settings and invoices in parallel for speed
      const [settings, invoices] = await Promise.all([
        SyncService.syncSettingsFromDb(),
        SyncService.loadCompletedInvoicesFromDb(),
      ]);

      // Update store with data from Supabase
      // Note: setStoreSettings is async and saves back to Supabase,
      // but we're just loading here, so we update the store state directly
      if (settings) {
        useStore.setState({ storeSettings: settings });
        console.log("✅ Settings loaded from Supabase");
      }

      if (invoices) {
        setCompletedInvoices(invoices);
        console.log(`✅ ${invoices.length} invoices loaded from Supabase`);
      }

      setState({
        isLoading: false,
        lastSync: new Date(),
        error: null,
      });

      console.log("✅ Data load complete");
    } catch (error) {
      console.error("❌ Failed to load data:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      }));
    }
  }, [isOffline, setCompletedInvoices]);

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    // Load data when component mounts
    loadFromSupabase();
  }, [loadFromSupabase]);

  /**
   * Auto-reload when coming back online
   */
  useEffect(() => {
    if (!isOffline) {
      console.log("🌐 Connection restored - loading data from Supabase");
      loadFromSupabase();
    }
  }, [isOffline, loadFromSupabase]);

  return {
    ...state,
    reload: loadFromSupabase,
  };
}
