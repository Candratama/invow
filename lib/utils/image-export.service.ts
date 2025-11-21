"use client";

import html2canvas from "html2canvas";

/**
 * Image Export Service
 * Handles exporting HTML elements as JPEG images with quality-based compression
 */

export interface ExportOptions {
  qualityLimitKB: 50 | 100 | 150;
}

export class ImageExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageExportError";
  }
}

/**
 * Export an HTML element as a JPEG image with iterative compression
 * to meet the specified quality limit
 * 
 * @param element - The HTML element to export
 * @param qualityLimitKB - Target file size limit in KB (50, 100, or 150)
 * @returns Promise<Blob> - The compressed JPEG image as a Blob
 * @throws ImageExportError if element is not found or compression fails
 */
export async function exportAsJPEG(
  element: HTMLElement,
  qualityLimitKB: 50 | 100 | 150
): Promise<Blob> {
  if (!element) {
    throw new ImageExportError("Element not found");
  }

  try {
    // Wait for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Convert HTML element to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Compress to target size
    const compressedBlob = await compressToSize(canvas, qualityLimitKB);

    return compressedBlob;
  } catch (error) {
    if (error instanceof ImageExportError) {
      throw error;
    }
    throw new ImageExportError(
      `Failed to export image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Compress a canvas to a target file size using iterative quality reduction
 * 
 * @param canvas - The canvas to compress
 * @param targetSizeKB - Target file size in KB
 * @returns Promise<Blob> - The compressed image as a Blob
 * @throws ImageExportError if compression times out or fails
 */
async function compressToSize(
  canvas: HTMLCanvasElement,
  targetSizeKB: number
): Promise<Blob> {
  const targetSizeBytes = targetSizeKB * 1024;
  const startTime = Date.now();
  const TIMEOUT_MS = 10000; // 10 seconds
  const MIN_QUALITY = 0.10; // Minimum quality 10% for more aggressive compression
  const QUALITY_STEP = 0.05;

  let quality = 0.95;
  let bestBlob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
    // Check for timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new ImageExportError(
        "Compression timeout: Could not compress image to target size within 10 seconds"
      );
    }

    // Convert canvas to blob with current quality, with timeout
    const blob = await Promise.race([
      new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (result) => resolve(result),
          "image/jpeg",
          quality
        );
      }),
      new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new ImageExportError("Blob creation timeout"));
        }, TIMEOUT_MS);
      }),
    ]);

    if (!blob) {
      throw new ImageExportError("Failed to create image blob");
    }

    bestBlob = blob;

    // Check if we've reached the target size
    if (blob.size <= targetSizeBytes) {
      return blob;
    }

    // Reduce quality and try again
    quality -= QUALITY_STEP;
  }

  // If we couldn't reach the target size, return the best effort
  if (bestBlob) {
    console.warn(
      `Could not compress image to ${targetSizeKB}KB. ` +
      `Best effort: ${(bestBlob.size / 1024).toFixed(1)}KB at quality ${MIN_QUALITY}`
    );
    return bestBlob;
  }

  throw new ImageExportError("Failed to compress image");
}
