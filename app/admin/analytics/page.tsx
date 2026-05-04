import { Suspense } from "react";
import { AnalyticsClient } from "./analytics-client";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsClient initialData={null} />
    </Suspense>
  );
}
