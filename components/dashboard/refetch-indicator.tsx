/**
 * Subtle top-bar pulse shown when React Query is silently refetching cached data.
 * Render conditionally: `{isBackgroundRefetching && <RefetchIndicator />}`.
 */
export function RefetchIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-primary/20 overflow-hidden pointer-events-none">
      <div
        className="h-full w-1/3 bg-primary animate-pulse"
        style={{ animation: "pulse 1.5s ease-in-out infinite" }}
      />
    </div>
  );
}
