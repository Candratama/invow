import { Suspense } from "react";
import { headers } from "next/headers";
import { getSettingsDataAction } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

/**
 * Resolves the right SettingsClient render path:
 * - Internal client navigation (referer matches our host): skip the
 *   server-side fetch entirely and render the client immediately. React
 *   Query already has the settings payload cached in the browser, so a
 *   second round-trip just makes the SettingsSkeleton flash on every visit.
 * - Deep link / hard refresh: fetch on the server so the page hydrates
 *   with real data instead of an empty client shell.
 *
 * Both `headers()` and the optional `getSettingsDataAction()` call live
 * here (inside the Suspense boundary) to satisfy cacheComponents' "no
 * uncached data outside Suspense" rule.
 */
async function SettingsPageBody() {
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
      <SettingsPageBody />
    </Suspense>
  );
}
