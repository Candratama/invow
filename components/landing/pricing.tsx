"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, Star } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { getPricingPlansAction, type PricingPlan } from "@/app/actions/pricing";
import { formatPrice, formatPeriod } from "@/lib/utils/pricing";

export function Pricing() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const result = await getPricingPlansAction();
        if (result.success && result.data) {
          setPlans(result.data);
        } else {
          setError(result.error || "Failed to load pricing plans");
        }
      } catch (err) {
        setError("Failed to load pricing plans");
        console.error("Error fetching pricing plans:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="pricing" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-red-600">Error loading pricing: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header - Golden Ratio: 3xl → 4xl */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-stone-900">
            Harga <span className="text-gold-500">Terjangkau & Transparan</span>
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto text-lg">
            Mulai gratis dulu, rasain manfaatnya. Kalau udah cocok, baru upgrade
            sesuai kebutuhan bisnis lo.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative p-8 rounded-3xl flex flex-col transition-all duration-300 ${
                plan.is_popular
                  ? "bg-stone-900 text-white shadow-2xl shadow-stone-900/20 scale-105 z-10 border-2 border-gold-500"
                  : "bg-white text-stone-900 border border-stone-200 shadow-xl hover:shadow-2xl"
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-400 to-gold-600 text-white text-sm font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Star size={14} fill="currentColor" /> Most Popular
                </div>
              )}

              {!plan.is_active && (
                <div className="absolute top-4 right-4 bg-stone-100 text-stone-500 text-xs font-bold px-3 py-1 rounded-full">
                  Coming Soon
                </div>
              )}

              <div className="mb-8 mt-2">
                {/* Golden Ratio: xl for plan name */}
                <h3
                  className={`text-xl font-bold mb-2 ${
                    plan.is_popular ? "text-white" : "text-stone-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-6 ${
                    plan.is_popular ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  {plan.description}
                </p>

                {/* Golden Ratio: 3xl for price */}
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold ${
                      plan.is_popular ? "text-gold-400" : "text-stone-900"
                    }`}
                  >
                    {formatPrice(plan.price)}
                  </span>
                  <span
                    className={`${
                      plan.is_popular ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    {formatPeriod(plan.billing_period, plan.duration)}
                  </span>
                </div>
              </div>

              <div className="w-full h-px bg-current opacity-10 mb-8"></div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-full p-0.5 ${
                        plan.is_popular ? "bg-gold-500/20" : "bg-gold-100"
                      }`}
                    >
                      <Check
                        size={14}
                        className="text-gold-500 shrink-0"
                        strokeWidth={3}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        plan.is_popular ? "text-stone-300" : "text-stone-600"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {!plan.is_active ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl font-bold bg-stone-100 text-stone-400 cursor-not-allowed"
                >
                  Segera Hadir
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group ${
                    plan.is_popular
                      ? "bg-gold-500 text-white hover:bg-gold-600 shadow-lg shadow-gold-500/25"
                      : "bg-stone-900 text-white hover:bg-stone-800 hover:shadow-lg"
                  }`}
                >
                  {plan.tier === "free"
                    ? "Mulai Gratis Sekarang"
                    : `Upgrade ke ${plan.name}`}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 text-center"
        >
          <div className="inline-block p-6 rounded-2xl bg-gold-50 border border-gold-200">
            <p className="text-stone-800 font-medium text-base">
              🎉 Mau coba gratis? Mulai aja pake{" "}
              <span className="font-bold text-gold-600">paket Starter</span>{" "}
              yang gratis selamanya!
            </p>
            <p className="text-sm text-stone-500 mt-2">
              Gak perlu kartu kredit • Gak ada biaya tersembunyi • Langsung bisa
              dipake
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
