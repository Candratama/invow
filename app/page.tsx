"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Smartphone,
  Zap,
  Shield,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <circle cx="11" cy="4" r="2" />
                <circle cx="18" cy="8" r="2" />
                <circle cx="20" cy="16" r="2" />
                <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">Invow</span>
            </div>
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center -mt-16 py-12 sm:py-16 lg:py-24 xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900">
              Create Professional Invoices
              <span className="block text-primary mt-2">
                Without the Headache
              </span>
            </h1>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-2xl mx-auto px-4">
              Tired of messy handwritten receipts or Word templates that look
              unprofessional? Generate beautiful invoices in 30 seconds on your
              phone. No account needed to try.
            </p>
            <div className="mt-8 sm:mt-12 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-base sm:text-lg w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 shadow-sm"
                >
                  Create Your First Invoice
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="text-sm sm:text-base font-semibold leading-6 text-gray-900 hover:text-primary transition-colors py-2"
              >
                See it in action <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to invoice like a pro
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              Built specifically for Indonesian UMKM who want to get paid faster
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Create invoices anywhere
              </h3>
              <p className="text-gray-600">
                No laptop needed. Write invoices while you&apos;re at the
                market, in your shop, or anywhere you are. Your phone is all you
                need.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Done in 30 seconds
              </h3>
              <p className="text-gray-600">
                Just type the items, add the price, and you&apos;re done. No
                complicated forms or setup. Get back to running your business.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Looks professional
              </h3>
              <p className="text-gray-600">
                Your customers will take you seriously. Clean, professional
                invoices that build trust and make you look like a real
                business.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Never lose an invoice
              </h3>
              <p className="text-gray-600">
                Everything saves automatically. Access your invoice history from
                any device. No more lost receipts or wondering what you sold.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No learning curve
              </h3>
              <p className="text-gray-600">
                If you can text, you can use this. No courses to take or manuals
                to read. Just open the app and start creating invoices.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Works with Rupiah
              </h3>
              <p className="text-gray-600">
                Automatic IDR formatting, proper decimal places, and currency
                symbols. Just enter the numbers, we handle the formatting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Indonesian businesses choose Invow
              </h2>
              <p className="mt-6 text-lg text-gray-600">
                Stop wasting time on paperwork. Focus on growing your business
                while we handle the invoicing.
              </p>
              <div className="mt-10 space-y-5">
                {[
                  "Save 10+ hours per week on invoicing",
                  "Get paid faster with professional invoices",
                  "Access your invoice history from any device",
                  "Export and share invoices as images via WhatsApp",
                  "No credit card required to start",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-12">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-sm"
                  >
                    Create Your First Invoice
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <div className="text-center p-12">
                  <Smartphone className="h-24 w-24 text-primary mx-auto mb-6" />
                  <p className="text-lg font-semibold text-gray-900">
                    Create invoices in 30 seconds
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    No laptop required. Just your phone and you&apos;re ready to
                    go.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop invoicking manually. Start today.
          </h2>
          <p className="mt-6 text-xl text-white/90">
            It takes 30 seconds to create your first invoice. No signup required
            to try.
          </p>
          <div className="mt-12">
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-6 shadow-sm"
              >
                Create Your First Invoice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-white/80">
              Free forever • No credit card • Works on any phone
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <circle cx="11" cy="4" r="2" />
                <circle cx="18" cy="8" r="2" />
                <circle cx="20" cy="16" r="2" />
                <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
              </svg>
              <span className="text-2xl font-bold text-white">Invow</span>
            </div>
            <p className="text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} Invow. Built for Indonesian UMKM.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
