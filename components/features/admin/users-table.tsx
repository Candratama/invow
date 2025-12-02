"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserListItem } from "@/lib/db/services/admin-users.service";

interface UsersTableProps {
  users: UserListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
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
 * Get status badge styles
 */
function getStatusBadgeStyles(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "expired":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get tier badge styles
 */
function getTierBadgeStyles(tier: string): string {
  switch (tier) {
    case "premium":
      return "bg-purple-100 text-purple-800";
    case "free":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Loading skeleton for users table
 */
function UsersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Invoices
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Registered
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
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
 * Users table component for admin user management
 * Displays user list with pagination and row click navigation
 */
export function UsersTable({
  users,
  total,
  currentPage,
  pageSize,
  onPageChange,
  isLoading = false,
}: UsersTableProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No users found</p>
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
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Invoices
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleRowClick(user.id)}
                  className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getTierBadgeStyles(user.tier)
                      )}
                    >
                      {user.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getStatusBadgeStyles(user.subscriptionStatus)
                      )}
                    >
                      {user.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {user.currentMonthCount} / {user.invoiceLimit}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({user.invoiceCount} total)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
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
