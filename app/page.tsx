import { Suspense } from "react";
import Navigation from "@/components/landing-page/navigation";
import HeroSection from "@/components/landing-page/hero-section";
import FeaturesSection from "@/components/landing-page/features-section";
import PricingSection from "@/components/landing-page/pricing-section";
import BenefitsSection from "@/components/landing-page/benefits-section";
import CTASection from "@/components/landing-page/cta-section";
import Footer from "@/components/landing-page/footer";
import {
  CacheErrorBoundary,
  CacheFallbackPlaceholder,
} from "@/components/cache-error-boundary";

/**
 * Landing page with cached components wrapped in error boundaries.
 *
 * Each cached component is isolated with its own CacheErrorBoundary to ensure:
 * - Errors in one section don't propagate to siblings (Requirement 8.4)
 * - Graceful fallback UI is displayed on errors (Requirement 8.1)
 */
export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white to-gray-50"
      style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
    >
      <CacheErrorBoundary
        componentName="Navigation"
        fallback={<div className="h-16 bg-white" />}
      >
        <Navigation />
      </CacheErrorBoundary>

      <main>
        <CacheErrorBoundary
          componentName="HeroSection"
          fallback={<CacheFallbackPlaceholder height="min-h-screen" />}
        >
          <HeroSection />
        </CacheErrorBoundary>

        <CacheErrorBoundary
          componentName="FeaturesSection"
          fallback={<CacheFallbackPlaceholder height="py-24" />}
        >
          <FeaturesSection />
        </CacheErrorBoundary>

        {/* PricingSection is a cached async server component with cacheLife('hours') */}
        <CacheErrorBoundary
          componentName="PricingSection"
          fallback={<CacheFallbackPlaceholder height="py-24" />}
        >
          <PricingSection />
        </CacheErrorBoundary>

        <CacheErrorBoundary
          componentName="BenefitsSection"
          fallback={<CacheFallbackPlaceholder height="py-24" />}
        >
          <BenefitsSection />
        </CacheErrorBoundary>

        <CacheErrorBoundary
          componentName="CTASection"
          fallback={<CacheFallbackPlaceholder height="py-24" />}
        >
          <CTASection />
        </CacheErrorBoundary>
      </main>

      <CacheErrorBoundary
        componentName="Footer"
        fallback={<div className="bg-gray-900 h-32" />}
      >
        <Suspense fallback={<div className="bg-gray-900 h-32" />}>
          <Footer />
        </Suspense>
      </CacheErrorBoundary>
    </div>
  );
}
