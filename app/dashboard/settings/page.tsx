import { Suspense } from "react";
import { getSettingsDataAction } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

async function SettingsPageData() {
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
