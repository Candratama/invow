export function RevenueCardSkeleton() {
  return (
    <div className="mb-8 lg:mb-12">
      {/* Eye toggle button skeleton */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 px-3 py-2 animate-pulse">
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="hidden sm:block h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Cards container */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
        {/* Card 1 - Sales Revenue Skeleton */}
        <div className="min-w-[280px] snap-center">
          <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg p-6 shadow-lg overflow-hidden animate-pulse">
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full -ml-12 -mb-12 opacity-30" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon placeholder */}
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-3" />

              {/* Title placeholder */}
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-2" />

              {/* Amount placeholder */}
              <div className="h-8 w-40 bg-gray-300 dark:bg-gray-600 rounded mt-2 mb-1" />

              {/* Subtitle placeholder */}
              <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded" />

              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-4">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 - Buyback Expenses Skeleton */}
        <div className="min-w-[280px] snap-center">
          <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg p-6 shadow-lg overflow-hidden animate-pulse">
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full -ml-12 -mb-12 opacity-30" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon placeholder */}
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-3" />

              {/* Title placeholder */}
              <div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded mb-2" />

              {/* Amount placeholder */}
              <div className="h-8 w-40 bg-gray-300 dark:bg-gray-600 rounded mt-2 mb-1" />

              {/* Subtitle placeholder */}
              <div className="h-3 w-36 bg-gray-300 dark:bg-gray-600 rounded" />

              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-4">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-28 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 - Net Profit Skeleton */}
        <div className="min-w-[280px] snap-center">
          <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg p-6 shadow-lg overflow-hidden animate-pulse">
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full -ml-12 -mb-12 opacity-30" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon placeholder */}
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded mb-3" />

              {/* Title placeholder */}
              <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded mb-2" />

              {/* Amount placeholder */}
              <div className="h-8 w-40 bg-gray-300 dark:bg-gray-600 rounded mt-2 mb-1" />

              {/* Subtitle placeholder */}
              <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded" />

              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-4">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicators (mobile only) */}
      <div className="flex justify-center gap-2 mt-4 lg:hidden">
        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}
