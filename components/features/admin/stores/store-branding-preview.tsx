"use client";

import { Palette, Image as ImageIcon } from "lucide-react";
import type { StoreDetail } from "@/lib/db/services/admin-stores.service";

interface StoreBrandingPreviewProps {
  store: StoreDetail;
}

/**
 * Color swatch component
 */
function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono uppercase">
          {color}
        </p>
      </div>
    </div>
  );
}

/**
 * Store branding preview component
 * Displays logo and color scheme
 */
export function StoreBrandingPreview({ store }: StoreBrandingPreviewProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Palette className="h-5 w-5" />
        Branding
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Preview */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Logo</p>
          <div className="w-full h-32 rounded-lg border bg-muted/50 flex items-center justify-center">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logo}
                alt={`${store.name} logo`}
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs">No logo uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Color Scheme</p>
          <div className="space-y-3">
            <ColorSwatch label="Brand Color" color={store.brandColor} />
            <ColorSwatch label="Primary Color" color={store.primaryColor} />
            <ColorSwatch label="Secondary Color" color={store.secondaryColor} />
            <ColorSwatch label="Accent Color" color={store.accentColor} />
          </div>
        </div>
      </div>

      {/* Color Preview Bar */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-2">Color Preview</p>
        <div className="flex h-8 rounded-lg overflow-hidden border">
          <div
            className="flex-1"
            style={{ backgroundColor: store.brandColor }}
            title="Brand Color"
          />
          <div
            className="flex-1"
            style={{ backgroundColor: store.primaryColor }}
            title="Primary Color"
          />
          <div
            className="flex-1"
            style={{ backgroundColor: store.secondaryColor }}
            title="Secondary Color"
          />
          <div
            className="flex-1"
            style={{ backgroundColor: store.accentColor }}
            title="Accent Color"
          />
        </div>
      </div>
    </div>
  );
}
