"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-primary/10 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 text-primary/20" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
            Page Not Found
          </h1>
          <p className="text-lg lg:text-xl text-gray-600">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <p className="text-sm lg:text-base text-gray-500">
            The page may have been moved, deleted, or you may have entered an incorrect URL.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm lg:text-base text-gray-500">
            Need help?{" "}
            <Link href="/dashboard" className="text-primary hover:underline font-medium">
              Sign in to your dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
