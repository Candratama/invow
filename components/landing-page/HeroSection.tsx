import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <div className="min-h-screen w-full bg-white relative">
      {/*  Diagonal Cross Grid Top Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
          `,
          backgroundSize: "40px 40px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
        }}
      />
      <section className="relative overflow-hidden min-h-screen flex items-center -mt-16 py-12 sm:py-16 lg:py-24 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900">
              Create Professional Invoices
              <span className="block text-primary mt-2">
                Without the Headache
              </span>
            </h1>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-2xl mx-auto px-4">
              Tired of messy handwritten receipts or Word templates that look
              unprofessional? Generate beautiful invoices in 30 seconds on your
              phone. No account needed to try.
            </p>
            <div className="mt-8 sm:mt-12 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-base sm:text-lg w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 shadow-sm"
                >
                  Create Your First Invoice
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="text-sm sm:text-base font-semibold leading-6 text-gray-900 hover:text-primary transition-colors py-2"
              >
                See it in action <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
