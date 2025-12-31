"use server";

import { createClient } from "@/lib/supabase/server";
import { getInvoicesPaginatedWithTierLimit, getAllInvoicesWithItems } from "@/lib/db/data-access/invoices";
import { getSubscriptionStatus } from "@/lib/db/data-access/subscription";
import { getStoreSettings } from "@/lib/db/data-access/store";
import { getRevenueMetrics } from "@/lib/db/data-access/revenue";
import { UserPreferencesService } from "@/lib/db/services/user-preferences.service";

export async function getDashboardDataAction(page: number = 1) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const preferencesService = new UserPreferencesService(supabase);

    const [invoicesResult, allInvoicesResult, revenueResult, subscriptionResult, storeResult, preferencesResult] =
      await Promise.all([
        getInvoicesPaginatedWithTierLimit(page, 10, "synced"),
        getAllInvoicesWithItems("synced"), // Fetch all invoices with items for metrics calculation
        getRevenueMetrics(user.id),
        getSubscriptionStatus(user.id),
        getStoreSettings(user.id),
        preferencesService.getUserPreferences(),
      ]);

    const invoices = invoicesResult.data?.invoices || [];
    const allInvoices = allInvoicesResult.data || []; // All invoices with items for metrics
    const revenueMetrics = revenueResult.data || null;
    const hasMoreHistory = invoicesResult.data?.hasMoreHistory || false;
    const historyLimitMessage = invoicesResult.data?.historyLimitMessage;
    const subscriptionStatus = subscriptionResult.data
      ? {
          ...subscriptionResult.data,
          resetDate: subscriptionResult.data.resetDate?.toISOString() ?? null,
        }
      : null;
    const totalPages = invoicesResult.data?.totalPages || 1;

    // Get primary contact, or use first contact if only one exists
    const contacts = storeResult.data?.store_contacts || [];
    const primaryContact =
      contacts.find((contact) => contact.is_primary) ||
      (contacts.length === 1 ? contacts[0] : undefined);

    const storeSettings = storeResult.data
      ? {
          name: storeResult.data.name,
          logo: storeResult.data.logo || "",
          address: storeResult.data.address,
          whatsapp: storeResult.data.whatsapp,
          phone: storeResult.data.phone || undefined,
          email: storeResult.data.email || undefined,
          website: storeResult.data.website || undefined,
          adminName: primaryContact?.name || storeResult.data.name,
          adminTitle: primaryContact?.title || undefined,
          signature: primaryContact?.signature || undefined,
          storeDescription: storeResult.data.store_description || undefined,
          tagline: storeResult.data.tagline || undefined,
          storeNumber: storeResult.data.store_number || undefined,
          paymentMethod: storeResult.data.payment_method || undefined,
          brandColor: storeResult.data.brand_color,
          lastUpdated: storeResult.data.updated_at,
        }
      : null;
    const defaultStore = storeResult.data ? { id: storeResult.data.id } : null;

    // Extract user preferences for invoice settings
    const userPreferences = preferencesResult.data
      ? {
          selectedTemplate: preferencesResult.data.selected_template || "simple",
          taxEnabled: preferencesResult.data.tax_enabled || false,
          taxPercentage: preferencesResult.data.tax_percentage || 0,
        }
      : {
          selectedTemplate: "simple",
          taxEnabled: false,
          taxPercentage: 0,
        };

    return {
      success: true,
      data: {
        invoices,
        allInvoices, // Add all invoices with items for metrics calculation
        revenueMetrics,
        subscriptionStatus,
        storeSettings,
        defaultStore,
        totalPages,
        hasMoreHistory,
        historyLimitMessage,
        userPreferences,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}
