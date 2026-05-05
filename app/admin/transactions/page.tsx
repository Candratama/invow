import { Suspense } from "react";
import { TransactionsClient } from "./transactions-client";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsClient initialData={null} />
    </Suspense>
  );
}
