/**
 * WhatsApp phone formatting and universal link generation utility
 * Specifically tailored for Brazilian numbers (with DDD) and international standards.
 */

/**
 * Strips all non-digit characters and standardizes Brazilian phone numbers
 * Handles:
 * - Leading 55 (e.g. 5564999999999 -> 64999999999)
 * - Leading 0 in DDD (e.g. 064999999999 -> 64999999999)
 * - 10-digit mobile numbers missing the 9th digit (e.g. 6488887777 -> 64988887777)
 * - Standard 11-digit mobile numbers (e.g. 64999998888)
 */
export function normalizeWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/\D/g, '');

  // 1. Remove leading zeros (e.g. 064999999999 -> 64999999999)
  digits = digits.replace(/^0+/, '');

  // 2. If already starts with country code 55 and has 12 or 13 digits, extract national number
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  // 3. If user entered 10 digits (DDD + 8 digits), mobile WhatsApp in Brazil requires 9 digits
  // Mobile numbers usually start with 6, 7, 8 or 9
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const firstDigit = digits.charAt(2);
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      digits = `${ddd}9${digits.slice(2)}`;
    }
  }

  return digits;
}

/**
 * Formats a phone number for user-friendly display in UI
 * e.g. (64) 99999-8888
 */
export function formatWhatsAppForDisplay(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const digits = normalizeWhatsAppNumber(rawPhone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return rawPhone;
}

/**
 * Builds the official, 100% compliant WhatsApp universal URL (wa.me)
 * Guarantees country code 55 + national number with no double prefix or invalid zeros.
 */
export function buildWhatsAppUrl(rawPhone?: string | null, message?: string): string {
  const normalized = normalizeWhatsAppNumber(rawPhone);
  if (!normalized || normalized.length < 8) {
    return '#';
  }

  const fullNumber = `55${normalized}`;
  const query = message && message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${fullNumber}${query}`;
}
