"use server";

import { getCurrentUserId } from "@/lib/auth/server-user";
import { createClient } from "@/lib/supabase/server";
import {
  getInvoicesPaginatedWithTierLimit,
  getAllInvoicesWithItems,
} from "@/lib/db/data-access/invoices";
import { getSubscriptionStatus } from "@/lib/db/data-access/subscription";
import { getStoreSettings } from "@/lib/db/data-access/store";
import { getRevenueMetrics } from "@/lib/db/data-access/revenue";
import { UserPreferencesService } from "@/lib/db/services/user-preferences.service";
import { TierService } from "@/lib/db/services/tier.service";

/**
 * Lightweight dashboard payload — everything required for first paint.
 * Excludes the heavy `allInvoicesWithItems` blob, which is fetched lazily
 * via getDashboardMetricsAction so the dashboard can render without waiting
 * on a potentially multi-megabyte payload.
 */
export async function getDashboardDataAction(page: number = 1) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createClient();
    const preferencesService = new UserPreferencesService(supabase);
    const tierService = new TierService(supabase);

    const [invoicesResult, revenueResult, subscriptionResult, storeResult, preferencesResult, premiumResult] =
      await Promise.all([
        getInvoicesPaginatedWithTierLimit(page, 10, "synced"),
        getRevenueMetrics(userId),
        getSubscriptionStatus(userId),
        getStoreSettings(userId),
        preferencesService.getUserPreferences(),
        tierService.isPremium(userId),
      ]);

    const invoices = invoicesResult.data?.invoices || [];
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

    const isPremium = premiumResult.data ?? false;
    const expiresAt =
      subscriptionResult.data?.tier === "premium" && subscriptionResult.data?.resetDate
        ? subscriptionResult.data.resetDate.toISOString()
        : null;
    const daysUntilExpiry = expiresAt
      ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const premiumStatus = {
      isPremium,
      tier: subscriptionResult.data?.tier ?? "free",
      expiresAt,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7,
    };

    return {
      success: true,
      data: {
        invoices,
        revenueMetrics,
        subscriptionStatus,
        storeSettings,
        defaultStore,
        totalPages,
        hasMoreHistory,
        historyLimitMessage,
        userPreferences,
        premiumStatus,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

/**
 * Heavy aggregation payload — full invoice list with items used for
 * client-side metrics calculation. Loaded lazily after first paint.
 */
export async function getDashboardMetricsAction() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await getAllInvoicesWithItems("synced");
    return {
      success: true,
      data: { allInvoices: result.data || [] },
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return { success: false, error: "Failed to fetch metrics" };
  }
}
