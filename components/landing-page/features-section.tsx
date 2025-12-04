"use cache";

import {
  SmartPhone01Icon,
  ZapIcon,
  File01Icon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import FeatureCard from "./feature-card";

type IconType = readonly (readonly [
  string,
  { readonly [key: string]: string | number }
])[];

const features: Array<{ icon: IconType; title: string; description: string }> =
  [
    {
      icon: SmartPhone01Icon,
      title: "Buat invoice dimanaja asik",
      description:
        "Gak perlu ribet bawa laptop. Mau di pasar, di toko, atau di mana aja, asal ada hp lo, beres!",
    },
    {
      icon: ZapIcon,
      title: "Cuma 30 detik doang!",
      description:
        "Ketik barang, masukin harga, done! Gak ada form yang njelimet atau setting sana-sini. Yuk fokus jualan aja!",
    },
    {
      icon: File01Icon,
      title: "Auto naik level!",
      description:
        "Invoice lo bakal keliatan impress. Customer bakal mikir lo punya tim IT atau designer. Gesrek!",
    },
    {
      icon: Shield01Icon,
      title: "Invoice gak bakal ilang",
      description:
        "Tersimpan auto di cloud. Mau cek dari hp, tablet, atau laptop, bisa semua. Gak bakal lost gitu deh.",
    },
    {
      icon: CheckmarkCircle01Icon,
      title: "Mudah banget, gak perlu kursus",
      description:
        "Serius, kalau lo bisa chat WA, berarti lo bisa pake Invow. Gak perlu jadi expert dulu.",
    },
    {
      icon: CreditCardIcon,
      title: "Rupiah? Easy!",
      description:
        "Format otomatis pake IDR. Titik duanya Lengkap. Lo tinggal ketik angka doang, sisanya serahin ke kita.",
    },
  ];

export default async function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Semua yang lo butuhin buat invoice kece
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Khusus buat UMKM Indonesia yang mau dibayar cepet tanpa ribet
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
