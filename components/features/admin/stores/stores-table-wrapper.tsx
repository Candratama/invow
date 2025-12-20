"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Store, CheckCircle, XCircle } from "lucide-react";
import type { StoreListItem } from "@/lib/db/services/admin-stores.service";

interface StoresTableWrapperProps {
  stores: StoreListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusInfo(isActive: boolean): {
  styles: string;
  icon: React.ReactNode;
  label: string;
} {
  if (isActive) {
    return {
      styles: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Active",
    };
  }
  return {
    styles: "bg-red-100 text-red-800",
    icon: <XCircle className="h-3 w-3" />,
    label: "Inactive",
  };
}

export function StoresTableWrapper({
  stores,
  total,
  currentPage,
  pageSize,
}: StoresTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`/admin/stores?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  const handleRowClick = useCallback(
    (store: StoreListItem) => {
      router.push(`/admin/stores/${store.id}`);
    },
    [router]
  );

  if (stores.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <Store className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-muted-foreground">No stores found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subtle loading indicator - Requirements: 3.3 */}
      {isPending && (
        <div className="h-1 bg-primary/20 overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-primary animate-pulse" />
        </div>
      )}
      <div
        className={cn(
          "rounded-lg border bg-card transition-opacity",
          isPending && "opacity-80"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Store Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Store Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Invoices
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => {
                const statusInfo = getStatusInfo(store.isActive);
                return (
                  <tr
                    key={store.id}
                    onClick={() => handleRowClick(store)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{store.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-muted-foreground">
                        {store.storeCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {store.userEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusInfo.styles
                        )}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{store.invoiceCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(store.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
