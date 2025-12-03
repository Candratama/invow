import PricingCard from "./pricing-card";

interface PricingSectionProps {
  initialPlans: Array<{
    tier: string;
    name: string;
    priceFormatted: string;
    description: string | null;
    features: string[];
    isPopular: boolean;
    isActive: boolean;
  }>;
}

export default function PricingSection({ initialPlans }: PricingSectionProps) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Harga fair & jelas
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Pilih yang sesuai budget lo. Mulai dari gratis, mau upgrade kapan
            aja bisa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-sm md:max-w-none mx-auto">
          {initialPlans.map((plan) => (
            <PricingCard
              key={plan.tier}
              tier={{
                name: plan.name,
                price: plan.priceFormatted,
                period: "bulan",
                description: plan.description || "",
                features: plan.features,
                ctaText: !plan.isActive
                  ? "Coming Soon"
                  : plan.tier === "free"
                  ? "Cobain Dulu"
                  : "Beli Langsung",
                ctaVariant: !plan.isActive
                  ? ("outline" as const)
                  : plan.tier === "free"
                  ? ("default" as const)
                  : ("default" as const),
                isPopular: plan.isPopular,
                isActive: plan.isActive,
              }}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Sekarang semua paket masih digratisin. Gak perlu CC juga kok.
          </p>
        </div>
      </div>
    </section>
  );
}
