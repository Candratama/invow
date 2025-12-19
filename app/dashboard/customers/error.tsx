"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for customers page
 * Requirements: 6.4 - Display specific error messages
 */
export default function CustomersError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Customers page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard"
              className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Customers
            </h1>
          </div>
        </div>
      </div>

      {/* Error Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load customers
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t load your customer list. This might be a temporary
            issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="gap-2">
              <RefreshCw size={18} />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
