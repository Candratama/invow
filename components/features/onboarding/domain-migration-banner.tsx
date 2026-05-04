"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const STORAGE_KEY = "invow_domain_migration_banner_dismissed_v1";
const SUNSET_DATE = new Date("2026-05-20T00:00:00+07:00");
const NEW_DOMAIN = "invow.web.id";
const OLD_DOMAIN = "invow.kodesafari.tech";

export function DomainMigrationBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname);
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed || hostname === null) return null;
  if (Date.now() >= SUNSET_DATE.getTime()) return null;

  const onOldDomain = hostname === OLD_DOMAIN;
  const daysLeft = Math.max(
    0,
    Math.ceil((SUNSET_DATE.getTime() - Date.now()) / 86400000),
  );

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  const tone = onOldDomain
    ? "bg-red-50 border-red-300 text-red-900"
    : "bg-amber-50 border-amber-300 text-amber-900";

  return (
    <div className={`p-3 border rounded-lg ${tone} mb-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">
              {onOldDomain
                ? `Anda mengakses domain lama. Domain berakhir dalam ${daysLeft} hari.`
                : `Domain pindah ke ${NEW_DOMAIN}`}
            </p>
            <p>
              {onOldDomain ? (
                <>
                  Buka{" "}
                  <a
                    href={`https://${NEW_DOMAIN}${
                      typeof window !== "undefined" ? window.location.pathname : ""
                    }`}
                    className="font-semibold underline"
                  >
                    https://{NEW_DOMAIN}
                  </a>{" "}
                  dan update bookmark Anda. Domain lama berhenti aktif tanggal 20 Mei 2026.
                </>
              ) : (
                <>
                  Update bookmark, link tersimpan, dan integrasi ke{" "}
                  <span className="font-semibold">{NEW_DOMAIN}</span>. Domain
                  lama ({OLD_DOMAIN}) berhenti aktif <strong>20 Mei 2026</strong>.
                </>
              )}
            </p>
          </div>
        </div>
        {!onOldDomain && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup pengumuman"
            className="flex-shrink-0 p-1 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
