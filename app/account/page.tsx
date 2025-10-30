"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useStore } from "@/lib/store";
import { useSync } from "@/hooks/use-sync";
import { ArrowLeft, CloudOff, CheckCircle, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const isOffline = useStore((state) => state.isOffline);
  const { syncStatus, triggerSync } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading account..." />;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    if (
      confirm(
        "Are you sure you want to sign out? Your data will remain synced.",
      )
    ) {
      await signOut();
      router.push("/login");
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerSync();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Account Settings
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 lg:px-6 lg:py-8">
        {/* Account Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Account Information</h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Sync Status</h2>
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
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Data Management</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your invoices and settings are automatically synced to the cloud
              and stored locally for offline access.
            </p>
            <div className="pt-2">
              <button
                onClick={handleManualSync}
                disabled={isOffline || syncStatus.isSyncing || isSyncing}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {syncStatus.isSyncing || isSyncing ? "Syncing..." : "Sync Now"}
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
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-red-600">Sign Out</h2>
          <p className="text-sm text-gray-600 mb-4">
            Signing out will keep your data synced but you&apos;ll need to log
            in again to access it.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
