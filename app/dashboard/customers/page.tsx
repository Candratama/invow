import { CustomersClient } from "./customers-client";

export default function CustomersPage() {
  // Don't fetch on server - let client handle data fetching via React Query
  // This allows instant navigation without waiting for server data
  return <CustomersClient initialStoreId={null} />;
}
