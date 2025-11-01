"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { User, Settings, LogOut, Store } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { AccountSettingsModal } from "./account-settings-modal";
import { useSync } from "@/hooks/use-sync";
import { useStore } from "@/lib/store";
import { useDataLoader } from "@/hooks/use-data-loader";

interface UserMenuProps {
  onOpenSettings?: () => void;
}

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { syncStatus } = useSync();
  const { isLoading } = useDataLoader();
  const isOffline = useStore((state) => state.isOffline);
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
      setShowMenu(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowMenu(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors relative"
        aria-label="User menu"
      >
        <User size={20} />
        {/* Sync status indicator dot */}
        {!isOffline && (
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              syncStatus.isSyncing || isLoading
                ? "bg-blue-500 animate-pulse"
                : syncStatus.lastError
                ? "bg-red-500"
                : syncStatus.queueCount > 0
                ? "bg-orange-500"
                : "bg-green-500"
            }`}
            title={
              syncStatus.isSyncing
                ? "Syncing..."
                : isLoading
                ? "Loading data..."
                : syncStatus.lastError
                ? "Sync failed"
                : syncStatus.queueCount > 0
                ? `${syncStatus.queueCount} pending`
                : "All synced"
            }
          />
        )}
      </button>

      <BottomSheet
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Account"
      >
        <div className="space-y-4">
          {/* User Info */}
          <div className="pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">Signed in as</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowMenu(false);
                if (onOpenSettings) {
                  onOpenSettings();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <Store size={20} className="text-gray-600" />
              <span>Store Settings</span>
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                setShowAccountSettings(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <Settings size={20} className="text-gray-600" />
              <div className="flex-1 flex items-center justify-between">
                <span>Account Settings</span>
                {syncStatus.queueCount > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {syncStatus.queueCount} pending
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </>
  );
}
