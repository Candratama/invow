"use client";

import { useQuery } from "@tanstack/react-query";
import PricingCard from "./pricing-card";
import { getSubscriptionPlansAction } from "@/app/actions/admin-pricing";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingSection() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["public", "pricing-plans"],
    queryFn: async () => {
      const result = await getSubscriptionPlansAction(false); // Only active plans
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-sm md:max-w-none mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-sm md:max-w-none mx-auto">
            {(plans || []).map((plan) => (
              <PricingCard
                key={plan.tier}
                tier={{
                  name: plan.name,
                  price: plan.priceFormatted,
                  period: "bulan",
                  description: plan.description || "",
                  features: plan.features,
                  ctaText:
                    plan.tier === "free"
                      ? "Cobain Dulu"
                      : plan.tier === "pro"
                      ? "Lagi Disiapkan"
                      : "Beli Langsung",
                  ctaVariant:
                    plan.tier === "pro"
                      ? ("outline" as const)
                      : ("default" as const),
                  isPopular: plan.isPopular,
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Sekarang semua paket masih digratisin. Gak perlu CC juga kok.
          </p>
        </div>
      </div>
    </section>
  );
}
