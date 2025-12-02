"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteAdminInvoice,
  updateAdminInvoiceStatus,
} from "@/app/actions/admin-invoices";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  currentStatus: "draft" | "pending" | "synced";
  onActionComplete?: () => void;
}

/**
 * Invoice actions component for admin invoice management
 * Provides delete and status change actions with confirmation dialogs
 */
export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  currentStatus,
  onActionComplete,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    "draft" | "pending" | "synced"
  >(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteAdminInvoice(invoiceId);
      if (result.success) {
        toast.success(`Invoice ${invoiceNumber} deleted successfully`);
        setIsDeleteOpen(false);
        router.push("/admin/invoices");
      } else {
        toast.error(result.error || "Failed to delete invoice");
      }
    } catch {
      toast.error("An error occurred while deleting invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      setIsStatusOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateAdminInvoiceStatus(invoiceId, selectedStatus);
      if (result.success) {
        toast.success(`Invoice status updated to ${selectedStatus}`);
        setIsStatusOpen(false);
        onActionComplete?.();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update invoice status");
      }
    } catch {
      toast.error("An error occurred while updating status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
      <div className="flex flex-wrap gap-3">
        {/* Change Status Button */}
        <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Change Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Invoice Status</DialogTitle>
              <DialogDescription>
                Update the status of invoice {invoiceNumber}. Current status:{" "}
                <span className="font-semibold capitalize">
                  {currentStatus}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as "draft" | "pending" | "synced")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="synced">Synced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStatusOpen(false);
                  setSelectedStatus(currentStatus);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusChange} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Button */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground">
                  Are you sure you want to delete invoice{" "}
                  <span className="font-semibold">{invoiceNumber}</span>?
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>This action cannot be undone</li>
                    <li>All invoice items will be deleted</li>
                    <li>
                      If created this month, the user&apos;s invoice count will
                      be decremented
                    </li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
