import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getInvoicesPaginated,
  getAllInvoices,
} from "@/lib/db/data-access/invoices";
import { getSubscriptionStatus } from "@/lib/db/data-access/subscription";
import { getStoreSettings } from "@/lib/db/data-access/store";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard/login");
  }

  // Fetch initial data on the server
  const [invoicesResult, allInvoicesResult, subscriptionResult, storeResult] =
    await Promise.all([
      getInvoicesPaginated(1, 10, "synced"),
      getAllInvoices("synced"),
      getSubscriptionStatus(user.id),
      getStoreSettings(user.id),
    ]);

  const initialInvoices = invoicesResult.data?.invoices || [];
  const initialAllInvoices = allInvoicesResult.data || [];
  const initialSubscriptionStatus = subscriptionResult.data
    ? {
        ...subscriptionResult.data,
        resetDate: subscriptionResult.data.resetDate?.toISOString() ?? null,
      }
    : null;
  const initialTotalPages = invoicesResult.data?.totalPages || 1;
  const initialStoreSettings = storeResult.data
    ? {
        name: storeResult.data.name,
        logo: storeResult.data.logo || "",
        address: storeResult.data.address,
        whatsapp: storeResult.data.whatsapp,
        phone: storeResult.data.phone || undefined,
        email: storeResult.data.email || undefined,
        website: storeResult.data.website || undefined,
        adminName: storeResult.data.name, // Use store name as fallback
        adminTitle: undefined,
        signature: undefined,
        storeDescription: storeResult.data.store_description || undefined,
        tagline: storeResult.data.tagline || undefined,
        storeNumber: storeResult.data.store_number || undefined,
        paymentMethod: storeResult.data.payment_method || undefined,
        brandColor: storeResult.data.brand_color,
        lastUpdated: storeResult.data.updated_at,
      }
    : null;
  const initialDefaultStore = storeResult.data
    ? { id: storeResult.data.id }
    : null;

  return (
    <DashboardClient
      userEmail={user.email || ""}
      initialInvoices={initialInvoices}
      initialAllInvoices={initialAllInvoices}
      initialSubscriptionStatus={initialSubscriptionStatus}
      initialTotalPages={initialTotalPages}
      initialStoreSettings={initialStoreSettings}
      initialDefaultStore={initialDefaultStore}
    />
  );
}
