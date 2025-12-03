import { Suspense } from "react";
import { getSettingsPageDataForUser } from "@/lib/db/data-access/settings";
import { SettingsClient } from "./settings-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

export default async function SettingsPage() {
  // Fetch all settings data on the server with unstable_cache
  const { store, contacts, subscription, preferences, isPremium } =
    await getSettingsPageDataForUser();

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsClient
        initialStore={store}
        initialContacts={contacts}
        initialSubscription={subscription}
        initialPreferences={preferences}
        initialIsPremium={isPremium}
      />
    </Suspense>
  );
}
