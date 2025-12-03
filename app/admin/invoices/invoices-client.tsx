"use client";

import { InvoiceFilters } from "@/components/features/admin/invoices/invoice-filters";
import { InvoicesTableWrapper } from "@/components/features/admin/invoices/invoices-table-wrapper";
import { useAdminInvoices } from "@/lib/hooks/use-admin-data";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceListItem } from "@/lib/db/services/admin-invoices.service";

const PAGE_SIZE = 10;

interface InvoicesClientProps {
  initialData: {
    invoices: InvoiceListItem[];
    total: number;
  } | null;
  filters: {
    userId: string;
    storeId: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    amountMin: string;
    amountMax: string;
    search: string;
    page: number;
  };
  users: Array<{ id: string; email: string }>;
  stores: Array<{ id: string; name: string }>;
}

function InvoicesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function InvoicesClient({
  initialData,
  filters,
  users,
  stores,
}: InvoicesClientProps) {
  const { data, isLoading, error } = useAdminInvoices(
    {
      userId: filters.userId,
      storeId: filters.storeId,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      amountMin: filters.amountMin ? parseFloat(filters.amountMin) : undefined,
      amountMax: filters.amountMax ? parseFloat(filters.amountMax) : undefined,
      search: filters.search,
      page: filters.page,
      pageSize: PAGE_SIZE,
    },
    initialData || undefined
  );

  const invoices = (data?.invoices || []) as InvoiceListItem[];
  const total = data?.total || 0;

  if (isLoading && !initialData) {
    return <InvoicesPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all invoices from all users
        </p>
      </div>

      <InvoiceFilters
        initialFilters={{
          userId: filters.userId,
          storeId: filters.storeId,
          status: (filters.status || "all") as
            | "all"
            | "draft"
            | "pending"
            | "synced",
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          amountMin: filters.amountMin,
          amountMax: filters.amountMax,
          search: filters.search,
        }}
        users={users}
        stores={stores}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : "Failed to load invoices"}
          </p>
        </div>
      )}

      <InvoicesTableWrapper
        invoices={invoices}
        total={total}
        currentPage={filters.page}
        pageSize={PAGE_SIZE}
      />

      {!error && (
        <div className="text-sm text-muted-foreground">
          Showing {invoices.length} of {total} invoices
        </div>
      )}
    </div>
  );
}
