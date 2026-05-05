import { Suspense } from "react";
import { UsersClient } from "./users-client";

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersClient initialData={null} />
    </Suspense>
  );
}
