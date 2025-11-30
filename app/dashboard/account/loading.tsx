import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

export default function AccountLoading() {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-white border-b z-30 shadow-sm flex-shrink-0">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="bg-white border-b z-20 shadow-sm flex-shrink-0">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8">
          <div className="flex justify-start gap-1">
            <div className="px-4 lg:px-6 py-4 min-h-[48px] flex items-center">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="px-4 lg:px-6 py-4 min-h-[48px] flex items-center">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="px-4 lg:px-6 py-4 min-h-[48px] flex items-center">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content Skeleton */}
      <div className="flex-1 overflow-hidden bg-white">
        <SettingsSkeleton />
      </div>
    </div>
  );
}
