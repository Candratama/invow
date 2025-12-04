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
  toggleStoreActive,
  resetStoreInvoiceCounter,
} from "@/app/actions/admin-stores";
import { useInvalidateAdmin } from "@/lib/hooks/use-admin-data";
import { toast } from "sonner";
import { Power, RotateCcw, CheckCircle, XCircle } from "lucide-react";

interface StoreActionsProps {
  storeId: string;
  storeName: string;
  isActive: boolean;
  onActionComplete?: () => void;
}

/**
 * Store actions component for admin store management
 * Provides activate/deactivate and reset counter actions with confirmation dialogs
 */
export function StoreActions({
  storeId,
  storeName,
  isActive,
  onActionComplete,
}: StoreActionsProps) {
  const router = useRouter();
  const invalidate = useInvalidateAdmin();
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const result = await toggleStoreActive(storeId, !isActive);
      if (result.success) {
        toast.success(
          `Store ${storeName} ${
            !isActive ? "activated" : "deactivated"
          } successfully`
        );
        setIsToggleOpen(false);

        // Invalidate React Query cache
        invalidate.invalidateStores();

        onActionComplete?.();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update store status");
      }
    } catch {
      toast.error("An error occurred while updating store status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCounter = async () => {
    setIsLoading(true);
    try {
      const result = await resetStoreInvoiceCounter(storeId);
      if (result.success) {
        toast.success(`Invoice counter for ${storeName} reset successfully`);
        setIsResetOpen(false);

        // Invalidate React Query cache
        invalidate.invalidateStores();

        onActionComplete?.();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to reset invoice counter");
      }
    } catch {
      toast.error("An error occurred while resetting counter");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
      <div className="flex flex-wrap gap-3">
        {/* Toggle Active Button */}
        <Dialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className={
                isActive
                  ? "text-red-600 border-red-200 hover:bg-red-50"
                  : "text-green-600 border-green-200 hover:bg-green-50"
              }
            >
              {isActive ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Deactivate Store
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate Store
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isActive ? "Deactivate" : "Activate"} Store
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground">
                  Are you sure you want to{" "}
                  {isActive ? "deactivate" : "activate"} store{" "}
                  <span className="font-semibold">{storeName}</span>?
                  {isActive ? (
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>The store will be marked as inactive</li>
                      <li>
                        Users may not be able to create invoices for this store
                      </li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>The store will be marked as active</li>
                      <li>Users will be able to use this store normally</li>
                    </ul>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsToggleOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant={isActive ? "destructive" : "default"}
                onClick={handleToggleActive}
                disabled={isLoading}
              >
                <Power className="h-4 w-4 mr-2" />
                {isLoading
                  ? "Processing..."
                  : isActive
                  ? "Deactivate"
                  : "Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Counter Button */}
        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Invoice Counter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Invoice Counter</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground">
                  Are you sure you want to reset the invoice counter for{" "}
                  <span className="font-semibold">{storeName}</span>?
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Next invoice number will be reset to 1</li>
                    <li>Daily invoice counter will be reset to 1</li>
                    <li>
                      This may cause duplicate invoice numbers if not careful
                    </li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsResetOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleResetCounter} disabled={isLoading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {isLoading ? "Resetting..." : "Reset Counter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
