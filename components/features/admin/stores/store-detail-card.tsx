"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Store,
  User,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  Hash,
  CheckCircle,
  XCircle,
  FileText,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreDetail } from "@/lib/db/services/admin-stores.service";

interface StoreDetailCardProps {
  store: StoreDetail;
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
 * Loading skeleton for store detail card
 */
function StoreDetailSkeleton() {
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
    </div>
  );
}

/**
 * Store basic info section
 */
function StoreBasicInfoSection({ store }: { store: StoreDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Store Information</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Store Name</p>
          <p className="font-medium flex items-center gap-1">
            <Store className="h-4 w-4 text-muted-foreground" />
            {store.name}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Store Code</p>
          <p className="font-medium flex items-center gap-1">
            <Hash className="h-4 w-4 text-muted-foreground" />
            {store.storeCode}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Slug</p>
          <p className="font-mono text-sm">{store.slug}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium mt-1",
              store.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {store.isActive ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {store.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Owner</p>
          <p className="font-medium flex items-center gap-1">
            <User className="h-4 w-4 text-muted-foreground" />
            {store.userEmail}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created At</p>
          <p className="font-medium flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formatDate(store.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Store contact info section
 */
function StoreContactInfoSection({ store }: { store: StoreDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Address</p>
          <p className="font-medium flex items-start gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            {store.address || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">WhatsApp</p>
          <p className="font-medium flex items-center gap-1">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            {store.whatsapp || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Phone</p>
          <p className="font-medium flex items-center gap-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {store.phone || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium flex items-center gap-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {store.email || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Website</p>
          <p className="font-medium flex items-center gap-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {store.website ? (
              <a
                href={store.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {store.website}
              </a>
            ) : (
              "N/A"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Invoice settings section
 */
function InvoiceSettingsSection({ store }: { store: StoreDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Invoice Settings</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Invoice Prefix</p>
          <p className="font-medium">{store.invoicePrefix || "None"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Number Format</p>
          <p className="font-mono text-sm">
            {store.invoiceNumberFormat || "Default"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next Invoice Number</p>
          <p className="font-medium flex items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {store.nextInvoiceNumber}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Number Padding</p>
          <p className="font-medium">{store.invoiceNumberPadding} digits</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Daily Counter</p>
          <p className="font-medium">{store.dailyInvoiceCounter ?? "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reset Counter Daily</p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium mt-1",
              store.resetCounterDaily
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            )}
          >
            {store.resetCounterDaily ? "Yes" : "No"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Store stats section
 */
function StoreStatsSection({ store }: { store: StoreDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Statistics</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{store.stats.totalInvoices}</p>
          <p className="text-sm text-muted-foreground">Total Invoices</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{store.stats.thisMonthInvoices}</p>
          <p className="text-sm text-muted-foreground">This Month</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">
            {formatCurrency(store.stats.totalRevenue)}
          </p>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Store detail card component
 */
export function StoreDetailCard({
  store,
  isLoading = false,
}: StoreDetailCardProps) {
  if (isLoading) {
    return <StoreDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <StoreBasicInfoSection store={store} />
      <StoreContactInfoSection store={store} />
      <InvoiceSettingsSection store={store} />
      <StoreStatsSection store={store} />
    </div>
  );
}
