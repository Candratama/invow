"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./bottom-sheet";
import { useSync } from "@/hooks/use-sync";
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";

interface SyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetailedStatus {
  isSyncing: boolean;
  queueCount: number;
  autoSyncEnabled: boolean;
  queueItems?: Array<{
    id: string;
    action: string;
    entityType: string;
    retryCount: number;
    lastError?: string;
  }>;
}

export function SyncDetailsModal({ isOpen, onClose }: SyncDetailsModalProps) {
  const { syncStatus, triggerSync, clearQueue, getDetailedStatus } = useSync();
  const isOffline = useStore((state) => state.isOffline);
  const [detailedStatus, setDetailedStatus] = useState<DetailedStatus | null>(
    null,
  );

  useEffect(() => {
    const loadDetailedStatus = async () => {
      const status = await getDetailedStatus();
      setDetailedStatus(status);
    };

    if (isOpen) {
      loadDetailedStatus();
    }
  }, [isOpen, syncStatus.queueCount, getDetailedStatus]);

  const handleSync = async () => {
    if (!isOffline && !syncStatus.isSyncing) {
      await triggerSync();
    }
  };

  const handleClearQueue = async () => {
    if (
      confirm(
        "Are you sure you want to clear the sync queue? This will remove all pending sync operations.",
      )
    ) {
      await clearQueue();
      const status = await getDetailedStatus();
      setDetailedStatus(status);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Sync Status">
      <div className="space-y-6">
        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOffline ? (
                <div className="p-2 bg-gray-200 rounded-full">
                  <Cloud className="w-5 h-5 text-gray-500" />
                </div>
              ) : syncStatus.isSyncing ? (
                <div className="p-2 bg-blue-100 rounded-full">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : syncStatus.lastError ? (
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              ) : (
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900">
                  {isOffline
                    ? "Offline Mode"
                    : syncStatus.isSyncing
                      ? "Syncing..."
                      : syncStatus.lastError
                        ? "Sync Error"
                        : "All Synced"}
                </h3>
                <p className="text-sm text-gray-500">
                  {isOffline
                    ? "Changes will sync when online"
                    : syncStatus.isSyncing
                      ? "Uploading changes to cloud"
                      : syncStatus.lastError
                        ? syncStatus.lastError
                        : "All data is up to date"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {syncStatus.queueCount}
            </div>
            <div className="text-sm text-gray-500">Pending Operations</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {syncStatus.lastSync
                ? new Date(syncStatus.lastSync).toLocaleTimeString()
                : "Never"}
            </div>
            <div className="text-sm text-gray-500">Last Sync</div>
          </div>
        </div>

        {/* Detailed Queue Items */}
        {detailedStatus &&
          detailedStatus.queueItems &&
          detailedStatus.queueItems.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pending Items</h4>
              <div className="space-y-2">
                {detailedStatus.queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium capitalize">
                          {item.action}
                        </span>{" "}
                        <span className="text-gray-500">{item.entityType}</span>
                      </div>
                      {item.retryCount > 0 && (
                        <span className="text-xs text-orange-600">
                          Retry {item.retryCount}
                        </span>
                      )}
                    </div>
                    {item.lastError && (
                      <div className="text-xs text-red-600 mt-1">
                        {item.lastError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSync}
            disabled={
              isOffline || syncStatus.isSyncing || syncStatus.queueCount === 0
            }
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${syncStatus.isSyncing ? "animate-spin" : ""}`}
            />
            {syncStatus.isSyncing ? "Syncing..." : "Sync Now"}
          </button>

          {syncStatus.queueCount > 0 && !syncStatus.isSyncing && (
            <button
              onClick={handleClearQueue}
              className="w-full py-3 px-4 bg-red-100 text-red-600 rounded-lg font-medium
                hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Queue
            </button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Automatic sync runs every 5 minutes when online</p>
          <p>• Manual sync available via the sync button</p>
          <p>• Failed items retry up to 3 times with increasing delays</p>
        </div>
      </div>
    </BottomSheet>
  );
}
