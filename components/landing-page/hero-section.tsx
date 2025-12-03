import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Simple CSS dot pattern - much faster than animated SVG */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #9333ea 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          maskImage:
            "radial-gradient(600px circle at center, white, transparent)",
          WebkitMaskImage:
            "radial-gradient(600px circle at center, white, transparent)",
        }}
      />
      <section className="relative overflow-hidden min-h-screen flex items-center -mt-16 py-12 sm:py-16 lg:py-24 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900">
              Buat Invoice Keren
              <span className="block text-primary mt-2">Gak Perlu Ribet!</span>
            </h1>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-2xl mx-auto px-4">
              Udah gak zaman pakai invoice manual atau template yang gitu-gitu
              aja? Dengan Invow, invoice keren bisa lo buat cuma 30 detik doang
              di hp. Mau coba dulu? Gak perlu daftar kok!
            </p>
            <div className="mt-8 sm:mt-12 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-base sm:text-lg w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 shadow-sm"
                >
                  Bikin Invoice Pertama Yuk!
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="ml-2"
                    size={20}
                    strokeWidth={1.5}
                  />
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="text-sm sm:text-base font-semibold leading-6 text-gray-900 hover:text-primary transition-colors py-2"
              >
                Liat Demo Dong <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
