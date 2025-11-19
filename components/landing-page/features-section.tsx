import {
  Smartphone,
  Zap,
  FileText,
  Shield,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import FeatureCard from "./feature-card";

const features = [
  {
    icon: Smartphone,
    title: "Buat invoice dimanaja asik",
    description:
      "Gak perlu ribet bawa laptop. Mau di pasar, di toko, atau di mana aja, asal ada hp lo, beres!",
  },
  {
    icon: Zap,
    title: "Cuma 30 detik doang!",
    description:
      "Ketik barang, masukin harga, done! Gak ada form yang njelimet atau setting sana-sini. Yuk fokus jualan aja!",
  },
  {
    icon: FileText,
    title: "Auto naik level!",
    description:
      "Invoice lo bakal keliatan impress. Customer bakal mikir lo punya tim IT atau designer. Gesrek!",
  },
  {
    icon: Shield,
    title: "Invoice gak bakal ilang",
    description:
      "Tersimpan auto di cloud. Mau cek dari hp, tablet, atau laptop, bisa semua. Gak bakal lost gitu deh.",
  },
  {
    icon: CheckCircle,
    title: "Mudah banget, gak perlu kursus",
    description:
      "Serius, kalau lo bisa chat WA, berarti lo bisa pake Invow. Gak perlu jadi expert dulu.",
  },
  {
    icon: CreditCard,
    title: "Rupiah? Easy!",
    description:
      "Format otomatis pake IDR. Titik duanya Lengkap. Lo tinggal ketik angka doang, sisanya serahin ke kita.",
  },
];

export default function FeaturesSection() {
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
