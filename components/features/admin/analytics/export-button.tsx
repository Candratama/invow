"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  onExport: () => Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }>;
  filename: string;
  label?: string;
}

/**
 * Reusable export button component for CSV downloads
 */
export function ExportButton({
  onExport,
  filename,
  label = "Export CSV",
}: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await onExport();
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || "Failed to export CSV");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button variant="outline" onClick={handleExport} disabled={isPending}>
        <Download className="mr-2 h-4 w-4" />
        {isPending ? "Exporting..." : label}
      </Button>
    </div>
  );
}
