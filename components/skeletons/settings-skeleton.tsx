export function SettingsSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 space-y-4 sm:space-y-6 lg:py-8">
        <div className="lg:max-w-3xl lg:mx-auto space-y-4 sm:space-y-6">
          {/* Section 1 */}
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>

          {/* Section 2 */}
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>

          {/* Section 3 */}
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Bottom buttons skeleton */}
      <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4 lg:p-6 shadow-lg z-10">
        <div className="flex gap-2 sm:gap-3 lg:max-w-3xl lg:mx-auto animate-pulse">
          <div className="flex-1 h-11 bg-gray-200 rounded"></div>
          <div className="flex-1 h-11 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
