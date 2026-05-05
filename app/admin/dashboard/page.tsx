import { Suspense } from "react";
import { AdminDashboardClient } from "./dashboard-client";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardClient initialData={null} />
    </Suspense>
  );
}
