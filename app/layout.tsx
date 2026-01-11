import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, WindSong } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
} from "@/components/schema";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const windsong = WindSong({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-windsong",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://invow.app"
  ),
  title: {
    default: "Invow - Bikin Invoice Profesional dalam 30 Detik | Gratis",
    template: "%s | Invow",
  },
  description:
    "Platform invoice generator #1 di Indonesia. Buat invoice profesional dari HP dalam 30 detik. Hemat 10+ jam per minggu. Auto backup cloud. Gratis tanpa ribet! Coba sekarang.",
  keywords: [
    "invoice generator",
    "invoice generator indonesia",
    "buat invoice online",
    "invoice gratis",
    "software invoice",
    "aplikasi invoice",
    "invoice mobile",
    "invoice profesional",
    "faktur online",
    "nota pembayaran digital",
    "invoice UMKM",
    "invoice template",
    "buat invoice dari hp",
  ],
  authors: [{ name: "Invow Team" }],
  creator: "Invow",
  publisher: "Invow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Invow",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Invow",
    title: "Invow - Bikin Invoice Profesional dalam 30 Detik",
    description:
      "Platform invoice generator #1 di Indonesia. Buat invoice dari HP dalam 30 detik. Gratis!",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Invow - Invoice Generator Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invow - Invoice Generator Indonesia",
    description: "Buat invoice profesional dalam 30 detik dari HP. Gratis!",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "32x32" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/icons/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Invow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/icons/favicon-96x96.png"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/icons/site.webmanifest" />
        <OrganizationSchema />
        <SoftwareApplicationSchema />
      </head>
      <body
        className={`${inter.variable} ${windsong.variable}`}
        suppressHydrationWarning
        style={{ fontFamily: "var(--font-inter)" }}
      >
        <QueryProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background">{children}</div>
            <Toaster
              position="top-center"
              toastOptions={{
                classNames: {
                  success: "text-primary",
                  error: "text-red-600",
                  icon: "text-primary",
                },
              }}
            />
            <SpeedInsights />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
