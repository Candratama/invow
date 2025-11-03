import Navigation from "@/components/landing-page/Navigation";
import HeroSection from "@/components/landing-page/HeroSection";
import FeaturesSection from "@/components/landing-page/FeaturesSection";
import PricingSection from "@/components/landing-page/PricingSection";
import BenefitsSection from "@/components/landing-page/BenefitsSection";
import CTASection from "@/components/landing-page/CTASection";
import Footer from "@/components/landing-page/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
