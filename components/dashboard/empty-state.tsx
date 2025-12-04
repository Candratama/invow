"use cache";

import { Plus } from "lucide-react";

/**
 * Cached empty state component for when there are no invoices.
 * This is a static UI element that can be pre-rendered and cached.
 */
export async function EmptyStateContent() {
  return (
    <div className="max-w-sm mx-auto">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus className="text-primary" size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No invoices yet
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Create your first invoice to start tracking your sales and revenue
      </p>
    </div>
  );
}
