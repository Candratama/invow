"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeBannerProps {
  userName?: string;
  hasBusinessInfo: boolean;
}

export function WelcomeBanner({
  userName,
  hasBusinessInfo,
}: WelcomeBannerProps) {
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);

  // Check localStorage and business info after mount
  useEffect(() => {
    // If user already has business info, never show banner
    if (hasBusinessInfo) {
      return;
    }

    const dismissed = localStorage.getItem("welcomeBannerDismissed") === "true";

    // Show banner if:
    // 1. User hasn't dismissed it AND
    // 2. User doesn't have business info
    if (!dismissed && !hasBusinessInfo) {
      setShouldShow(true);
    }
  }, [hasBusinessInfo]);

  const handleDismiss = () => {
    localStorage.setItem("welcomeBannerDismissed", "true");
    setShouldShow(false);
  };

  if (!shouldShow) {
    return null;
  }

  const displayName = userName
    ? userName
        .split("@")[0]
        .split(".")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "there";

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6 mb-6 lg:p-8 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Selamat Datang!
            </span>
          </div>

          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            Hai, {displayName}! 👋
          </h2>

          <p className="text-gray-600 mb-4 lg:text-lg">
            Sebelum membuat invoice pertamamu, yuk lengkapi informasi bisnis
            dulu agar invoice-mu terlihat profesional.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Isi Business Info</p>
                <p className="text-sm text-gray-500">
                  Nama toko, alamat, dan kontak
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-400">
                  Buat Invoice Pertama
                </p>
                <p className="text-sm text-gray-400">
                  Setelah business info lengkap
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => router.push("/dashboard/settings")}
            className="gap-2 w-full sm:w-auto"
            size="lg"
          >
            Lengkapi Business Info
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Illustration - hidden on mobile */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-48 h-48 bg-primary/5 rounded-full flex items-center justify-center">
            <Building2 className="h-20 w-20 text-primary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
