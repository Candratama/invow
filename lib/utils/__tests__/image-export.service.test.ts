import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { exportAsJPEG, ImageExportError } from "../image-export.service";
import html2canvas from "html2canvas";

// Feature: invoice-export-and-tax-preferences, Property 2: Image compression respects quality limit
// Validates: Requirements 1.3

// Mock html2canvas module
vi.mock("html2canvas");

describe("ImageExportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportAsJPEG", () => {
    it("should throw ImageExportError when element is null", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(exportAsJPEG(null as any, 100)).rejects.toThrow(
        ImageExportError
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(exportAsJPEG(null as any, 100)).rejects.toThrow(
        "Element not found"
      );
    });

    it("should throw ImageExportError when element is undefined", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(exportAsJPEG(undefined as any, 100)).rejects.toThrow(
        ImageExportError
      );
    });
  });

  describe("Property-Based Tests", () => {
    /**
     * Helper function to create a mock canvas with realistic blob generation
     */
    function createMockCanvas(sizeMultiplier: number = 1): HTMLCanvasElement {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;

      // Override toBlob to create realistic-sized blobs
      canvas.toBlob = function (
        callback: BlobCallback,
        type?: string,
        quality?: number
      ) {
        // Create a blob with size that varies based on quality
        // Simulate realistic JPEG compression behavior
        const baseSize = 200 * 1024 * sizeMultiplier; // Base size ~200KB
        const qualityFactor = quality || 0.92;
        const estimatedSize = Math.floor(baseSize * qualityFactor);

        // Create a buffer with the estimated size
        const buffer = new Uint8Array(estimatedSize);
        // Fill with some data to simulate JPEG content
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }

        const blob = new Blob([buffer], { type: type || "image/jpeg" });
        // Call callback immediately to simulate synchronous behavior
        setTimeout(() => callback(blob), 0);
      };

      return canvas;
    }

    /**
     * Feature: invoice-export-and-tax-preferences, Property 2: Image compression respects quality limit
     * Validates: Requirements 1.3
     * 
     * Property: For any valid export quality limit (70KB, 100KB, or 150KB),
     * the exported JPEG file size should be at or below the specified limit.
     */
    it("should compress images to respect quality limit", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(50 as const, 100 as const, 150 as const),
          async (qualityLimitKB) => {
            // Create a test element
            const testElement = document.createElement("div");
            testElement.style.width = "800px";
            testElement.style.height = "600px";
            document.body.appendChild(testElement);

            try {
              // Create a mock canvas with realistic blob generation
              const mockCanvas = createMockCanvas();

              // Mock html2canvas to return our mock canvas
              vi.mocked(html2canvas).mockResolvedValueOnce(mockCanvas);

              // Export the image
              const blob = await exportAsJPEG(testElement, qualityLimitKB);

              // Verify the blob size is at or below the limit
              const targetSizeBytes = qualityLimitKB * 1024;

              // The property: exported file size should be <= quality limit
              expect(blob.size).toBeLessThanOrEqual(targetSizeBytes);

              // Verify it's a valid JPEG blob
              expect(blob.type).toBe("image/jpeg");

              return true;
            } finally {
              // Cleanup
              if (document.body.contains(testElement)) {
                document.body.removeChild(testElement);
              }
            }
          }
        ),
        { numRuns: 100, timeout: 60000 } // Run 100 iterations as specified in design
      );
    }, 90000); // Increase timeout for property-based testing

    /**
     * Additional property test: Compression should handle various quality limits consistently
     */
    it("should produce smaller files for smaller quality limits", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            smallLimit: fc.constant(50 as const),
            largeLimit: fc.constant(150 as const),
          }),
          async ({ smallLimit, largeLimit }) => {
            const testElement = document.createElement("div");
            testElement.style.width = "800px";
            testElement.style.height = "600px";
            document.body.appendChild(testElement);

            try {
              // First export with small limit
              vi.mocked(html2canvas).mockResolvedValueOnce(createMockCanvas());
              const smallBlob = await exportAsJPEG(testElement, smallLimit as 50 | 100 | 150);
              
              // Second export with large limit
              vi.mocked(html2canvas).mockResolvedValueOnce(createMockCanvas());
              const largeBlob = await exportAsJPEG(testElement, largeLimit as 50 | 100 | 150);

              // Property: smaller limit should produce smaller or equal file size
              expect(smallBlob.size).toBeLessThanOrEqual(largeBlob.size);

              return true;
            } finally {
              if (document.body.contains(testElement)) {
                document.body.removeChild(testElement);
              }
            }
          }
        ),
        { numRuns: 50, timeout: 30000 }
      );
    }, 60000); // Increase timeout
  });

  describe("Error Handling", () => {
    it("should provide user-friendly error messages", async () => {
      const testElement = document.createElement("div");
      document.body.appendChild(testElement);

      try {
        // Mock html2canvas to throw an error
        vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Canvas error"));

        await expect(exportAsJPEG(testElement, 100)).rejects.toThrow(
          ImageExportError
        );
        
        // Reset mock for second call
        vi.mocked(html2canvas).mockRejectedValueOnce(new Error("Canvas error"));
        await expect(exportAsJPEG(testElement, 100)).rejects.toThrow(
          /Failed to export image/
        );
      } finally {
        if (document.body.contains(testElement)) {
          document.body.removeChild(testElement);
        }
      }
    });

    it("should handle blob creation failure", async () => {
      const testElement = document.createElement("div");
      document.body.appendChild(testElement);

      try {
        // Create a canvas that returns null blob
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;

        // Mock toBlob to return null
        canvas.toBlob = function (
          callback: BlobCallback
        ) {
          setTimeout(() => callback(null), 0);
        };

        vi.mocked(html2canvas).mockResolvedValueOnce(canvas);

        // This should throw an error about blob creation failure
        await expect(exportAsJPEG(testElement, 100)).rejects.toThrow(
          ImageExportError
        );
        
        // Reset mock for second call
        vi.mocked(html2canvas).mockResolvedValueOnce(canvas);
        await expect(exportAsJPEG(testElement, 100)).rejects.toThrow(
          /Failed to create image blob/
        );
      } finally {
        if (document.body.contains(testElement)) {
          document.body.removeChild(testElement);
        }
      }
    });
  });
});
