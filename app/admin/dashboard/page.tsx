import { Suspense } from "react";
import {
  getAdminDashboardMetrics,
  getAdminRecentTransactions,
} from "@/app/actions/admin";
import { MetricsCard } from "@/components/features/admin/metrics-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CreditCard,
  FileText,
  TrendingUp,
  Crown,
  UserCheck,
} from "lucide-react";

/**
 * Format currency value to IDR
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date to locale string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Dashboard metrics grid component
 */
async function DashboardMetrics() {
  const result = await getAdminDashboardMetrics();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-4 text-destructive">
        <p>Failed to load metrics: {result.error || "Unknown error"}</p>
      </div>
    );
  }

  const metrics = result.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricsCard
        label="Total Users"
        value={metrics.totalUsers}
        description="Registered users in the system"
        icon={<Users className="h-5 w-5" />}
      />
      <MetricsCard
        label="Free Users"
        value={metrics.usersByTier.free}
        description="Users on free tier"
        icon={<UserCheck className="h-5 w-5" />}
      />
      <MetricsCard
        label="Premium Users"
        value={metrics.usersByTier.premium}
        description="Users on premium tier"
        icon={<Crown className="h-5 w-5" />}
      />
      <MetricsCard
        label="Total Revenue"
        value={formatCurrency(metrics.totalRevenue)}
        description="All-time revenue from payments"
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <MetricsCard
        label="Monthly Revenue"
        value={formatCurrency(metrics.monthlyRevenue)}
        description="Revenue this month"
        icon={<CreditCard className="h-5 w-5" />}
      />
      <MetricsCard
        label="Active Subscriptions"
        value={metrics.activeSubscriptions}
        description="Currently active subscriptions"
        icon={<Crown className="h-5 w-5" />}
      />
      <MetricsCard
        label="Total Invoices"
        value={metrics.totalInvoices}
        description="Invoices generated across all users"
        icon={<FileText className="h-5 w-5" />}
        className="md:col-span-2 lg:col-span-1"
      />
    </div>
  );
}

/**
 * Loading skeleton for metrics grid
 */
function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <MetricsCard
          key={i}
          label=""
          value=""
          isLoading
          className={i === 6 ? "md:col-span-2 lg:col-span-1" : ""}
        />
      ))}
    </div>
  );
}

/**
 * Recent transactions table component
 */
async function RecentTransactions() {
  const result = await getAdminRecentTransactions(10);

  if (!result.success) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-4 text-destructive">
        <p>Failed to load transactions: {result.error || "Unknown error"}</p>
      </div>
    );
  }

  const transactions = result.data || [];

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Tier
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
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm">{transaction.userEmail}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-sm capitalize">
                  {transaction.tier}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(transaction.createdAt)}
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
 * Loading skeleton for transactions table
 */
function TransactionsSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Tier
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
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
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
 * Admin Dashboard Page
 * Displays system metrics and recent transactions
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of system metrics and recent activity
        </p>
      </div>

      {/* Metrics Grid */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h2>
        <Suspense fallback={<TransactionsSkeleton />}>
          <RecentTransactions />
        </Suspense>
      </div>
    </div>
  );
}
