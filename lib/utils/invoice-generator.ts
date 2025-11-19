"use client";

import html2canvas from "html2canvas";
import { Invoice, StoreSettings } from "../types";
import { sanitizeFilename } from "../utils";

export async function generateJPEGFromInvoice(
  invoice: Invoice,
  // storeSettings is kept as parameter for future use if needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _storeSettings: StoreSettings | null,
): Promise<void> {
  try {
    console.log("📸 Generating JPEG for invoice");

    // Get the invoice content element
    const element = document.getElementById("invoice-content");
    if (!element) {
      throw new Error("Invoice content element not found");
    }

    // Wait a bit for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capture the element as canvas with optimized settings for smaller file size
    const canvas = await html2canvas(element, {
      scale: 1, // Reduced from 2 to 1 for smaller file size
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

    // Convert to JPEG blob with optimized compression
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error("Failed to create JPEG blob");
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Sanitize customer name to prevent path traversal and special character injection
        const sanitizedCustomerName = sanitizeFilename(invoice.customer.name || "Customer");
        const dateStr = new Date(invoice.invoiceDate)
          .toLocaleDateString("id-ID")
          .replace(/\//g, "");
        const filename = `Invoice_${sanitizedCustomerName}_${dateStr}.jpg`;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(
          `✅ JPEG generated and downloaded successfully (${(blob.size / 1024).toFixed(1)}KB)`,
        );
      },
      "image/jpeg",
      0.8,
    ); // Quality set to 0.8 for smaller file size (reduced from 0.95)
  } catch (error) {
    console.error("❌ JPEG generation error:", error);
    throw error;
  }
}
