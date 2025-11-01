/**
 * Real-time Invoices Subscription Hook
 * Subscribes to real-time updates from Supabase invoices table
 * Provides instant updates (<100ms latency) across devices
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useInvoiceStore } from "@/lib/store";
import { dbToStoreInvoice } from "@/lib/db/sync";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface DbInvoice {
  id: string;
  user_id: string;
  store_id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_email: string | null;
  customer_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useInvoicesRealtime(userId: string | undefined) {
  const { setCompletedInvoices, completedInvoices } = useInvoiceStore();
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

    console.log("🔔 Setting up real-time subscription for invoices table");

    // Subscribe to changes on invoices table
    const channel = supabase
      .channel("invoices-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "invoices",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("📡 Real-time invoice update received:", payload.eventType);

          if (payload.eventType === "INSERT") {
            // New invoice created - add to list
            const newDbInvoice = payload.new as DbInvoice;

            // Fetch invoice with items
            const { data: invoiceWithItems } = await supabase
              .from("invoices")
              .select(`
                *,
                invoice_items (*)
              `)
              .eq("id", newDbInvoice.id)
              .single();

            if (invoiceWithItems) {
              const newInvoice = dbToStoreInvoice(invoiceWithItems);
              const updatedInvoices = [...completedInvoices, newInvoice];
              setCompletedInvoices(updatedInvoices);
              console.log("✅ New invoice added via real-time");
            }
          } else if (payload.eventType === "UPDATE") {
            // Invoice updated - replace in list
            const updatedDbInvoice = payload.new as DbInvoice;

            // Fetch invoice with items
            const { data: invoiceWithItems } = await supabase
              .from("invoices")
              .select(`
                *,
                invoice_items (*)
              `)
              .eq("id", updatedDbInvoice.id)
              .single();

            if (invoiceWithItems) {
              const updatedInvoice = dbToStoreInvoice(invoiceWithItems);
              const updatedInvoices = completedInvoices.map((inv) =>
                inv.id === updatedInvoice.id ? updatedInvoice : inv
              );
              setCompletedInvoices(updatedInvoices);
              console.log("✅ Invoice updated via real-time");
            }
          } else if (payload.eventType === "DELETE") {
            // Invoice deleted - remove from list
            const deletedInvoice = payload.old as DbInvoice;
            const updatedInvoices = completedInvoices.filter(
              (inv) => inv.id !== deletedInvoice.id
            );
            setCompletedInvoices(updatedInvoices);
            console.log("✅ Invoice deleted via real-time");
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Real-time invoices subscription active");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Real-time invoices subscription error");
        } else if (status === "TIMED_OUT") {
          console.error("⏱️ Real-time invoices subscription timed out");
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log("🔕 Cleaning up real-time invoices subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, supabase, setCompletedInvoices, completedInvoices]);
}
