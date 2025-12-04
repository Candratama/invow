import DashboardClient from "./dashboard-client";

export default function DashboardPage() {
  // Don't fetch on server - let client handle data fetching via React Query
  // This allows instant navigation without waiting for server data
  return <DashboardClient initialData={null} />;
}
