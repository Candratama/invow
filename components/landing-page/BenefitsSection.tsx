import Link from "next/link";
import { ArrowRight, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Hemat 10+ jam seminggu buat invoicing. Waktu lo bisa buat hal yang lebih asik!",
  "Duit masuk lebih cepet! Invoice keren = pembayaran lebih cepat",
  "Mau cek invoice? Bisa dari hp, tablet, atau laptop. Mau dimana aja bisa!",
  "Langsung share ke WA dalam bentuk gambar. Customer happy, lo juga happy!",
  "Gak perlu kartu kredit buat mulai. Asik kan?",
];

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Kenapa UMKM Indonesia suka Invow?
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              Udah cape main kertas-kertasan mulu? Yuk fokus jualan aja!
              Urusan invoicing, serahin ke kita.
            </p>
            <div className="mt-10 space-y-5">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-sm"
                >
                  Cobain Sekarang!
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <div className="text-center p-12">
                <Smartphone className="h-24 w-24 text-primary mx-auto mb-6" />
                <p className="text-lg font-semibold text-gray-900">
                  Invoice kece dalam 30 detik
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  Gak perlu laptop njir. Cukup hp lo doang, beres!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
