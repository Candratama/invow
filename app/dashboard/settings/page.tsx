import { Suspense } from "react";
import { getSettingsDataAction } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

async function SettingsContent() {
  // Fetch on server - handle prerender gracefully
  let initialData = null;
  try {
    const result = await getSettingsDataAction();
    initialData = result.success && result.data ? result.data : null;
  } catch {
    // During prerender, cookies() will throw - this is expected
    initialData = null;
  }

  return <SettingsClient initialData={initialData} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
