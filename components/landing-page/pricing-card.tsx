import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaVariant?: "outline" | "default";
  isPopular?: boolean;
  isActive?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
}

export default function PricingCard({ tier }: PricingCardProps) {
  const isInactive = tier.isActive === false;

  const cardClasses = tier.isPopular
    ? "relative rounded-2xl bg-white border-2 border-primary p-8 shadow-lg hover:shadow-xl transition-shadow"
    : isInactive
    ? "relative rounded-2xl bg-gray-50 border border-gray-300 p-8 shadow-sm opacity-75"
    : "relative rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow";

  // For landing page, all CTAs go to signup/dashboard
  const ctaHref = tier.name === "Premium" ? "/dashboard" : "/dashboard/signup";

  return (
    <div className={cardClasses}>
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-medium text-white">
            Most Popular
          </span>
        </div>
      )}
      {isInactive && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-gray-500 px-4 py-1 text-sm font-medium text-white">
            Coming Soon
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">
          {tier.name}
        </h3>
        <p className="mt-2 text-sm lg:text-base text-gray-600">
          {tier.description}
        </p>
        <div className="mt-6 flex items-baseline">
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
            {tier.price}
          </span>
          <span className="ml-2 text-sm lg:text-base font-medium text-gray-600">
            /{tier.period}
          </span>
        </div>
      </div>
      <div className="mb-8">
        {isInactive ? (
          <Button
            variant="outline"
            disabled
            className="w-full border-gray-400 text-gray-500 cursor-not-allowed"
          >
            {tier.ctaText}
          </Button>
        ) : (
          <Link href={ctaHref} className="block w-full">
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
