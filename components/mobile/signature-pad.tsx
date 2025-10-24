"use client";

import { useCallback, useEffect, useRef } from "react";
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
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const currentValueRef = useRef<string | undefined>(value);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;

    padRef.current?.clear();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }

    if (currentValueRef.current) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
      };
      image.src = currentValueRef.current;
    }
  }, [width, height, backgroundColor]);

  useEffect(() => {
    const handlePadEnd = () => {
      const pad = padRef.current;
      if (!pad) return;
      const dataUrl = pad.isEmpty() ? undefined : pad.toDataURL("image/png");
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
      (padRef.current as any).onEnd = handlePadEnd;
    }
    onReady?.(padRef.current);

    resizeCanvas();

    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      padRef.current?.off();
      padRef.current?.clear();
      if (padRef.current) {
        (padRef.current as any).onEnd = undefined;
      }
      onReady?.(null);
      padRef.current = null;
    };
  }, [penColor, backgroundColor, onChange, resizeCanvas, onReady]);

  useEffect(() => {
    if (value === currentValueRef.current) return;
    currentValueRef.current = value;

    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    pad.clear();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
      };
      image.src = value;
    }
  }, [value, backgroundColor, width, height]);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    currentValueRef.current = undefined;
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
        <canvas ref={canvasRef} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
        >
          Clear Signature
        </button>
        {currentValueRef.current && (
          <span className="text-xs text-muted-foreground">
            Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
