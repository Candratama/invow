export function InvoicesListSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm lg:p-8">
      {/* Header */}
      <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />

      {/* Invoice items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="relative border border-gray-200 rounded-lg p-3 animate-pulse"
          >
            <div className="flex items-start justify-between">
              {/* Left side - invoice details */}
              <div className="flex-1 min-w-0 pr-2">
                {/* Invoice number */}
                <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
                {/* Customer name */}
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                {/* Items and date */}
                <div className="h-3 w-40 bg-gray-200 rounded mt-1" />
              </div>

              {/* Right side - icons and amount */}
              <div className="ml-3 flex-shrink-0 flex flex-col items-end gap-2">
                {/* Icons */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                </div>
                {/* Amount */}
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
