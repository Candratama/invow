import PricingCard from "./PricingCard";

const pricingTiers = [
  {
    name: "Free",
    price: "Rp 0",
    period: "month",
    description: "Perfect for trying out Invow",
    features: [
      "30 invoices per month",
      "Basic customization",
      "Revenue tracking",
    ],
    ctaText: "Get Started Free",
    ctaVariant: "outline" as const,
    isPopular: false,
  },
  {
    name: "Starter",
    price: "Rp 15K",
    period: "month",
    description: "For small businesses",
    features: [
      "200 invoices per month",
      "Basic customization",
      "Digital signatures",
      "Revenue tracking",
      "Customer management",
    ],
    ctaText: "Coming Soon",
    ctaVariant: "default" as const,
    isPopular: true,
  },
  {
    name: "Pro",
    price: "Rp 50K",
    period: "month",
    description: "For growing businesses",
    features: [
      "Unlimited invoices",
      "Advanced analytics",
      "Bulk invoice actions",
      "Priority support",
      "Custom templates",
    ],
    ctaText: "Coming Soon",
    ctaVariant: "default" as const,
    isPopular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-white ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Choose the plan that fits your business. Start free, upgrade when
            you&apos;re ready.
          </p>
        </div>

        <div className="flex justify-center gap-8">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            All plans are free trial right now. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
