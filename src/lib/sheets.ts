/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface SheetsPayload {
  full_name?: string;
  email: string;
  whatsapp?: string;
  goal?: string;
  support_level?: string;
  referred_by?: string;
  sheet?: 'partial';
  source?: string;
  status?: string;
}

/**
 * Sends applicant data to the configured Google Sheets webhook.
 * Uses 'text/plain' Content-Type to satisfy 'no-cors' requirements.
 */
export async function sendToGoogleSheets(payload: SheetsPayload) {
  const webhookUrl = import.meta.env.VITE_SHEETS_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbzerl5IC56jzv68c2QJIIXaYxXlmA5obP_FTQE0eUIGJmSyYN-BrUXiUAgtZ-e8ddfW5A/exec";
  
  if (!webhookUrl) {
    console.warn("VITE_SHEETS_WEBHOOK_URL is not set. Skipping Sheets sync.");
    return;
  }

  try {
    // We use no-cors + text/plain to avoid preflight issues with Google Apps Script
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error sending data to Google Sheets:", error);
    // Non-blocking error
  }
}
