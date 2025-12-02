"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceItemDetail } from "@/lib/db/services/admin-invoices.service";

interface InvoiceItemsTableProps {
  items: InvoiceItemDetail[];
  isLoading?: boolean;
}

/**
 * Format currency to IDR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Loading skeleton for items table
 */
function ItemsTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-24">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-32">
                Price
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-32">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24 ml-auto" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24 ml-auto" />
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
 * Invoice items table component
 */
export function InvoiceItemsTable({
  items,
  isLoading = false,
}: InvoiceItemsTableProps) {
  if (isLoading) {
    return <ItemsTableSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No items in this invoice</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">
          Invoice Items ({items.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-24">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-32">
                Price
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-32">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{item.description}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm">{item.quantity}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm">{formatCurrency(item.price)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium">
                    {formatCurrency(item.subtotal)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Export type for use in other components
export type { InvoiceItemDetail };
