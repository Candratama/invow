"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSubscriptions } from "@/app/actions/admin";
import {
  SubscriptionFilters,
  type SubscriptionFiltersState,
} from "@/components/features/admin/filters/subscription-filters";
import { SubscriptionsTable } from "@/components/features/admin/subscriptions-table";
import type { SubscriptionListItem } from "@/lib/db/services/admin-subscriptions.service";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

function SubscriptionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<SubscriptionFiltersState>({
    tier:
      (searchParams.get("tier") as SubscriptionFiltersState["tier"]) || "all",
    status:
      (searchParams.get("status") as SubscriptionFiltersState["status"]) ||
      "all",
  });
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>(
    []
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: SubscriptionFiltersState, page: number) => {
      const params = new URLSearchParams();
      if (newFilters.tier !== "all") params.set("tier", newFilters.tier);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (page > 1) params.set("page", page.toString());

      const queryString = params.toString();
      router.push(
        `/admin/subscriptions${queryString ? `?${queryString}` : ""}`,
        {
          scroll: false,
        }
      );
    },
    [router]
  );

  // Fetch subscriptions data
  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSubscriptions({
        tier: filters.tier === "all" ? undefined : filters.tier,
        status: filters.status === "all" ? undefined : filters.status,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      if (!result.success || !result.data) {
        setError(result.error || "Failed to fetch subscriptions");
        setSubscriptions([]);
        setTotal(0);
      } else {
        setSubscriptions(result.data.subscriptions);
        setTotal(result.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubscriptions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // Fetch subscriptions when filters or page changes
  useEffect(() => {
    startTransition(() => {
      fetchSubscriptions();
    });
  }, [fetchSubscriptions]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: SubscriptionFiltersState) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page on filter change
      updateUrl(newFilters, 1);
    },
    [updateUrl]
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updateUrl(filters, page);
    },
    [filters, updateUrl]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all user subscriptions
        </p>
      </div>

      {/* Filters */}
      <SubscriptionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Subscriptions Table */}
      <SubscriptionsTable
        subscriptions={subscriptions}
        total={total}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
        isLoading={isLoading || isPending}
      />

      {/* Results Summary */}
      {!isLoading && !error && (
        <div className="text-sm text-muted-foreground">
          Showing {subscriptions.length} of {total} subscriptions
        </div>
      )}
    </div>
  );
}

function SubscriptionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<SubscriptionsPageSkeleton />}>
      <SubscriptionsPageContent />
    </Suspense>
  );
}
