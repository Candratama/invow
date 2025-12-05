"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  users: initialUsers,
  stores: initialStores,
}: InvoicesClientProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [stores, setStores] = useState(initialStores);

  const userId = searchParams.get("userId") || "";
  const storeId = searchParams.get("storeId") || "";
  const status = searchParams.get("status") || "all";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const amountMin = searchParams.get("amountMin") || "";
  const amountMax = searchParams.get("amountMax") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Fetch users and stores list for filters if not provided
  useEffect(() => {
    if (users.length === 0) {
      import("@/app/actions/admin").then(({ getUsers }) => {
        getUsers({ page: 1, pageSize: 1000 }).then((result) => {
          if (result.success && result.data) {
            const usersList = result.data.users.map(
              (u: { id: string; email: string }) => ({
                id: u.id,
                email: u.email,
              })
            );
            setUsers(usersList);
          }
        });
      });
    }
    if (stores.length === 0) {
      import("@/app/actions/admin-stores").then(({ getAdminStores }) => {
        getAdminStores({ page: 1, pageSize: 1000 }).then((result) => {
          if (result.success && result.data) {
            const storesList = result.data.stores.map(
              (s: { id: string; name: string }) => ({
                id: s.id,
                name: s.name,
              })
            );
            setStores(storesList);
          }
        });
      });
    }
  }, [users.length, stores.length]);

  const { data, isLoading, error } = useAdminInvoices(
    {
      userId,
      storeId,
      status,
      dateFrom,
      dateTo,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      search,
      page,
      pageSize: PAGE_SIZE,
    },
    initialData || undefined
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (isLoading && !data)) {
    return <InvoicesPageSkeleton />;
  }

  const invoices = (data?.invoices || []) as InvoiceListItem[];
  const total = data?.total || 0;

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
          userId,
          storeId,
          status: status as "all" | "draft" | "pending" | "synced",
          dateFrom,
          dateTo,
          amountMin,
          amountMax,
          search,
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
        currentPage={page}
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
