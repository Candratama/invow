import { Suspense } from "react";
import { InvoicesClient } from "./invoices-client";

export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesClient initialData={null} users={[]} stores={[]} />
    </Suspense>
  );
}
