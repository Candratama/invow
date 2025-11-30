"use client";

import PricingCard from "./pricing-card";

const pricingTiers = [
  {
    name: "Gratis",
    price: "Rp 0",
    period: "bulan",
    description: "Coba dulu, gratis!",
    features: ["30 invoice sebulan", "Kustomisasi basic", "Cek pendapatan"],
    ctaText: "Cobain Dulu",
    ctaVariant: "default" as const,
    isPopular: false,
  },
  {
    name: "Premium",
    price: "Rp 15K",
    period: "bulan",
    description: "Harga terbaik, cuma Rp75/invoice",
    features: [
      "200 invoice sebulan",
      "Kustomisasi lanjutan",
      "Tanda tangan digital",
      "Cek pendapatan",
      "Manajemen customer",
    ],
    ctaText: "Beli Langsung",
    ctaVariant: "default" as const,
    isPopular: true,
  },
  {
    name: "Pro",
    price: "Rp 50K",
    period: "bulan",
    description: "Untuk yang udah kebesaran",
    features: [
      "Invoice unlimited",
      "Analytics advanced",
      "Bulk actions",
      "CS prioritas",
      "Template custom",
    ],
    ctaText: "Lagi Disiapkan",
    ctaVariant: "outline" as const,
    isPopular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-white ">
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

        <div className="flex justify-center gap-8">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Sekarang semua paket masih digratisin. Gak perlu CC juga kok.
          </p>
        </div>
      </div>
    </section>
  );
}
