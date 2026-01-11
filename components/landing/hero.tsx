"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HERO_CONTENT } from "./constants";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge - Golden Ratio: sm (0.764rem) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-gold-200 bg-gold-50 text-gold-700 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-gold-500 animate-pulse"></span>
            <span className="text-sm font-bold tracking-wide">
              {HERO_CONTENT.badge}
            </span>
          </motion.div>

          {/* Headline - Golden Ratio: 4xl → 5xl → 6xl */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-stone-900 leading-[1.1]">
              {HERO_CONTENT.title} <br />
              <span className="relative inline-block text-gold-500">
                {HERO_CONTENT.titleHighlight}
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-gold-300 opacity-60"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.00025 6.99997C25.7263 1.33333 138.006 -5.33334 198.003 3.49997"
                    stroke="currentColor"
                    strokeWidth="3"
                  ></path>
                </svg>
              </span>
            </h1>
          </motion.div>

          {/* Description - Golden Ratio: lg (1.236rem) */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-stone-600 mb-10 max-w-2xl mx-auto font-medium"
          >
            {HERO_CONTENT.description}{" "}
            <Link
              href="/#features"
              className="text-gold-600 hover:text-gold-700 font-bold underline decoration-gold-300 hover:decoration-gold-500 transition-colors"
            >
              Lihat fitur lengkap
            </Link>{" "}
            atau{" "}
            <Link
              href="/#pricing"
              className="text-gold-600 hover:text-gold-700 font-bold underline decoration-gold-300 hover:decoration-gold-500 transition-colors"
            >
              cek harga
            </Link>
            .
          </motion.p>

          {/* CTA Button - Golden Ratio: base (1rem) font */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center"
          >
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gold-500 text-white text-base font-bold rounded-2xl hover:bg-gold-600 transition-all transform hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,179,0,0.3)] flex items-center justify-center gap-2 group shadow-lg shadow-gold-500/20"
            >
              {HERO_CONTENT.ctaSecondary}
              <ArrowRight
                className="text-white group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
