import {
  Navbar,
  Hero,
  DashboardPreview,
  Features,
  Pricing,
  Footer,
  ScrollToTop,
} from "@/components/landing";

/**
 * Landing page dengan Golden Ratio Typography
 *
 * Font Scale (φ = 1.618):
 * - xs: 0.618rem (~10px)
 * - sm: 0.764rem (~12px)
 * - base: 1rem (16px)
 * - lg: 1.236rem (~20px)
 * - xl: 1.618rem (~26px)
 * - 2xl: 2rem (32px)
 * - 3xl: 2.618rem (~42px)
 * - 4xl: 3.236rem (~52px)
 * - 5xl: 4.236rem (~68px)
 * - 6xl: 5.236rem (~84px)
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-gold-200 selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gold-200/40 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-orange-100/60 rounded-full blur-[100px] animate-blob [animation-delay:2s] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-yellow-100/50 rounded-full blur-[120px] animate-blob [animation-delay:4s] mix-blend-multiply"></div>
      </div>

      <div className="relative z-10">
        <Navbar />

        <main>
          <Hero />
          <DashboardPreview />
          <Features />
          <Pricing />
        </main>

        <Footer />
      </div>

      <ScrollToTop />
    </div>
  );
}
