"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface CacheErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, componentName?: string) => void;
}

interface CacheErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * CacheErrorBoundary - Error boundary specifically designed for cached components.
 *
 * Features:
 * - Isolates errors in cached components from propagating to siblings
 * - Provides customizable fallback UI
 * - Logs errors for monitoring with component context
 * - Supports retry functionality
 *
 * Requirements: 8.1 - IF a cached component fails to render THEN the Error Boundary
 * SHALL catch the error and display a fallback UI
 */
export class CacheErrorBoundary extends Component<
  CacheErrorBoundaryProps,
  CacheErrorBoundaryState
> {
  constructor(props: CacheErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CacheErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error(
      `[CacheErrorBoundary] Error in cached component${
        this.props.componentName ? ` "${this.props.componentName}"` : ""
      }:`,
      error,
      errorInfo
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, this.props.componentName);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default minimal fallback UI for cached components
      return (
        <div className="w-full py-12 px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Content unavailable
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This section couldn&apos;t be loaded. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Minimal fallback component for landing page sections.
 * Provides a subtle placeholder that doesn't disrupt the page layout.
 */
export function CacheFallbackPlaceholder({
  height = "py-24",
  message = "Loading...",
}: {
  height?: string;
  message?: string;
}) {
  return (
    <div className={`w-full ${height} flex items-center justify-center`}>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
