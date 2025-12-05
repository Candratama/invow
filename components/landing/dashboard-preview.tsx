"use client";

import { motion } from "motion/react";
import {
  Signal,
  Wifi,
  Battery,
  Bell,
  Home,
  FileText,
  User,
  TrendingUp,
  EyeOff,
} from "lucide-react";

export function DashboardPreview() {
  return (
    <section
      id="dashboard-preview"
      className="relative pb-24 px-4 -mt-10 md:-mt-20 z-20 overflow-visible"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Floating Notification */}
        <motion.div
          initial={{ opacity: 0, x: 50, y: -20 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
          className="absolute top-20 right-4 md:right-[30%] z-30 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3 max-w-[280px]"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-900">
              Invoice Terunduh!
            </p>
            <p className="text-xs text-stone-500">
              Invoice_001.jpg berhasil diunduh.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
          className="relative"
        >
          {/* Phone Frame */}
          <div className="relative w-[320px] md:w-[350px] h-[720px] bg-stone-900 rounded-[3.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(255,179,0,0.3)] border-[6px] border-stone-800 ring-1 ring-white/20">
            {/* Power/Volume Buttons */}
            <div className="absolute top-32 -right-[8px] w-[6px] h-16 bg-stone-800 rounded-r-md"></div>
            <div className="absolute top-24 -left-[8px] w-[6px] h-10 bg-stone-800 rounded-l-md"></div>
            <div className="absolute top-40 -left-[8px] w-[6px] h-16 bg-stone-800 rounded-l-md"></div>

            {/* Screen */}
            <div className="w-full h-full bg-stone-50 rounded-[3rem] overflow-hidden relative flex flex-col">
              {/* Dynamic Island */}
              <div className="absolute top-0 left-0 right-0 h-8 z-50 flex justify-center pt-2">
                <div className="w-28 h-7 bg-black rounded-full absolute top-2"></div>
              </div>

              {/* Status Bar */}
              <div className="h-14 flex justify-between items-center px-8 pt-4 shrink-0 z-40">
                <span className="text-xs font-semibold text-stone-900 pl-1">
                  09:41
                </span>
                <div className="flex gap-1.5 text-stone-900 pr-1">
                  <Signal size={14} strokeWidth={2.5} />
                  <Wifi size={14} strokeWidth={2.5} />
                  <Battery size={14} strokeWidth={2.5} />
                </div>
              </div>

              {/* App Content */}
              <div className="flex-1 overflow-hidden relative flex flex-col">
                {/* Header */}
                <div className="px-4 pt-2 pb-4 flex justify-between items-center bg-stone-50">
                  <div>
                    <p className="text-[10px] text-stone-500 font-medium mb-0.5">
                      Halo, Juragan!
                    </p>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1">
                      Invow <span className="text-gold-500">App</span>
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center relative shadow-sm">
                    <Bell size={16} className="text-stone-600" />
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 scrollbar-hide">
                  {/* Main Card */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-2xl bg-gold-500 text-white shadow-xl shadow-gold-500/20 relative overflow-hidden"
                  >
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <TrendingUp className="text-white w-5 h-5" />
                        <EyeOff className="text-white/60 w-4 h-4" />
                      </div>

                      <div className="mb-4">
                        <h3 className="text-xs font-bold text-white mb-0.5">
                          This Month
                        </h3>
                        <h2 className="text-lg font-bold mb-0.5 tracking-tight">
                          Rp 15.250.000
                        </h2>
                        <p className="text-white/80 text-[10px] font-medium">
                          Revenue of 12 invoices
                        </p>
                      </div>

                      <div className="w-full h-px bg-white/30 mb-3"></div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/90 text-[10px] font-medium">
                            Total Revenue
                          </span>
                          <span className="text-white font-bold text-xs">
                            Rp 626.711.211
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <FileText size={12} className="text-white/80" />
                              <span className="text-white/90 text-[10px] font-medium">
                                Invoice Limit
                              </span>
                            </div>
                            <span className="text-white font-bold text-[10px]">
                              603 / 800
                            </span>
                          </div>
                          <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                            <div className="w-[75%] h-full bg-white/90 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recent Invoices */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <h4 className="text-xs font-bold text-stone-900">
                        Transaksi Terakhir
                      </h4>
                      <span className="text-[10px] font-bold text-gold-600 cursor-pointer hover:underline">
                        Lihat Semua
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          name: "Toko Makmur",
                          id: "#INV-001",
                          amount: "Rp 2.5jt",
                          status: "Lunas",
                          color: "text-green-600 bg-green-50",
                        },
                        {
                          name: "Pak Budi",
                          id: "#INV-002",
                          amount: "Rp 150rb",
                          status: "Pending",
                          color: "text-orange-600 bg-orange-50",
                        },
                        {
                          name: "Cafe Senja",
                          id: "#INV-003",
                          amount: "Rp 850rb",
                          status: "Lunas",
                          color: "text-green-600 bg-green-50",
                        },
                        {
                          name: "Ibu Susi",
                          id: "#INV-004",
                          amount: "Rp 1.2jt",
                          status: "Pending",
                          color: "text-orange-600 bg-orange-50",
                        },
                        {
                          name: "Warung Mak",
                          id: "#INV-005",
                          amount: "Rp 500rb",
                          status: "Lunas",
                          color: "text-green-600 bg-green-50",
                        },
                        {
                          name: "Toko Roti",
                          id: "#INV-006",
                          amount: "Rp 3.2jt",
                          status: "Lunas",
                          color: "text-green-600 bg-green-50",
                        },
                        {
                          name: "Salon Cantik",
                          id: "#INV-007",
                          amount: "Rp 750rb",
                          status: "Pending",
                          color: "text-orange-600 bg-orange-50",
                        },
                      ].map((inv, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: -10, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="p-2.5 rounded-xl bg-white border border-stone-100 shadow-sm flex items-center justify-between group hover:border-gold-200 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center font-bold text-stone-500 text-[10px] group-hover:bg-gold-50 group-hover:text-gold-600 transition-colors">
                              {inv.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-900">
                                {inv.name}
                              </p>
                              <p className="text-[8px] text-stone-400">
                                {inv.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-stone-900">
                              {inv.amount}
                            </p>
                            <span
                              className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${inv.color}`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="absolute bottom-0 left-0 w-full h-[72px] bg-white border-t border-stone-100 flex justify-between items-start px-6 pt-3 pb-6 z-50">
                {[
                  { icon: Home, label: "Home", active: true },
                  { icon: FileText, label: "Invoice", active: false },
                  { icon: User, label: "Profil", active: false },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center gap-0.5 ${
                      item.active ? "text-gold-600" : "text-stone-300"
                    }`}
                  >
                    <item.icon size={18} strokeWidth={item.active ? 2.5 : 2} />
                    <span className="text-[8px] font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-stone-900 rounded-full z-50"></div>
            </div>
          </div>

          {/* Decorative Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] bg-gold-400/20 blur-[80px] -z-10 rounded-full mix-blend-multiply pointer-events-none"></div>
        </motion.div>
      </div>
    </section>
  );
}
