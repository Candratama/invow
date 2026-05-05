import { Suspense } from "react";
import { PricingClient } from "./pricing-client";

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingClient initialData={null} />
    </Suspense>
  );
}
