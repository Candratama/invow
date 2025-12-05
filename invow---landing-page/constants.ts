import { Smartphone, Zap, Trophy, Cloud, BookOpen, Banknote, Clock, Check, CheckCircle2 } from 'lucide-react';

export const SITE_NAME = "Invow";

export const NAV_LINKS = [
  { name: 'Fitur', href: '#features' },
  { name: 'Harga', href: '#pricing' },
  { name: 'Keunggulan', href: '#why-us' },
];

export const HERO_CONTENT = {
  badge: "✨ Buat Invoice Keren Gak Perlu Ribet!",
  title: "Invoice Keren Cuma",
  titleHighlight: "30 Detik Doang",
  description: "Udah gak zaman pakai invoice manual atau template yang gitu-gitu aja? Dengan Invow, invoice keren bisa lo buat cuma 30 detik doang di hp. Mau coba dulu? Gak perlu daftar kok!",
  ctaPrimary: "Liat Demo Dong →",
  ctaSecondary: "Coba Gratis"
};

export const FEATURES = [
  {
    title: "Buat invoice dimanaja asik",
    description: "Gak perlu ribet bawa laptop. Mau di pasar, di toko, atau di mana aja, asal ada hp lo, beres!",
    icon: Smartphone,
  },
  {
    title: "Cuma 30 detik doang!",
    description: "Ketik barang, masukin harga, done! Gak ada form yang njelimet atau setting sana-sini. Yuk fokus jualan aja!",
    icon: Clock,
  },
  {
    title: "Auto naik level!",
    description: "Invoice lo bakal keliatan impress. Customer bakal mikir lo punya tim IT atau designer. Gesrek!",
    icon: Trophy,
  },
  {
    title: "Invoice gak bakal ilang",
    description: "Tersimpan auto di cloud. Mau cek dari hp, tablet, atau laptop, bisa semua. Gak bakal lost gitu deh.",
    icon: Cloud,
  },
  {
    title: "Mudah banget, gak perlu kursus",
    description: "Serius, kalau lo bisa chat WA, berarti lo bisa pake Invow. Gak perlu jadi expert dulu.",
    icon: BookOpen,
  },
  {
    title: "Rupiah? Easy!",
    description: "Format otomatis pake IDR. Titik duanya Lengkap. Lo tinggal ketik angka doang, sisanya serahin ke kita.",
    icon: Banknote,
  },
];

export const WHY_US_POINTS = [
  "Hemat 10+ jam seminggu buat invoicing. Waktu lo bisa buat hal yang lebih asik!",
  "Duit masuk lebih cepet! Invoice keren = pembayaran lebih cepat",
  "Mau cek invoice? Bisa dari hp, tablet, atau laptop. Mau dimana aja bisa!",
  "Langsung share ke WA dalam bentuk gambar. Customer happy, lo juga happy!",
  "Gak perlu kartu kredit buat mulai. Asik kan?"
];

export const PRICING_PLANS = [
  {
    name: "Free",
    price: "Gratis",
    period: "/bulan",
    description: "Untuk memulai bisnis kecil",
    features: ["10 invoice per bulan", "1 template dasar", "Export PDF standar", "Lihat 10 transaksi terakhir"],
    cta: "Mulai Gratis",
    popular: false,
    comingSoon: false,
  },
  {
    name: "Premium",
    price: "Rp 15.000",
    period: "/bulan",
    description: "Untuk bisnis yang berkembang",
    features: ["200 invoice per bulan", "Semua fitur Free", "3+ template premium", "Export kualitas tinggi", "30 hari riwayat transaksi"],
    cta: "Pilih Premium",
    popular: true,
    comingSoon: false,
  },
  {
    name: "Pro",
    price: "Rp 50.000",
    period: "/bulan",
    description: "Untuk bisnis profesional",
    features: ["Unlimited invoice", "Semua fitur Premium", "Unlimited template", "API access", "Priority support 24/7"],
    cta: "Coming Soon",
    popular: false,
    comingSoon: true,
  },
];