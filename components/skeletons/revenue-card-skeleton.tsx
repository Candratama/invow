export function RevenueCardSkeleton() {
  return (
    <div className="mb-8 lg:mb-12">
      <div className="relative overflow-hidden rounded-xl p-6 text-primary-foreground shadow-lg bg-primary max-w-md mx-auto animate-pulse">
        {/* Card background pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10 bg-primary-foreground" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full opacity-10 bg-primary-foreground" />

        {/* Toggle eye button placeholder */}
        <div className="absolute top-4 right-4 flex justify-center items-center transition-colors z-20">
          <div className="w-4 h-4 bg-primary-foreground/20 rounded" />
        </div>

        {/* Card content */}
        <div className="relative z-10 text-left">
          {/* Revenue icon placeholder */}
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded" />
          </div>

          {/* "This Month" text placeholder */}
          <div className="h-4 w-24 bg-primary-foreground/20 rounded mb-2" />

          {/* Main revenue amount placeholder */}
          <div className="mb-4">
            <div className="h-10 w-40 bg-primary-foreground/20 rounded mb-2" />
            <div className="h-4 w-48 bg-primary-foreground/20 rounded" />
          </div>

          {/* Total revenue section */}
          <div className="border-t border-primary-foreground/20 pt-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-primary-foreground/20 rounded" />
              <div className="h-4 w-32 bg-primary-foreground/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
