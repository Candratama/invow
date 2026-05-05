import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the real /dashboard/settings layout:
 *  - Sticky PageHeader (Settings title + back btn)
 *  - Tab navigation row (Subscription / Business / Invoice)
 *  - Active tab content with multiple form sections inside max-w-4xl
 */
export function SettingsSkeleton() {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* PageHeader */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex justify-start gap-1">
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-12 w-28" />
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">
          {/* Section 1: Subscription / Business header card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Section 2: Form fields */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>

          {/* Section 3: Auxiliary */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
