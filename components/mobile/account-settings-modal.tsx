"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useStore } from "@/lib/store";
import { useSync } from "@/hooks/use-sync";
import { SyncService } from "@/lib/db/sync";
import { CloudOff, CheckCircle, AlertCircle, X, LogOut, RefreshCw } from "lucide-react";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({
  isOpen,
  onClose,
}: AccountSettingsModalProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isOffline = useStore((state) => state.isOffline);
  const { syncStatus, triggerSync } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen || !user) return null;

  const handleSignOut = async () => {
    if (
      confirm(
        "Are you sure you want to sign out? Your data will remain synced.",
      )
    ) {
      await signOut();
      onClose();
      router.push("/login");
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerSync();

    // Also force sync completed invoices from database
    try {
      const { success, error } = await SyncService.syncCompletedInvoicesToLocal();
      if (success) {
        console.log("✅ Manually synced completed invoices from database");
      } else {
        console.warn("⚠️ Failed to sync completed invoices:", error);
      }
    } catch (error) {
      console.error("Error during manual invoice sync:", error);
    }

    setIsSyncing(false);
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return "Never";
    const date = new Date(syncStatus.lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffMins < 1440)
      return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  value={user.email || ""}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Sync Status */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Sync Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Last Synced</span>
                <span className="font-medium text-gray-900">
                  {formatLastSync()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Pending Changes</span>
                <div className="flex items-center gap-2">
                  {syncStatus.queueCount > 0 ? (
                    <>
                      <AlertCircle size={16} className="text-orange-600" />
                      <span className="font-medium text-orange-600">
                        {syncStatus.queueCount} item
                        {syncStatus.queueCount !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="font-medium text-green-600">
                        All synced
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Connection</span>
                <div className="flex items-center gap-2">
                  {!isOffline ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Online
                      </span>
                    </>
                  ) : (
                    <>
                      <CloudOff size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        Offline
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Data Management</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Your invoices and settings are automatically synced to the
                cloud and stored locally for offline access.
              </p>
              <p className="text-xs text-blue-600 mb-4">
                💡 <strong>Data Sync Issue?</strong> Click the button below to force refresh all data from the cloud and ensure consistency across all devices.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleManualSync}
                  disabled={isOffline || syncStatus.isSyncing || isSyncing}
                  className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} className={(syncStatus.isSyncing || isSyncing) ? "animate-spin" : ""} />
                  {syncStatus.isSyncing || isSyncing
                    ? "Syncing & Refreshing..."
                    : "Sync & Refresh Data"}
                </button>
              </div>
              {isOffline && (
                <p className="text-xs text-orange-600 text-center">
                  Cannot sync while offline
                </p>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
