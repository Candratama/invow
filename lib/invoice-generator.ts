"use client";

import html2canvas from "html2canvas";
import { Invoice, StoreSettings } from "./types";

export async function generateJPEGFromInvoice(
  invoice: Invoice,
  // storeSettings is kept as parameter for future use if needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _storeSettings: StoreSettings | null,
): Promise<void> {
  try {
    console.log("📸 Generating JPEG for invoice:", invoice.invoiceNumber);

    // Get the invoice content element
    const element = document.getElementById("invoice-content");
    if (!element) {
      throw new Error("Invoice content element not found");
    }

    // Wait a bit for fonts and images to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capture the element as canvas with optimized settings
    const canvas = await html2canvas(element, {
      scale: 2, // Good balance between quality and performance
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

    // Convert to JPEG blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error("Failed to create JPEG blob");
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const filename = `Invoice_${invoice.customer.name.replace(/\s+/g, "_")}_${new Date(invoice.invoiceDate).toLocaleDateString("id-ID").replace(/\//g, "")}.jpg`;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("✅ JPEG generated and downloaded successfully");
      },
      "image/jpeg",
      0.95,
    ); // 95% quality
  } catch (error) {
    console.error("❌ JPEG generation error:", error);
    throw error;
  }
}
