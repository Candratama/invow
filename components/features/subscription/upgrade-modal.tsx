"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Check } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { createPaymentInvoiceAction } from "@/app/actions/payments";
import { getSubscriptionPlansAction } from "@/app/actions/admin-pricing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  featureDescription?: string;
}

const PREMIUM_BENEFITS = [
  "Custom logo & signature on invoices",
  "Custom brand colors",
  "3+ premium templates",
  "High & print-ready export quality",
  "30 days transaction history",
  "Monthly reports",
  "Dashboard totals & revenue",
];

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  featureDescription,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumConfig, setPremiumConfig] = useState<{
    priceFormatted: string;
    duration: number;
    features: string[];
  } | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Fetch premium plan config from database
  useEffect(() => {
    const fetchPremiumConfig = async () => {
      const result = await getSubscriptionPlansAction(false);
      if (result.success && result.data) {
        const premium = result.data.find((p) => p.tier === "premium");
        if (premium) {
          setPremiumConfig({
            priceFormatted: premium.priceFormatted,
            duration: premium.duration,
            features: premium.features,
          });
        }
      }
    };
    fetchPremiumConfig();
  }, []);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      if (!user) {
        // Redirect to signup with return URL that includes autoUpgrade
        const returnUrl = `/dashboard/settings?autoUpgrade=premium`;
        router.push(
          `/dashboard/signup?returnUrl=${encodeURIComponent(returnUrl)}`
        );
        onClose();
        return;
      }

      // Call the Server Action
      const result = await createPaymentInvoiceAction("premium");

      if (!result.success) {
        throw new Error(result.error || "Failed to create payment invoice");
      }

      // Redirect to Mayar payment URL on success
      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleMaybeLater = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleMaybeLater()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">Upgrade to Premium</DialogTitle>
          </div>
          <DialogDescription>
            {feature ? (
              <>
                <span className="font-medium text-foreground">{feature}</span>{" "}
                {featureDescription || "is a Premium feature."}
              </>
            ) : (
              "Unlock all premium features to grow your business."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Price */}
          <div className="text-center mb-4">
            <span className="text-3xl font-bold">
              {premiumConfig?.priceFormatted || "Loading..."}
            </span>
            <span className="text-muted-foreground">
              /{premiumConfig?.duration || 30} days
            </span>
          </div>

          {/* Benefits list */}
          <ul className="space-y-2">
            {(premiumConfig?.features || PREMIUM_BENEFITS).map(
              (benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              )
            )}
          </ul>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading || authLoading}
            className="w-full"
          >
            {isLoading || authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {authLoading ? "Checking..." : "Processing..."}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleMaybeLater}
            disabled={isLoading}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
