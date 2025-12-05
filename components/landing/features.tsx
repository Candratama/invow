"use client";

import { FEATURES, WHY_US_POINTS } from "./constants";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-gold-100/50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 -z-10"></div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header - Golden Ratio: 3xl (2.618rem) → 4xl (3.236rem) */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-stone-900">
            Solusi lengkap buat masalah{" "}
            <span className="text-gold-500">Invoice lo</span>
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto text-lg">
            Khusus buat lo yang udah capek sama invoice ribet dan pengen dibayar
            lebih cepet.
          </p>
        </div>

        {/* Features Grid - Golden Ratio: xl (1.618rem) for titles, base (1rem) for descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true }}
              transition={{
                default: { duration: 0.2 },
                opacity: { duration: 0.5, delay: index * 0.1 },
                y: { duration: 0.2 },
              }}
              className="group relative p-8 rounded-3xl bg-white border border-stone-100 shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:shadow-gold-500/10 hover:border-gold-200 transition-all duration-200"
            >
              <div className="w-14 h-14 bg-gold-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold-500 group-hover:rotate-6 transition-all duration-200">
                <feature.icon
                  size={28}
                  className="text-gold-600 group-hover:text-white transition-colors duration-200"
                />
              </div>

              <h3 className="text-xl font-bold mb-3 text-stone-900">
                {feature.title}
              </h3>

              <p className="text-base text-stone-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Why Us Section */}
        <div
          id="why-us"
          className="bg-stone-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-white shadow-2xl"
        >
          {/* Decor */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px]"></div>

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* Golden Ratio: 3xl → 4xl for heading */}
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Kenapa ribuan UMKM pilih{" "}
                <span className="text-gold-400">Invow?</span>
              </h2>
              <p className="text-stone-300 text-lg mb-8">
                Capek sama invoice yang ribet dan customer yang telat bayar?
                Saatnya upgrade cara lo berbisnis!
              </p>

              <div className="space-y-4">
                {WHY_US_POINTS.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="mt-1 bg-gold-500/20 p-1 rounded-full">
                      <CheckCircle2 size={20} className="text-gold-400" />
                    </div>
                    <span className="text-stone-200 font-medium text-base">
                      {point}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10"
              >
                <div className="text-center">
                  {/* Golden Ratio: 2xl for subheading, 4xl for highlight */}
                  <h3 className="text-2xl font-bold mb-2">Dari Ribet Jadi</h3>
                  <div className="text-gold-400 font-bold text-4xl mb-4">
                    Super Mudah
                  </div>
                  <p className="text-stone-300 mb-8 text-base">
                    Cuma butuh hp dan 30 detik. Customer impressed, lo hemat
                    waktu!
                  </p>
                  <Link
                    href="/dashboard"
                    className="block w-full py-4 bg-gold-400 text-black font-bold rounded-xl hover:bg-gold-500 transition-colors"
                  >
                    Coba Gratis Sekarang
                  </Link>
                  <p className="mt-4 text-xs text-stone-400">
                    Gratis selamanya, gak ada yang disembunyiin!
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
