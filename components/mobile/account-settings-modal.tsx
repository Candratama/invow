"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useStore } from "@/lib/store";
import { SyncService } from "@/lib/db/sync";
import { CloudOff, LogOut, RefreshCw } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";

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
  const [isSyncing, setIsSyncing] = useState(false);

  if (!user) return null;

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

  const handleManualRefresh = async () => {
    setIsSyncing(true);

    // Force refresh completed invoices from database
    try {
      const { success, error } = await SyncService.syncCompletedInvoicesToLocal();
      if (success) {
        console.log("✅ Refreshed data from cloud");
      } else {
        console.warn("⚠️ Failed to refresh data:", error);
      }
    } catch (error) {
      console.error("Error during manual refresh:", error);
    }

    setIsSyncing(false);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      fullScreen
      maxWidth="2xl"
    >
      <div className="flex flex-col h-full lg:max-h-[calc(95vh-64px)]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 lg:py-8">
          <div className="lg:max-w-3xl lg:mx-auto space-y-6">
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

            {/* Connection Status */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Connection Status</h3>
              <div className="space-y-3">
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
                {!isOffline && (
                  <p className="text-xs text-gray-600 pt-1">
                    Your data syncs automatically in real-time when online.
                  </p>
                )}
                {isOffline && (
                  <p className="text-xs text-orange-600 pt-1">
                    You&apos;re offline. Please connect to save new data.
                  </p>
                )}
              </div>
            </div>

            {/* Data Management */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Data Management</h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Your invoices and settings are automatically saved to the
                  cloud in real-time when online.
                </p>
                <p className="text-xs text-blue-600 mb-4">
                  💡 <strong>Data Issue?</strong> Click the button below to refresh all data from the cloud.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isOffline || isSyncing}
                    className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "Refreshing..." : "Refresh Data"}
                  </button>
                </div>
                {isOffline && (
                  <p className="text-xs text-orange-600 text-center">
                    Cannot refresh while offline
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 lg:p-6">
          <div className="lg:max-w-3xl lg:mx-auto">
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
    </BottomSheet>
  );
}
