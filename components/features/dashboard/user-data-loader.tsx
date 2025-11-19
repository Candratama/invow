"use client";

import { useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useInvoiceStore } from "@/lib/store";
import { storesService } from "@/lib/db/services";
import { invoicesService } from "@/lib/db/services";
import type { StoreSettings } from "@/lib/types";
import { logger } from "@/lib/utils/logger";

/**
 * UserDataLoader Component
 *
 * Loads the authenticated user's data from Supabase:
 * - Store settings
 * - Completed invoices
 */
export function UserDataLoader() {
  const { user } = useAuth();
  const {
    setStoreSettings,
    setCompletedInvoices,
    setUserId,
    setLoading
  } = useInvoiceStore();

  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Set loading state
      setLoading(true, true);
      logger.debug("Loading user data:", userId);

      const { data: storeData, error: storeError } = await storesService.getDefaultStore();

      if (storeError) {
        logger.error("Error loading store settings:", storeError);
      } else if (storeData) {
        // Get primary contact for admin info
        const primaryContact = storeData.store_contacts?.find(c => c.is_primary) || storeData.store_contacts?.[0];

        // Convert Store to StoreSettings format
        const storeSettings: StoreSettings = {
          name: storeData.name,
          logo: storeData.logo || "",
          address: storeData.address,
          whatsapp: storeData.whatsapp,
          adminName: primaryContact?.name || storeData.name.split(' ')[0],
          adminTitle: primaryContact?.title || undefined,
          signature: primaryContact?.signature || undefined,
          email: storeData.email || undefined,
          phone: storeData.phone || undefined,
          website: storeData.website || undefined,
          brandColor: storeData.brand_color || "#000000",
          storeDescription: storeData.store_description || undefined,
          tagline: storeData.tagline || undefined,
          storeNumber: storeData.store_number || undefined,
          paymentMethod: storeData.payment_method || undefined,
          lastUpdated: new Date(),
        };

        logger.debug("Store settings loaded:", storeSettings);
        setStoreSettings(storeSettings);
      }

      // Load completed invoices (they're still stored as 'synced' in database)
      const { data: invoicesData, error: invoicesError } = await invoicesService.getInvoices('synced');

      if (invoicesError) {
        logger.error("Error loading invoices:", invoicesError);
      } else if (invoicesData) {
        // Load each invoice with its items
        const formattedInvoices = [];
        for (const invoice of invoicesData) {
          const { data: invoiceWithItems, error: itemsError } = await invoicesService.getInvoiceWithItems(invoice.id);

          if (itemsError) {
            logger.error(`Error loading items for invoice ${invoice.id}:`, itemsError);
            continue;
          }

          if (invoiceWithItems) {
            formattedInvoices.push({
              id: invoice.id,
              invoiceNumber: invoice.invoice_number,
              invoiceDate: new Date(invoice.invoice_date),
              dueDate: new Date(invoice.invoice_date), // Use invoice_date as due_date since it's not in DB
              customer: {
                name: invoice.customer_name,
                email: invoice.customer_email || "",
                status: (invoice.customer_status as "Distributor" | "Reseller" | "Customer") || "Customer",
                address: invoice.customer_address || ""
              },
              items: invoiceWithItems.invoice_items.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              })),
              subtotal: invoice.subtotal,
              shippingCost: invoice.shipping_cost,
              total: invoice.total,
              note: invoice.note || undefined,
              status: invoice.status === 'synced' ? 'completed' : invoice.status as "draft" | "pending" | "completed",
              createdAt: new Date(invoice.created_at),
              updatedAt: new Date(invoice.updated_at),
              syncedAt: invoice.synced_at ? new Date(invoice.synced_at) : undefined
            });
          }
        }

        logger.debug("Completed invoices loaded:", formattedInvoices.length);
        setCompletedInvoices(formattedInvoices);
      }

    } catch (error) {
      logger.error("Error loading user data:", error);
    } finally {
      // Always stop loading, even if there was an error
      setLoading(false, false);
    }
  }, [setStoreSettings, setCompletedInvoices, setLoading]);

  useEffect(() => {
    if (user?.id) {
      // Set user ID for invoice number generation
      setUserId(user.id);

      // Load user data from Supabase
      loadUserData(user.id);
    } else if (user !== undefined) {
      // Only clear data and loading when user explicitly logs out (not during initial auth check)
      // user !== undefined means we've completed the auth check
      setUserId(null);
      setStoreSettings(null);
      setCompletedInvoices([]);
      setLoading(false, false);
    }
  }, [user, setUserId, setStoreSettings, setCompletedInvoices, setLoading, loadUserData]);

  // This component doesn't render anything
  return null;
}