"use client";

import * as React from "react";
import { Input } from "./input";

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: number;
  onChange?: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(({ value, onChange, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState("");

  React.useEffect(() => {
    if (value !== undefined && value !== null && !isNaN(value)) {
      setDisplayValue(formatNumber(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const formatNumber = (num: number): string => {
    if (num === 0) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // parseNumber is kept for potential future use
  // const parseNumber = (str: string): number => {
  //   const cleaned = str.replace(/\./g, '')
  //   const num = parseInt(cleaned, 10)
  //   return isNaN(num) ? 0 : num
  // }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = input.replace(/[^\d]/g, "");

    if (cleaned === "") {
      setDisplayValue("");
      onChange?.(0);
      return;
    }

    const numValue = parseInt(cleaned, 10);
    if (!isNaN(numValue)) {
      setDisplayValue(formatNumber(numValue));
      onChange?.(numValue);
    }
  };

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
    />
  );
});

CurrencyInput.displayName = "CurrencyInput";
