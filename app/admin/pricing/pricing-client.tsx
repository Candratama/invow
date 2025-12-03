"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Pencil, Star, X } from "lucide-react";
import { getSubscriptionPlansAction } from "@/app/actions/admin-pricing";
import { PlanEditDialog } from "./plan-edit-dialog";
import type { SubscriptionPlan } from "@/lib/db/data-access/subscription-plans";

interface PricingClientProps {
  initialData: SubscriptionPlan[] | null;
}

function PricingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[500px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function FeatureIcon({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="h-4 w-4 text-green-500" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground" />
  );
}

export function PricingClient({ initialData }: PricingClientProps) {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin", "pricing-plans"],
    queryFn: async () => {
      const result = await getSubscriptionPlansAction(true);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    initialData: initialData || undefined,
    staleTime: 5 * 60 * 1000,
  });

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "pricing-plans"] });
    setEditingPlan(null);
  };

  if (isLoading && !initialData) {
    return <PricingPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pricing Plans</h1>
        <p className="text-sm text-muted-foreground">
          Kelola harga dan fitur untuk setiap tier subscription
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(plans || []).map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.isPopular ? "border-primary shadow-md" : ""
            } ${!plan.isActive ? "opacity-60" : ""}`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Popular
                </Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {plan.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  {plan.priceFormatted}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">/bulan</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Limits */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Limit</span>
                  <span className="font-medium">
                    {plan.invoiceLimit === -1
                      ? "Unlimited"
                      : `${plan.invoiceLimit}/bulan`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {plan.duration === 0 ? "Forever" : `${plan.duration} hari`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Templates</span>
                  <span className="font-medium">
                    {plan.tierFeatures.templateCount === -1
                      ? "Unlimited"
                      : plan.tierFeatures.templateCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">History</span>
                  <span className="font-medium">
                    {plan.tierFeatures.historyLimit === -1
                      ? "Unlimited"
                      : `${plan.tierFeatures.historyLimit} ${
                          plan.tierFeatures.historyType === "days"
                            ? "hari"
                            : "item"
                        }`}
                  </span>
                </div>
              </div>

              {/* Boolean Features */}
              <div className="space-y-1 text-sm border-t pt-3">
                <div className="flex items-center justify-between">
                  <span>Custom Logo</span>
                  <FeatureIcon enabled={plan.tierFeatures.hasLogo} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Signature</span>
                  <FeatureIcon enabled={plan.tierFeatures.hasSignature} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Custom Colors</span>
                  <FeatureIcon enabled={plan.tierFeatures.hasCustomColors} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Dashboard Totals</span>
                  <FeatureIcon enabled={plan.tierFeatures.hasDashboardTotals} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly Report</span>
                  <FeatureIcon enabled={plan.tierFeatures.hasMonthlyReport} />
                </div>
              </div>

              {/* Export Qualities */}
              <div className="text-sm border-t pt-3">
                <span className="text-muted-foreground">Export Quality:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {plan.tierFeatures.exportQualities.map((q) => (
                    <Badge key={q} variant="outline" className="text-xs">
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Feature List */}
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Fitur:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlanEditDialog
        plan={editingPlan}
        open={!!editingPlan}
        onOpenChange={(open: boolean) => !open && setEditingPlan(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
