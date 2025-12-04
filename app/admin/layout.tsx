import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/features/admin/admin-sidebar";
import { AdminHeader } from "@/components/features/admin/admin-header";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function SidebarSkeleton() {
  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border p-4">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <AdminSidebar />
      </Suspense>
      <SidebarInset>
        <Suspense fallback={<Skeleton className="h-14 w-full" />}>
          <AdminHeader />
        </Suspense>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
