import { Suspense } from "react";
import { DebugInvoicePreviewClient } from "./debug-client";

export default function DebugInvoicePreviewPage() {
  return (
    <Suspense fallback={null}>
      <DebugInvoicePreviewClient />
    </Suspense>
  );
}
