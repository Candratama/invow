"use client";

import { Invoice, StoreSettings } from "../types";
import { sanitizeFilename } from "../utils";
import { exportAsJPEG, ImageExportError } from "./image-export.service";
import { userPreferencesService } from "../db/services/user-preferences.service";

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

    // Fetch user export quality preference
    let qualityLimitKB: 50 | 100 | 150 = 100; // Default to Medium
    try {
      const { data } = await userPreferencesService.getUserPreferences();
      qualityLimitKB = data.export_quality_kb;
      console.log(`📊 Using export quality: ${qualityLimitKB}KB`);
    } catch (error) {
      console.warn("⚠️ Failed to fetch export quality preference, using default (100KB):", error);
    }

    // Export as JPEG with quality limit
    const blob = await exportAsJPEG(element, qualityLimitKB);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Sanitize customer name to prevent path traversal and special character injection
    const sanitizedCustomerName = sanitizeFilename(invoice.customer.name || "Customer");
    // Format date as DDMMYYYY for filename
    const invoiceDate = invoice.invoiceDate instanceof Date ? invoice.invoiceDate : new Date(invoice.invoiceDate);
    const day = String(invoiceDate.getDate()).padStart(2, '0');
    const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const year = invoiceDate.getFullYear();
    const dateStr = `${day}${month}${year}`;
    const filename = `Invoice_${sanitizedCustomerName}_${dateStr}.jpg`;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const fileSizeKB = (blob.size / 1024).toFixed(1);
    console.log(`✅ JPEG generated and downloaded successfully (${fileSizeKB}KB)`);
    
    // Show success message to user
    alert(`Invoice exported successfully!\nFile size: ${fileSizeKB}KB`);
  } catch (error) {
    console.error("❌ JPEG generation error:", error);
    
    // Handle export errors with user-friendly messages
    if (error instanceof ImageExportError) {
      alert(`Export failed: ${error.message}`);
    } else if (error instanceof Error) {
      alert(`Export failed: ${error.message}`);
    } else {
      alert("Export failed: An unexpected error occurred");
    }
    
    throw error;
  }
}
