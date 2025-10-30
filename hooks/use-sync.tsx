"use client";

import { useEffect, useState, useCallback } from "react";
import { syncService } from "@/lib/db/sync-service";
import { syncQueueManager } from "@/lib/db/sync-queue";
import { useStore } from "@/lib/store";

export interface SyncStatus {
  isSyncing: boolean;
  queueCount: number;
  lastSync: Date | null;
  lastError: string | null;
}

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    queueCount: 0,
    lastSync: null,
    lastError: null,
  });

  const isOffline = useStore((state) => state.isOffline);

  // Update queue count
  const updateQueueCount = useCallback(async () => {
    try {
      const count = await syncQueueManager.getCount();
      setSyncStatus((prev) => ({ ...prev, queueCount: count }));
    } catch (error) {
      console.error("Failed to get queue count:", error);
    }
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (isOffline) {
      console.log("Cannot sync while offline");
      return { success: false, error: "Offline" };
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }));

      const result = await syncService.manualSync();

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        lastError: result.errors.length > 0 ? result.errors.join(", ") : null,
      }));

      await updateQueueCount();

      return { success: result.succeeded > 0, result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [isOffline, updateQueueCount]);

  // Clear sync queue
  const clearQueue = useCallback(async () => {
    try {
      await syncQueueManager.clear();
      await updateQueueCount();
      return { success: true };
    } catch (error) {
      console.error("Failed to clear queue:", error);
      return { success: false, error };
    }
  }, [updateQueueCount]);

  // Get detailed sync status
  const getDetailedStatus = useCallback(async () => {
    try {
      const serviceStatus = await syncService.getStatus();
      return serviceStatus;
    } catch (error) {
      console.error("Failed to get sync status:", error);
      return null;
    }
  }, []);

  // Initialize sync service and update queue count
  useEffect(() => {
    // Start auto-sync service
    syncService.startAutoSync();

    // Initial queue count
    updateQueueCount();

    // Update queue count every 30 seconds
    const interval = setInterval(updateQueueCount, 30000);

    return () => {
      clearInterval(interval);
      syncService.stopAutoSync();
    };
  }, [updateQueueCount]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (!isOffline && syncStatus.queueCount > 0) {
      console.log("Back online, triggering sync...");
      triggerSync();
    }
  }, [isOffline, syncStatus.queueCount, triggerSync]);

  return {
    syncStatus,
    triggerSync,
    clearQueue,
    getDetailedStatus,
    updateQueueCount,
  };
}
