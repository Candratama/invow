"use client";

import { useSync } from "@/hooks/use-sync";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";

export function SyncStatus() {
  const { syncStatus, triggerSync } = useSync();
  const isOffline = useStore((state) => state.isOffline);

  const handleSync = async () => {
    if (!isOffline && !syncStatus.isSyncing) {
      await triggerSync();
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isOffline || syncStatus.isSyncing}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:cursor-not-allowed"
      aria-label={
        isOffline
          ? "Offline"
          : syncStatus.isSyncing
            ? "Syncing..."
            : syncStatus.lastError
              ? "Sync Failed"
              : syncStatus.queueCount > 0
                ? `${syncStatus.queueCount} pending`
                : "Synced"
      }
      title={
        isOffline
          ? "Offline"
          : syncStatus.isSyncing
            ? "Syncing..."
            : syncStatus.lastError
              ? "Sync Failed - Click to retry"
              : syncStatus.queueCount > 0
                ? `${syncStatus.queueCount} pending - Click to sync`
                : "All synced"
      }
    >
      {isOffline ? (
        <CloudOff className="w-5 h-5 text-gray-400" />
      ) : syncStatus.isSyncing ? (
        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      ) : syncStatus.lastError ? (
        <AlertCircle className="w-5 h-5 text-red-500" />
      ) : syncStatus.queueCount > 0 ? (
        <Cloud className="w-5 h-5 text-orange-500" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      )}
    </button>
  );
}
