import { Smartphone, Zap, Trophy, Cloud, BookOpen, Banknote, Clock, CheckCircle2 } from 'lucide-react';

export const SITE_NAME = "Invow";

export const NAV_LINKS = [
  { name: 'Fitur', href: '#features' },
  { name: 'Harga', href: '#pricing' },
  { name: 'Keunggulan', href: '#why-us' },
];

export const HERO_CONTENT = {
  badge: "✨ Udah Cape Bikin Invoice Ribet? Ada Solusinya!",
  title: "Bikin Invoice Kece Cuma",
  titleHighlight: "30 Detik Aja",
  description: "Capek ya bikin invoice pake Excel yang suka error? Atau template Word yang berantakan? Sekarang lo bisa bikin invoice profesional langsung dari hp, cuma butuh 30 detik. Customer bakal impressed, lo juga hemat waktu!",
  ctaPrimary: "Liat Demo Dong →",
  ctaSecondary: "Coba Sekarang Gratis"
};

export const FEATURES = [
  {
    title: "Lagi di jalan? Tetep bisa bikin invoice!",
    description: "Habis ketemu klien langsung bisa kirim invoice. Gak perlu nunggu balik ke kantor atau buka laptop. Cukup hp lo aja!",
    icon: Smartphone,
  },
  {
    title: "Bye-bye Excel yang suka error!",
    description: "Udah cape kan Excel yang suka rusak formatnya? Di sini tinggal isi data, langsung jadi invoice kece. Gak ada drama lagi!",
    icon: Clock,
  },
  {
    title: "Customer impressed, lo makin dipercaya",
    description: "Invoice profesional = bisnis lo keliatan serius. Customer jadi lebih percaya dan bayar lebih cepet. Win-win solution!",
    icon: Trophy,
  },
  {
    title: "Gak takut kehilangan data lagi",
    description: "Pernah gak sih file invoice hilang atau corrupt? Di sini semua auto backup ke cloud. Aman deh, gak bakal stress lagi!",
    icon: Cloud,
  },
  {
    title: "Gampang banget, kayak main game",
    description: "Kalau lo bisa pesen Gojek atau chat WA, pasti bisa pake ini. Interface-nya user-friendly banget, dijamin gak bingung!",
    icon: BookOpen,
  },
  {
    title: "Format Rupiah otomatis rapi",
    description: "Gak perlu pusing sama titik, koma, atau Rp. Lo ketik angka aja, sisanya kita yang beresin. Hasilnya selalu rapi!",
    icon: Banknote,
  },
];

export const WHY_US_POINTS = [
  "Hemat 10+ jam seminggu! Waktu lo bisa buat fokus jualan atau quality time sama keluarga",
  "Cash flow lancar! Invoice profesional bikin customer lebih cepet bayar, bisnis lo jadi lebih sehat",
  "Akses dimana aja, kapan aja. Lagi di rumah, di toko, atau traveling tetep bisa cek invoice",
  "Share langsung ke WA customer dalam bentuk gambar HD. Praktis dan terlihat profesional!",
  "Mulai gratis tanpa ribet. Gak perlu kartu kredit, gak ada biaya tersembunyi"
];

export const PRICING_PLANS = [
  {
    name: "Starter",
    price: "Gratis",
    period: "/selamanya",
    description: "Perfect buat yang baru mulai bisnis",
    features: ["10 invoice per bulan", "1 template kece", "Export PDF berkualitas", "Riwayat 10 transaksi terakhir", "Support via email"],
    cta: "Mulai Gratis Sekarang",
    popular: false,
    comingSoon: false,
  },
  {
    name: "Business",
    price: "Rp 15.000",
    period: "/bulan",
    description: "Buat bisnis yang udah jalan dan butuh lebih",
    features: ["200 invoice per bulan", "Semua fitur Starter", "5+ template premium", "Export HD quality", "30 hari riwayat lengkap", "Priority support"],
    cta: "Upgrade ke Business",
    popular: true,
    comingSoon: false,
  },
  {
    name: "Enterprise",
    price: "Rp 50.000",
    period: "/bulan",
    description: "Solusi lengkap untuk bisnis besar",
    features: ["Unlimited invoice", "Semua fitur Business", "Custom template", "API integration", "Support 24/7", "Custom branding"],
    cta: "Segera Hadir",
    popular: false,
    comingSoon: true,
  },
];
