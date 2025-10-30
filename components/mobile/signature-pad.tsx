"use client";

import React, { useCallback, useEffect, useRef } from "react";
import SignaturePad from "signature_pad";
import type { Options as SignaturePadOptions } from "signature_pad";

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
  onReady?: (pad: SignaturePad | null) => void;
  responsive?: boolean;
  autoCrop?: boolean;
}

/**
 * Lightweight wrapper around signature_pad to capture hand drawn signatures.
 */
export function SignatureCanvas({
  value,
  onChange,
  width = 320,
  height = 160,
  penColor = "#111827",
  backgroundColor,
  onReady,
  responsive = true,
  autoCrop = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const currentValueRef = useRef<string | undefined>(value);

  // Responsive dimensions
  const getResponsiveDimensions = useCallback(() => {
    if (!responsive) return { width, height };

    // Desktop: larger canvas
    if (window.innerWidth >= 1024) {
      return { width: 600, height: 300 };
    }
    // Tablet: medium canvas
    if (window.innerWidth >= 768) {
      return { width: 480, height: 240 };
    }
    // Mobile: default size
    return { width, height };
  }, [responsive, width, height]);

  const [dimensions, setDimensions] = React.useState(getResponsiveDimensions);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width: w, height: h } = responsive ? dimensions : { width, height };

    const ratio = window.devicePixelRatio || 1;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const context = canvas.getContext("2d");
    if (!context) return;

    padRef.current?.clear();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
    context.clearRect(0, 0, w, h);

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, w, h);
    }

    if (currentValueRef.current) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, w, h);
      };
      image.src = currentValueRef.current;
    }
  }, [width, height, backgroundColor, responsive, dimensions]);

  // Auto-crop signature to remove whitespace
  const cropSignature = useCallback(
    (canvas: HTMLCanvasElement): string | undefined => {
      const context = canvas.getContext("2d");
      if (!context) return undefined;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      // Find bounds of non-transparent pixels
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const alpha = pixels[index + 3];

          if (alpha > 0) {
            // Non-transparent pixel
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Check if any drawing exists
      if (minX > maxX || minY > maxY) {
        return undefined; // Empty canvas
      }

      // Add small padding
      const padding = 10;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      // Calculate cropped dimensions
      const croppedWidth = maxX - minX;
      const croppedHeight = maxY - minY;

      // Create new canvas with cropped dimensions
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = croppedWidth;
      croppedCanvas.height = croppedHeight;
      const croppedContext = croppedCanvas.getContext("2d");

      if (!croppedContext) return undefined;

      // Draw cropped portion
      croppedContext.drawImage(
        canvas,
        minX,
        minY,
        croppedWidth,
        croppedHeight,
        0,
        0,
        croppedWidth,
        croppedHeight,
      );

      return croppedCanvas.toDataURL("image/png");
    },
    [],
  );

  useEffect(() => {
    const handlePadEnd = () => {
      const pad = padRef.current;
      const canvas = canvasRef.current;
      if (!pad || !canvas) return;

      if (pad.isEmpty()) {
        currentValueRef.current = undefined;
        onChange(undefined);
        return;
      }

      // Use auto-crop or regular export
      const dataUrl = autoCrop
        ? cropSignature(canvas)
        : pad.toDataURL("image/png");

      currentValueRef.current = dataUrl;
      onChange(dataUrl);
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const options: SignaturePadOptions = {
      penColor,
    };
    if (backgroundColor) {
      options.backgroundColor = backgroundColor;
    }

    padRef.current = new SignaturePad(canvas, options);
    if (padRef.current) {
      (padRef.current as SignaturePad & { onEnd?: () => void }).onEnd =
        handlePadEnd;
    }
    onReady?.(padRef.current);

    resizeCanvas();

    const handleResize = () => {
      if (responsive) {
        setDimensions(getResponsiveDimensions());
      }
      resizeCanvas();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      padRef.current?.off();
      padRef.current?.clear();
      if (padRef.current) {
        (padRef.current as SignaturePad & { onEnd?: () => void }).onEnd =
          undefined;
      }
      onReady?.(null);
      padRef.current = null;
    };
  }, [
    penColor,
    backgroundColor,
    onChange,
    resizeCanvas,
    onReady,
    getResponsiveDimensions,
    responsive,
    autoCrop,
    cropSignature,
  ]);

  useEffect(() => {
    if (value === currentValueRef.current) return;
    currentValueRef.current = value;

    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { width: w, height: h } = responsive ? dimensions : { width, height };

    pad.clear();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, w, h);

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, w, h);
    }

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, w, h);
      };
      image.src = value;
    }
  }, [value, backgroundColor, width, height, responsive, dimensions]);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    currentValueRef.current = undefined;
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-3 w-full">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white inline-block">
        <canvas ref={canvasRef} className="touch-none" />
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors active:bg-red-200 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Clear Signature
        </button>
        {currentValueRef.current && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
