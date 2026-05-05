import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placed *inside* the settings chrome (PageHeader + tab nav are
 * already visible). Rendered as the Suspense fallback while a lazy-loaded
 * tab bundle (Subscription / Business / Invoice) is still resolving.
 *
 * Mirrors the typical tab layout: a header/avatar block + 2-3 stacked
 * form sections, all inside the same max-w-4xl container as the real tab
 * content.
 */
export function SettingsTabSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Header / hero card (avatar + title + meta + progress) */}
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

        {/* Form section: 3 fields */}
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

        {/* Form section: 2 fields */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
