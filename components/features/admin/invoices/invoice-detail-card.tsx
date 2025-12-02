"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Clock,
  CheckCircle,
  Send,
  User,
  Store,
  Calendar,
  Mail,
  MapPin,
} from "lucide-react";
import type { InvoiceDetail } from "@/lib/db/services/admin-invoices.service";

interface InvoiceDetailCardProps {
  invoice: InvoiceDetail;
  isLoading?: boolean;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format currency to IDR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get status badge styles and icon
 */
function getStatusInfo(status: string): {
  styles: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "synced":
      return {
        styles: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      };
    case "pending":
      return {
        styles: "bg-yellow-100 text-yellow-800",
        icon: <Send className="h-3 w-3" />,
      };
    case "draft":
      return {
        styles: "bg-gray-100 text-gray-800",
        icon: <FileText className="h-3 w-3" />,
      };
    default:
      return {
        styles: "bg-gray-100 text-gray-800",
        icon: <Clock className="h-3 w-3" />,
      };
  }
}

/**
 * Loading skeleton for invoice detail card
 */
function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Invoice header section
 */
function InvoiceHeaderSection({ invoice }: { invoice: InvoiceDetail }) {
  const statusInfo = getStatusInfo(invoice.status);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <p className="font-medium">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize mt-1",
              statusInfo.styles
            )}
          >
            {statusInfo.icon}
            {invoice.status}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Invoice Date</p>
          <p className="font-medium flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">User</p>
          <p className="font-medium flex items-center gap-1">
            <User className="h-4 w-4 text-muted-foreground" />
            {invoice.userEmail}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Store</p>
          <p className="font-medium flex items-center gap-1">
            <Store className="h-4 w-4 text-muted-foreground" />
            {invoice.storeName}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Invoice ID</p>
          <p className="font-mono text-xs text-muted-foreground">
            {invoice.id}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Customer info section
 */
function CustomerInfoSection({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium">{invoice.customerName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium flex items-center gap-1">
            {invoice.customerEmail ? (
              <>
                <Mail className="h-4 w-4 text-muted-foreground" />
                {invoice.customerEmail}
              </>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Address</p>
          <p className="font-medium flex items-start gap-1">
            {invoice.customerAddress ? (
              <>
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                {invoice.customerAddress}
              </>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </p>
        </div>
        {invoice.customerStatus && (
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{invoice.customerStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Totals section
 */
function TotalsSection({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Totals</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            {formatCurrency(invoice.subtotal)}
          </span>
        </div>
        {invoice.taxAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">
              {formatCurrency(invoice.taxAmount)}
            </span>
          </div>
        )}
        {invoice.shippingCost > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {formatCurrency(invoice.shippingCost)}
            </span>
          </div>
        )}
        <div className="border-t pt-3 flex justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-semibold text-lg">
            {formatCurrency(invoice.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Timestamps section
 */
function TimestampsSection({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Created At</p>
          <p className="font-medium">{formatDate(invoice.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Updated At</p>
          <p className="font-medium">{formatDate(invoice.updatedAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Synced At</p>
          <p className="font-medium">{formatDate(invoice.syncedAt)}</p>
        </div>
      </div>
      {invoice.note && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">Note</p>
          <p className="font-medium mt-1">{invoice.note}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Invoice detail card component
 */
export function InvoiceDetailCard({
  invoice,
  isLoading = false,
}: InvoiceDetailCardProps) {
  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <InvoiceHeaderSection invoice={invoice} />
      <CustomerInfoSection invoice={invoice} />
      <div className="grid gap-6 md:grid-cols-2">
        <TotalsSection invoice={invoice} />
        <TimestampsSection invoice={invoice} />
      </div>
    </div>
  );
}
