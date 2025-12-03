import { Suspense } from "react";
import { headers } from "next/headers";
import { getSettingsDataAction } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

export default async function SettingsPage() {
  // Check if this is a client-side navigation
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/dashboard");

  // Skip server fetch for client navigation - React Query will use cached data
  let initialData = null;
  if (!isClientNavigation) {
    const result = await getSettingsDataAction();
    initialData = result.success && result.data ? result.data : null;
  }

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsClient initialData={initialData} />
    </Suspense>
  );
}
