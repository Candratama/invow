import { Suspense } from "react";
import { headers } from "next/headers";
import { getSettingsDataAction } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

async function SettingsPageData() {
  // Skip the server-side fetch entirely on internal client navigation —
  // React Query already has the settings payload cached in the browser, so
  // re-fetching on the server only adds a round-trip and forces the
  // SettingsSkeleton fallback to flash on every visit.
  // For deep links / hard refreshes, fetch on the server so the page
  // hydrates with real data instead of an empty client shell.
  const h = await headers();
  const referer = h.get("referer") || "";
  const host = h.get("host") || "";
  const isClientNavigation =
    referer.length > 0 && host.length > 0 && referer.includes(host);

  if (isClientNavigation) {
    return <SettingsClient initialData={null} />;
  }

  const result = await getSettingsDataAction();
  const initialData = result.success && result.data ? result.data : null;
  return <SettingsClient initialData={initialData} />;
}

export default async function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsPageData />
    </Suspense>
  );
}
