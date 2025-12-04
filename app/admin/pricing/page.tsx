import { Suspense } from "react";
import { getSubscriptionPlansAction } from "@/app/actions/admin-pricing";
import { PricingClient } from "./pricing-client";
import { Skeleton } from "@/components/ui/skeleton";

function PricingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

async function PricingContent() {
  // Always fetch on server - React Query will cache for subsequent navigations
  const result = await getSubscriptionPlansAction(true);
  const initialData = result.success && result.data ? result.data : null;

  return <PricingClient initialData={initialData} />;
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}
