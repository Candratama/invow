export function CustomersSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="flex-shrink-0 px-4 py-3 lg:px-6 border-b bg-gray-50">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Customer list skeleton */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 shadow-sm animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
