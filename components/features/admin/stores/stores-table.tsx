"use client";

import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, CheckCircle, XCircle } from "lucide-react";
import type { StoreListItem } from "@/lib/db/services/admin-stores.service";

interface StoresTableProps {
  stores: StoreListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRowClick: (store: StoreListItem) => void;
  isLoading?: boolean;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get status badge styles and icon
 */
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

/**
 * Loading skeleton for stores table
 */
function StoresTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
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
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-12" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Stores table component for admin store management
 * Displays store list with pagination and row click for detail view
 */
export function StoresTable({
  stores,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onRowClick,
  isLoading = false,
}: StoresTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return <StoresTableSkeleton />;
  }

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
      <div className="rounded-lg border bg-card">
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
                    onClick={() => onRowClick(store)}
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
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
