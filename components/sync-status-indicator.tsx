"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { syncService } from "@/lib/db/sync-service";
import { Loader2, Cloud, CloudOff, Check } from "lucide-react";

/**
 * SyncStatusIndicator Component
 *
 * Shows a small indicator in the UI to show sync status:
 * - Syncing (spinning cloud icon)
 * - Synced (checkmark)
 * - Offline (cloud off icon)
 * - Pending items (number badge)
 */
export function SyncStatusIndicator() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor sync status
  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      const status = await syncService.getStatus();
      setIsSyncing(status.isSyncing);
      setQueueCount(status.queueCount);
    };

    // Check immediately
    checkStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update last synced when sync completes
  useEffect(() => {
    if (!isSyncing && queueCount === 0 && user) {
      setLastSynced(new Date());
    }
  }, [isSyncing, queueCount, user]);

  // Don't show if user is not logged in
  if (!user) return null;

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <CloudOff size={16} />
        <span>Offline</span>
      </div>
    );
  }

  // Show syncing indicator
  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600">
        <Loader2 size={16} className="animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  // Show pending count
  if (queueCount > 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-orange-600">
        <Cloud size={16} />
        <span>{queueCount} pending</span>
      </div>
    );
  }

  // Show synced status
  if (lastSynced) {
    const timeSince = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
    let timeText = "just now";

    if (timeSince >= 60) {
      const minutes = Math.floor(timeSince / 60);
      timeText = `${minutes}m ago`;
    }

    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Check size={16} />
        <span>Synced {timeText}</span>
      </div>
    );
  }

  return null;
}
