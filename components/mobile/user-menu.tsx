"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { User, LogOut, Store } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";

interface UserMenuProps {
  onOpenSettings?: () => void;
}

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

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

      </>
  );
}
