"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap fresh selama 5 menit
            staleTime: 5 * 60 * 1000,
            // Cache disimpan selama 30 menit
            gcTime: 30 * 60 * 1000,
            // Tidak refetch saat window focus (mengurangi request)
            refetchOnWindowFocus: false,
            // Retry 1 kali jika gagal
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
