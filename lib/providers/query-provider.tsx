"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useEffect, useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Wire localStorage persistence imperatively after mount so SSR and first
  // client render produce identical trees (no hydration mismatch).
  useEffect(() => {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "invow-rq-cache",
      throttleTime: 1000,
    });
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
      buster: process.env.NEXT_PUBLIC_BUILD_ID || "v3-premium-fix",
      dehydrateOptions: {
        // Never persist premium / subscription state — must always reflect
        // current server truth (e.g., right after user upgrades). Same for
        // payment lookup and access-control gates.
        shouldDehydrateQuery: (query) => {
          const key = query.queryKey?.[0];
          if (typeof key !== "string") return true;
          if (key === "premium-status") return false;
          if (key === "subscription") return false;
          return true;
        },
      },
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
