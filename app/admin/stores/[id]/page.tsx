import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminStoreDetail } from "@/app/actions/admin-stores";
import { StoreDetailCard } from "@/components/features/admin/stores/store-detail-card";
import { StoreBrandingPreview } from "@/components/features/admin/stores/store-branding-preview";
import { StoreContactsList } from "@/components/features/admin/stores/store-contacts-list";
import { StoreActions } from "@/components/features/admin/stores/store-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StoreDetailPageProps {
  params: Promise<{ id: string }>;
}

function StoreDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/stores">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stores
          </Link>
        </Button>
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function StoreDetailData({ storeId }: { storeId: string }) {
  const result = await getAdminStoreDetail(storeId);

  if (!result.success || !result.data) {
    notFound();
  }

  const store = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/stores">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stores
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
      </div>

      <StoreActions
        storeId={store.id}
        storeName={store.name}
        isActive={store.isActive}
      />

      <StoreDetailCard store={store} />

      <div className="grid gap-6 md:grid-cols-2">
        <StoreBrandingPreview store={store} />
        <StoreContactsList contacts={store.contacts} />
      </div>
    </div>
  );
}

export default async function StoreDetailPage({
  params,
}: StoreDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<StoreDetailSkeleton />}>
      <StoreDetailData storeId={id} />
    </Suspense>
  );
}
