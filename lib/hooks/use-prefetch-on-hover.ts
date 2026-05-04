"use client";

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface PrefetchOnHoverOptions<TData> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  staleTime?: number;
}

/**
 * Returns hover/focus handlers that prefetch a React Query so the data is
 * already in cache by the time the user taps the link.
 *
 * Idle prefetch is debounced — first hover triggers, repeated hovers in a
 * tight window are no-ops to avoid network spam.
 */
export function usePrefetchOnHover<TData>({
  queryKey,
  queryFn,
  staleTime = 5 * 60 * 1000,
}: PrefetchOnHoverOptions<TData>) {
  const queryClient = useQueryClient();
  const lastFiredRef = useRef(0);

  const prefetch = useCallback(() => {
    const now = Date.now();
    // Debounce: at most once per 1s for the same target
    if (now - lastFiredRef.current < 1000) return;
    lastFiredRef.current = now;

    void queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    });
  }, [queryClient, queryKey, queryFn, staleTime]);

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
    onTouchStart: prefetch,
  };
}
