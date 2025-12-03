import { Suspense } from "react";
import { headers } from "next/headers";
import { getDashboardDataAction } from "@/app/actions/dashboard";
import DashboardClient from "./dashboard-client";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

async function DashboardContent() {
  // Check if this is a client-side navigation (has referer from same origin)
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/dashboard");

  // Skip server fetch for client navigation - React Query will use cached data
  let initialData = null;
  if (!isClientNavigation) {
    const result = await getDashboardDataAction();
    initialData = result.success && result.data ? result.data : null;
  }

  return <DashboardClient initialData={initialData} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
