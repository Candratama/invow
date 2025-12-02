"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TransactionListItem } from "@/lib/db/services/admin-transactions.service";

interface TransactionDetailModalProps {
  transaction: TransactionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  label: string;
} {
  switch (status) {
    case "completed":
      return {
        styles: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Completed",
      };
    case "pending":
      return {
        styles: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-4 w-4" />,
        label: "Pending",
      };
    case "failed":
      return {
        styles: "bg-red-100 text-red-800",
        icon: <XCircle className="h-4 w-4" />,
        label: "Failed",
      };
    default:
      return {
        styles: "bg-gray-100 text-gray-800",
        icon: null,
        label: status,
      };
  }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
}

/**
 * Detail row component
 */
function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string | React.ReactNode;
  copyable?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium break-all">{value}</span>
        {copyable && typeof value === "string" && value !== "-" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => copyToClipboard(value, label)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Transaction detail modal component
 * Displays full transaction information including Mayar IDs
 */
export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const statusInfo = getStatusInfo(transaction.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Details
            {transaction.isStale && (
              <span title="Stale transaction (pending > 24h)">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Full information about this payment transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {/* Status Badge */}
          <div className="flex items-center gap-2 py-3 border-b">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                statusInfo.styles
              )}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </span>
            {transaction.verifiedAt && (
              <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </span>
            )}
          </div>

          {/* Transaction Info */}
          <DetailRow label="Transaction ID" value={transaction.id} copyable />
          <DetailRow
            label="User Email"
            value={transaction.userEmail}
            copyable
          />
          <DetailRow
            label="Amount"
            value={formatCurrency(transaction.amount)}
          />
          <DetailRow
            label="Tier"
            value={
              transaction.tier.charAt(0).toUpperCase() +
              transaction.tier.slice(1)
            }
          />
          <DetailRow
            label="Payment Method"
            value={transaction.paymentMethod || "-"}
          />

          {/* Mayar IDs */}
          <DetailRow
            label="Mayar Invoice ID"
            value={transaction.mayarInvoiceId || "-"}
            copyable
          />
          <DetailRow
            label="Mayar Transaction ID"
            value={transaction.mayarTransactionId || "-"}
            copyable
          />

          {/* Timestamps */}
          <DetailRow
            label="Created At"
            value={formatDate(transaction.createdAt)}
          />
          <DetailRow
            label="Completed At"
            value={formatDate(transaction.completedAt)}
          />
          <DetailRow
            label="Verified At"
            value={formatDate(transaction.verifiedAt)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
