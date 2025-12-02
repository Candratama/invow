"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  upgradeUserToPremium,
  downgradeUserToFree,
  extendSubscription,
  resetInvoiceCounter,
} from "@/app/actions/admin";
import { toast } from "sonner";

interface UserActionsProps {
  userId: string;
  currentTier: string;
  currentMonthCount: number;
  onActionComplete: () => void;
}

/**
 * User actions component for admin user management
 * Provides upgrade/downgrade, extend subscription, and reset counter actions
 */
export function UserActions({
  userId,
  currentTier,
  currentMonthCount,
  onActionComplete,
}: UserActionsProps) {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isDowngradeOpen, setIsDowngradeOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [extendDays, setExtendDays] = useState("30");
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = currentTier === "premium";

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const result = await upgradeUserToPremium(userId);
      if (result.success) {
        toast.success("User upgraded to premium successfully");
        setIsUpgradeOpen(false);
        onActionComplete();
      } else {
        toast.error(result.error || "Failed to upgrade user");
      }
    } catch {
      toast.error("An error occurred while upgrading user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsLoading(true);
    try {
      const result = await downgradeUserToFree(userId);
      if (result.success) {
        toast.success("User downgraded to free tier successfully");
        setIsDowngradeOpen(false);
        onActionComplete();
      } else {
        toast.error(result.error || "Failed to downgrade user");
      }
    } catch {
      toast.error("An error occurred while downgrading user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtend = async () => {
    const days = parseInt(extendDays, 10);
    if (isNaN(days) || days <= 0) {
      toast.error("Please enter a valid number of days");
      return;
    }

    setIsLoading(true);
    try {
      const result = await extendSubscription(userId, days);
      if (result.success) {
        toast.success(`Subscription extended by ${days} days`);
        setIsExtendOpen(false);
        setExtendDays("30");
        onActionComplete();
      } else {
        toast.error(result.error || "Failed to extend subscription");
      }
    } catch {
      toast.error("An error occurred while extending subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const result = await resetInvoiceCounter(userId);
      if (result.success) {
        toast.success("Invoice counter reset to 0");
        setIsResetOpen(false);
        onActionComplete();
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
        {/* Upgrade Button - Only show for free tier */}
        {!isPremium && (
          <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Upgrade to Premium
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upgrade User to Premium</DialogTitle>
                <DialogDescription>
                  This will upgrade the user to premium tier with:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>200 invoices per month limit</li>
                    <li>30 days subscription period</li>
                    <li>Access to all premium features</li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUpgradeOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? "Upgrading..." : "Confirm Upgrade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Downgrade Button - Only show for premium tier */}
        {isPremium && (
          <Dialog open={isDowngradeOpen} onOpenChange={setIsDowngradeOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Downgrade to Free
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Downgrade User to Free</DialogTitle>
                <DialogDescription>
                  This will downgrade the user to free tier:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>10 invoices per month limit</li>
                    <li>Subscription end date will be removed</li>
                    <li>Premium features will be disabled</li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDowngradeOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDowngrade}
                  disabled={isLoading}
                >
                  {isLoading ? "Downgrading..." : "Confirm Downgrade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Extend Subscription Button */}
        <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Extend Subscription</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Subscription</DialogTitle>
              <DialogDescription>
                Add days to the user&apos;s subscription end date. If the
                subscription has expired, the extension will start from today.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="extend-days">Number of Days</Label>
              <Input
                id="extend-days"
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="Enter number of days"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsExtendOpen(false);
                  setExtendDays("30");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleExtend} disabled={isLoading}>
                {isLoading ? "Extending..." : "Extend Subscription"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Invoice Counter Button */}
        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Reset Invoice Counter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Invoice Counter</DialogTitle>
              <DialogDescription>
                This will reset the user&apos;s current month invoice count to
                0. Current count:{" "}
                <span className="font-semibold">{currentMonthCount}</span>
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
              <Button onClick={handleReset} disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Counter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
