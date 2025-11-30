import { Suspense } from "react";
import { getAccountPageData } from "@/lib/db/data-access/account";
import { AccountClient } from "./account-client";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";

export default async function AccountPage() {
  // Fetch all account data on the server
  const { store, contacts, subscription, preferences } =
    await getAccountPageData();

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <AccountClient
        initialStore={store}
        initialContacts={contacts}
        initialSubscription={subscription}
        initialPreferences={preferences}
      />
    </Suspense>
  );
}
