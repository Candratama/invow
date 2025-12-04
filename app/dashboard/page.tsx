import { Suspense } from "react";
import { getDashboardDataAction } from "@/app/actions/dashboard";
import DashboardClient from "./dashboard-client";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

async function DashboardContent() {
  // Fetch on server - handle prerender gracefully
  let initialData = null;
  try {
    const result = await getDashboardDataAction();
    initialData = result.success && result.data ? result.data : null;
  } catch {
    // During prerender, cookies() will throw - this is expected
    initialData = null;
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
