import { Suspense } from "react";
import { CustomersClient } from "./customers-client";

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersClient />
    </Suspense>
  );
}
