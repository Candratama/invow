"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { getPreferencesAction } from "@/app/actions/preferences";
import { useAuth } from "@/lib/auth/auth-context";

export type ExportQuality = 50 | 100 | 150;

const QUALITY_MAP: Record<number, ExportQuality> = {
  0: 50,
  1: 100,
  2: 150,
};

const QUALITY_LABELS: Record<ExportQuality, string> = {
  50: "Small (~50KB)",
  100: "Medium (~100KB)",
  150: "High (~150KB)",
};

interface ExportQualitySettingsProps {
  value?: ExportQuality;
  onChange?: (quality: ExportQuality) => void;
}

export function ExportQualitySettings({
  value,
  onChange,
}: ExportQualitySettingsProps) {
  const { user } = useAuth();
  const [currentQuality, setCurrentQuality] = useState<ExportQuality>(
    value || 100
  );
  const [loading, setLoading] = useState(true);

  // Load current quality on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await getPreferencesAction();

        if (!result.success) {
          console.error("Error loading preferences:", result.error);
          setLoading(false);
          return;
        }

        if (result.data?.export_quality_kb) {
          const quality = result.data.export_quality_kb as ExportQuality;
          setCurrentQuality(quality);
          if (onChange) {
            onChange(quality);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [onChange, user?.id]);

  // Handle slider change
  const handleSliderChange = (quality: ExportQuality) => {
    setCurrentQuality(quality);
    if (onChange) {
      onChange(quality);
    }
  };

  // Update when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setCurrentQuality(value);
    }
  }, [value]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-lg lg:text-xl font-semibold">
            Export Quality
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            Choose the maximum file size for exported invoice images
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg lg:text-xl font-semibold">
          Export Quality
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          Choose the maximum file size for exported invoice images
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {QUALITY_LABELS[currentQuality]}
          </span>
        </div>

        <Slider
          value={[
            Object.keys(QUALITY_MAP).find(
              (key) => QUALITY_MAP[Number(key)] === currentQuality
            ) || 0,
          ].map(Number)}
          onValueChange={(value) => {
            const quality = QUALITY_MAP[value[0]];
            handleSliderChange(quality);
          }}
          max={2}
          step={1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Small</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
