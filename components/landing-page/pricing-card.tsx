"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import UpgradeButton from "@/components/features/subscription/upgrade-button";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaVariant?: "outline" | "default";
  isPopular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
}

export default function PricingCard({ tier }: PricingCardProps) {
  const cardClasses = tier.isPopular
    ? "relative rounded-2xl bg-white border-2 border-primary p-8 shadow-lg hover:shadow-xl transition-shadow"
    : "relative rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow";

  // Determine if this is a paid tier (Starter or Pro)
  const isPaidTier = tier.name === "Starter" || tier.name === "Pro";
  const tierType = tier.name.toLowerCase() as "starter" | "pro";

  return (
    <div className={cardClasses}>
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-medium text-white">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
        <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
        <div className="mt-6 flex items-baseline">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            {tier.price}
          </span>
          <span className="ml-2 text-sm font-medium text-gray-600">
            /{tier.period}
          </span>
        </div>
      </div>
      <div className="mb-8">
        {isPaidTier ? (
          <UpgradeButton
            tier={tierType}
            variant={tier.ctaVariant === "outline" ? "outline" : "default"}
            className={`w-full ${
              tier.ctaVariant === "outline"
                ? "border-primary text-primary hover:bg-primary hover:text-white"
                : "bg-primary hover:bg-primary/90"
            }`}
            requireAuth={true}
          >
            {tier.ctaText}
          </UpgradeButton>
        ) : (
          <Link href="/dashboard/signup" className="block w-full">
            <Button
              variant={tier.ctaVariant === "outline" ? "outline" : "default"}
              className={`w-full ${
                tier.ctaVariant === "outline"
                  ? "border-primary text-primary hover:bg-primary hover:text-white"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {tier.ctaText}
            </Button>
          </Link>
        )}
      </div>
      <ul className="space-y-4 mb-8">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
