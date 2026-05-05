import { Suspense } from "react";
import { StoresClient } from "./stores-client";

export default function StoresPage() {
  return (
    <Suspense fallback={null}>
      <StoresClient initialData={null} users={[]} />
    </Suspense>
  );
}
