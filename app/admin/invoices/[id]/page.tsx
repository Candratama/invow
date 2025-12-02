import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminInvoiceDetail } from "@/app/actions/admin-invoices";
import { InvoiceDetailCard } from "@/components/features/admin/invoices/invoice-detail-card";
import { InvoiceItemsTable } from "@/components/features/admin/invoices/invoice-items-table";
import { InvoiceActions } from "@/components/features/admin/invoices/invoice-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/invoices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Link>
        </Button>
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
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
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function InvoiceDetailData({ invoiceId }: { invoiceId: string }) {
  const result = await getAdminInvoiceDetail(invoiceId);

  if (!result.success || !result.data) {
    notFound();
  }

  const invoice = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/invoices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Invoice {invoice.invoiceNumber}
        </h1>
      </div>

      <InvoiceActions
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        currentStatus={invoice.status}
      />

      <InvoiceDetailCard invoice={invoice} />

      <InvoiceItemsTable items={invoice.items} />
    </div>
  );
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<InvoiceDetailSkeleton />}>
      <InvoiceDetailData invoiceId={id} />
    </Suspense>
  );
}
