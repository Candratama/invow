"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { SITE_NAME } from "./constants";
import { CopyrightYear } from "./copyright-year";

export function Footer() {
  const navLinks = [
    { label: "Fitur", href: "#features" },
    { label: "Harga", href: "#pricing" },
    { label: "Keunggulan", href: "#why-us" },
  ];

  return (
    <section className="relative w-full mt-0 overflow-hidden ">
      <footer className="border-t border-stone-800 bg-stone-900 pt-20 relative">
        <div className="max-w-7xl flex flex-col justify-between mx-auto min-h-[25rem] sm:min-h-[28rem] md:min-h-[32rem] relative p-4 py-10">
          {/* Main Content */}
          <div className="flex flex-col mb-12 sm:mb-20 md:mb-0 w-full">
            <div className="w-full flex flex-col items-center">
              {/* Brand */}
              <div className="space-y-2 flex flex-col items-center flex-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                    <Image
                      src="/icons/web-app-manifest-512x512.svg"
                      alt="Invow Logo"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="text-white text-3xl font-bold">
                    {SITE_NAME}
                  </span>
                </Link>
                <p className="text-stone-400 font-semibold text-center w-full max-w-sm sm:w-96 px-4 sm:px-0 text-sm">
                  Solusi invoice praktis buat UMKM Indonesia yang mau maju.
                </p>
              </div>

              {/* Navigation Links */}
              {navLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-stone-400 max-w-full px-4 mt-6">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      className="hover:text-gold-600 duration-300 hover:font-semibold"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-20 md:mt-24 flex flex-col gap-2 md:gap-1 items-center justify-center md:flex-row md:items-center md:justify-between px-4 md:px-0">
            <p className="text-sm text-stone-400 text-center md:text-left flex items-center gap-1">
              &copy; <CopyrightYear /> {SITE_NAME}. Dibuat dengan{" "}
              <Heart size={14} className="text-red-500 fill-current" /> buat
              membantu UMKM Indonesia berkembang.
            </p>
          </div>

          {/* Large background text */}
          <div
            className="bg-gradient-to-b from-white/10 via-white/5 to-transparent bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-40 md:bottom-32 font-bold tracking-tighter pointer-events-none select-none text-center px-4"
            style={{
              fontSize: "clamp(4rem, 10vw, 12rem)",
              maxWidth: "95vw",
            }}
          >
            {SITE_NAME.toUpperCase()}
          </div>

          {/* Bottom logo */}
          <div className="absolute hover:border-gold-600 duration-400 drop-shadow-[0_0px_20px_rgba(211,175,55,0.3)] bottom-24 md:bottom-20 backdrop-blur-sm rounded-3xl bg-stone-800/60 left-1/2 border-2 border-stone-700 flex items-center justify-center p-3 -translate-x-1/2 z-10">
            <div className="w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Image
                src="/icons/web-app-manifest-512x512.svg"
                alt="Invow Logo"
                width={48}
                height={48}
                className="w-6 sm:w-8 md:w-10 h-6 sm:h-8 md:h-10"
              />
            </div>
          </div>

          {/* Bottom line */}
          <div className="absolute bottom-32 sm:bottom-34 backdrop-blur-sm h-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent w-full left-1/2 -translate-x-1/2"></div>

          {/* Bottom shadow */}
          <div className="bg-gradient-to-t from-stone-900 via-stone-900/80 blur-[1em] to-stone-900/40 absolute bottom-28 w-full h-24"></div>
        </div>
      </footer>
    </section>
  );
}
