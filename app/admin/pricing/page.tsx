import { Suspense } from "react";
import { headers } from "next/headers";
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
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/admin");

  let initialData = null;
  if (!isClientNavigation) {
    const result = await getSubscriptionPlansAction(true);
    initialData = result.success && result.data ? result.data : null;
  }

  return <PricingClient initialData={initialData} />;
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}
