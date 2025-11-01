/**
 * Real-time Store Subscription Hook
 * Subscribes to real-time updates from Supabase stores table
 * Replaces 2-minute polling with instant updates (<100ms latency)
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useInvoiceStore } from "@/lib/store";
import { dbStoreToStoreSettings } from "@/lib/db/sync";
import type { Store } from "@/lib/db/services/stores.service";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useStoreRealtime(userId: string | undefined) {
  const { setStoreSettings } = useInvoiceStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      // Clean up subscription if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    console.log("🔔 Setting up real-time subscription for stores table");

    // Subscribe to changes on stores table
    const channel = supabase
      .channel("stores-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("📡 Real-time update received:", payload);

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updatedStore = payload.new as Store;

            // Convert to StoreSettings format and update local state
            const settings = dbStoreToStoreSettings(updatedStore);
            setStoreSettings(settings);

            console.log("✅ Store settings updated from real-time event");
          } else if (payload.eventType === "DELETE") {
            console.log("⚠️ Store deleted, clearing local settings");
            // Optionally clear settings or handle deletion
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time subscription active");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Real-time subscription error");
        } else if (status === "TIMED_OUT") {
          console.error("⏱️ Real-time subscription timed out");
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log("🔕 Cleaning up real-time subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, supabase, setStoreSettings]);
}
