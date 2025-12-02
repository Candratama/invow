"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { FileText, Clock, CheckCircle, Send } from "lucide-react";
import type { InvoiceListItem } from "@/lib/db/services/admin-invoices.service";

interface InvoicesTableWrapperProps {
  invoices: InvoiceListItem[];
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusInfo(status: string): {
  styles: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "synced":
      return {
        styles: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      };
    case "pending":
      return {
        styles: "bg-yellow-100 text-yellow-800",
        icon: <Send className="h-3 w-3" />,
      };
    case "draft":
      return {
        styles: "bg-gray-100 text-gray-800",
        icon: <FileText className="h-3 w-3" />,
      };
    default:
      return {
        styles: "bg-gray-100 text-gray-800",
        icon: <Clock className="h-3 w-3" />,
      };
  }
}

export function InvoicesTableWrapper({
  invoices,
  total,
  currentPage,
  pageSize,
}: InvoicesTableWrapperProps) {
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
        router.push(`/admin/invoices?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  const handleRowClick = useCallback(
    (invoice: InvoiceListItem) => {
      router.push(`/admin/invoices/${invoice.id}`);
    },
    [router]
  );

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-lg border bg-card",
          isPending && "opacity-60 pointer-events-none"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Store
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const statusInfo = getStatusInfo(invoice.status);
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => handleRowClick(invoice)}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{invoice.customerName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {invoice.userEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {invoice.storeName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">
                        {formatCurrency(invoice.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          statusInfo.styles
                        )}
                      >
                        {statusInfo.icon}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(invoice.invoiceDate)}
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
