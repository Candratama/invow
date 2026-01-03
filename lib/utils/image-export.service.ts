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

    // Ensure document fonts are loaded
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Convert HTML element to canvas with optimized settings
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced from 2 to 1.5 for faster rendering (still good quality)
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure fonts are loaded in cloned document
        const clonedElement = clonedDoc.getElementById("invoice-content");
        if (clonedElement) {
          // Force font rendering by setting font-related properties
          (clonedElement as HTMLElement).style.setProperty('font-display', 'block');

          // Fix spacing issues in html2canvas by ensuring proper word/letter spacing
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            // Ensure normal word spacing is preserved
            if (!htmlEl.style.wordSpacing) {
              htmlEl.style.wordSpacing = 'normal';
            }
            if (!htmlEl.style.letterSpacing) {
              htmlEl.style.letterSpacing = 'normal';
            }
            // Preserve whitespace
            if (!htmlEl.style.whiteSpace) {
              htmlEl.style.whiteSpace = 'pre-wrap';
            }
          });
        }
      },
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
  const TIMEOUT_MS = 8000; // Reduced to 8 seconds
  const MIN_QUALITY = 0.15; // Increased minimum quality for faster convergence
  const QUALITY_STEP = 0.08; // Larger steps for faster convergence

  // Start with a smarter initial quality based on target size
  let quality = targetSizeKB >= 150 ? 0.92 : targetSizeKB >= 100 ? 0.85 : 0.75;
  let bestBlob: Blob | null = null;

  while (quality >= MIN_QUALITY) {
    // Check for timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new ImageExportError(
        "Compression timeout: Could not compress image to target size within 8 seconds"
      );
    }

    // Convert canvas to blob with current quality
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (result) => resolve(result),
        "image/jpeg",
        quality
      );
    });

    if (!blob) {
      throw new ImageExportError("Failed to create image blob");
    }

    bestBlob = blob;

    // Check if we've reached the target size
    if (blob.size <= targetSizeBytes) {
      return blob;
    }

    // Adaptive quality reduction based on how far we are from target
    const ratio = blob.size / targetSizeBytes;
    if (ratio > 1.5) {
      quality -= QUALITY_STEP * 1.5; // Faster reduction if way over
    } else {
      quality -= QUALITY_STEP;
    }
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
