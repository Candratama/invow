import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Udah masuk akal kan? Yuk cobain sekarang!
        </h2>
        <p className="mt-6 text-xl text-white/90">
          Cuma butuh 30 detik doang buat invoice pertama. Gak perlu daftar juga bisa coba.
        </p>
        <div className="mt-12">
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-6 shadow-sm"
            >
              Cobain Gratis Dulu!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-white/80">
            Gratis selamanya • Gak perlu CC • Works di semua hp
          </p>
        </div>
      </div>
    </section>
  );
}
