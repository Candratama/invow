import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  // Don't fetch on server - let client handle data fetching via React Query
  // This allows instant navigation without waiting for server data
  return <SettingsClient initialData={null} />;
}
