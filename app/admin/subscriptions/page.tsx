import { Suspense } from "react";
import { SubscriptionsClient } from "./subscriptions-client";

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionsClient initialData={null} />
    </Suspense>
  );
}
