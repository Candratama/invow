import { Suspense } from "react";
import { TemplatesClient } from "./templates-client";
import { Skeleton } from "@/components/ui/skeleton";

function TemplatesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

async function TemplatesContent() {
  return <TemplatesClient />;
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesPageSkeleton />}>
      <TemplatesContent />
    </Suspense>
  );
}
