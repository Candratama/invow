import Navigation from "@/components/landing-page/navigation";
import HeroSection from "@/components/landing-page/hero-section";
import FeaturesSection from "@/components/landing-page/features-section";
import PricingSection from "@/components/landing-page/pricing-section";
import BenefitsSection from "@/components/landing-page/benefits-section";
import CTASection from "@/components/landing-page/cta-section";
import Footer from "@/components/landing-page/footer";

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
        <PricingSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
