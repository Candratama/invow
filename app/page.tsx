import { Suspense } from "react";
import Navigation from "@/components/landing-page/navigation";
import HeroSection from "@/components/landing-page/hero-section";
import FeaturesSection from "@/components/landing-page/features-section";
import PricingSection from "@/components/landing-page/pricing-section";
import BenefitsSection from "@/components/landing-page/benefits-section";
import CTASection from "@/components/landing-page/cta-section";
import Footer from "@/components/landing-page/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubscriptionPlansAction } from "@/app/actions/admin-pricing";

function PricingSkeleton() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Skeleton className="h-10 w-64 mx-auto mb-6" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-sm md:max-w-none mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}

async function PricingContent() {
  const result = await getSubscriptionPlansAction(false);
  const plans = result.success ? result.data || [] : [];

  return <PricingSection initialPlans={plans} />;
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white to-gray-50"
      style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
    >
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <Suspense fallback={<PricingSkeleton />}>
          <PricingContent />
        </Suspense>
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
