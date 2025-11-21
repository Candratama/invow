"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { userPreferencesService } from "@/lib/db/services";
import { useAuth } from "@/lib/auth/auth-context";

interface TaxSettingsProps {
  taxEnabled?: boolean;
  taxPercentage?: string;
  onTaxEnabledChange?: (enabled: boolean) => void;
  onTaxPercentageChange?: (percentage: string) => void;
}

export function TaxSettings({ 
  taxEnabled: taxEnabledProp, 
  taxPercentage: taxPercentageProp,
  onTaxEnabledChange,
  onTaxPercentageChange 
}: TaxSettingsProps) {
  const { user } = useAuth();
  const [, setTaxEnabled] = useState(taxEnabledProp || false);
  const [taxPercentage, setTaxPercentage] = useState<string>(taxPercentageProp || "0");
  const [loading, setLoading] = useState(true);

  // Load current tax settings on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await userPreferencesService.getUserPreferences();

        if (error) {
          console.error("Error loading preferences:", error);
          setLoading(false);
          return;
        }

        if (data) {
          const enabled = data.tax_enabled ?? false;
          const percentage = data.tax_percentage !== null ? String(data.tax_percentage) : "0";
          setTaxEnabled(enabled);
          setTaxPercentage(percentage);
          if (onTaxEnabledChange) {
            onTaxEnabledChange(enabled);
          }
          if (onTaxPercentageChange) {
            onTaxPercentageChange(percentage);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading preferences:", error);
        setLoading(false);
      }
    };

    loadPreferences();
  }, [onTaxEnabledChange, onTaxPercentageChange, user?.id]);

  // Update when props change
  useEffect(() => {
    if (taxEnabledProp !== undefined) {
      setTaxEnabled(taxEnabledProp);
    }
  }, [taxEnabledProp]);

  useEffect(() => {
    if (taxPercentageProp !== undefined) {
      setTaxPercentage(taxPercentageProp);
    }
  }, [taxPercentageProp]);

  // Handle toggle change
  const handleToggleChange = (enabled: boolean) => {
    setTaxEnabled(enabled);
    if (onTaxEnabledChange) {
      onTaxEnabledChange(enabled);
    }
  };

  // Handle percentage change
  const handlePercentageChange = (value: string) => {
    // Allow empty string, numbers, and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTaxPercentage(value);
      if (onTaxPercentageChange) {
        onTaxPercentageChange(value);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-lg lg:text-xl font-semibold">Tax Settings</Label>
          <p className="text-sm text-gray-600 mt-1">
            Enable and configure tax calculation for invoices
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

      {/* Tax Percentage Input */}
      <div className="space-y-2">
        <Label htmlFor="tax-percentage" className="text-sm font-medium">Tax Percentage (%)</Label>
        <div className="relative">
          <Input
            id="tax-percentage"
            type="text"
            inputMode="decimal"
            value={taxPercentage}
            onChange={(e) => {
              const value = e.target.value;
              handlePercentageChange(value);
              // Auto enable/disable based on value
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && numValue > 0) {
                handleToggleChange(true);
              } else if (value === '0' || value === '') {
                handleToggleChange(false);
              }
            }}
            placeholder="0"
            className="pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            %
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Enter 0 to disable tax, or 1-100 to enable
        </p>
      </div>
    </div>
  );
}
