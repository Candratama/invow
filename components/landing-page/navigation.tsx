"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/logo";

export default function Navigation() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const opacity = Math.min(scrollY / 100, 1);
  const bgOpacity = Math.max(opacity * 0.8, 0);

  return (
    <nav
      className="border-b border-gray-200 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        opacity: opacity,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo size={32} />
          <Link href="/dashboard">
            <Button className="bg-primary hover:bg-primary/90">
              Yuk Mulai!
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
