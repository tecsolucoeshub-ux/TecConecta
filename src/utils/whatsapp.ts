/**
 * WhatsApp phone formatting and universal link generation utility
 * Specifically tailored for Brazilian numbers (with DDD) and international standards.
 */

// List of all valid Brazilian area codes (DDDs)
export const VALID_BRAZILIAN_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
  '21', '22', '24', // RJ
  '27', '28', // ES
  '31', '32', '33', '34', '35', '37', '38', // MG
  '41', '42', '43', '44', '45', '46', // PR
  '47', '48', '49', // SC
  '51', '53', '54', '55', // RS
  '61', // DF
  '62', '64', // GO
  '63', // TO
  '65', '66', // MT
  '67', // MS
  '68', // AC
  '69', // RO
  '71', '73', '74', '75', '77', // BA
  '79', // SE
  '81', '87', // PE
  '82', // AL
  '83', // PB
  '84', // RN
  '85', '88', // CE
  '86', '89', // PI
  '91', '93', '94', // PA
  '92', '97', // AM
  '95', // RR
  '96', // AP
  '98', '99', // MA
]);

/**
 * Strips all non-digit characters and standardizes Brazilian phone numbers
 * Handles:
 * - Leading 55 (e.g. 5564999317499 -> 64999317499)
 * - Leading 0 in DDD (e.g. 064999317499 -> 64999317499)
 * - 10-digit mobile numbers missing the 9th digit (e.g. 6499317499 -> 64999317499)
 * - Standard 11-digit mobile numbers (e.g. 64999317499)
 */
export function normalizeWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/\D/g, '');

  // 1. Remove leading zeros (e.g. 064999317499 -> 64999317499)
  digits = digits.replace(/^0+/, '');

  // 2. If already starts with country code 55 and has 12 or 13 digits, extract national number
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  // 3. If user entered 10 digits (DDD + 8 digits), mobile WhatsApp in Brazil requires 9 digits
  // Mobile numbers in Brazil start with 6, 7, 8 or 9 (add the 9 if missing)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const firstDigit = digits.charAt(2);
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      digits = `${ddd}9${digits.slice(2)}`;
    }
  }

  return digits;
}

export interface WhatsAppValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  error?: string;
  isMobile: boolean;
  ddd?: string;
}

/**
 * Strictly validates a WhatsApp number for new and existing advertisers.
 * Ensures:
 * 1. Valid Brazilian DDD (11-99)
 * 2. Proper length (10 digits for business landline, 11 digits for mobile)
 * 3. 9th digit presence for mobile (3rd digit must be 9)
 * 4. Not an invalid repeated sequence (e.g., 99999999999, 00000000000)
 */
export function validateWhatsAppNumber(rawPhone?: string | null): WhatsAppValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: 'Informe o número do WhatsApp com DDD.',
      isMobile: false
    };
  }

  const normalized = normalizeWhatsAppNumber(rawPhone);

  // Must have at least 10 digits (DDD + 8) or 11 digits (DDD + 9 + 8)
  if (normalized.length < 10) {
    return {
      isValid: false,
      normalized,
      formatted: formatWhatsAppForDisplay(normalized),
      error: 'Número incompleto. Digite o DDD + número (ex: (64) 99931-7499).',
      isMobile: false
    };
  }

  if (normalized.length > 11) {
    return {
      isValid: false,
      normalized,
      formatted: formatWhatsAppForDisplay(normalized),
      error: 'Número muito longo. Digite apenas o DDD + celular com 11 dígitos.',
      isMobile: false
    };
  }

  const ddd = normalized.slice(0, 2);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
    return {
      isValid: false,
      normalized,
      formatted: formatWhatsAppForDisplay(normalized),
      error: `DDD "${ddd}" não é reconhecido no Brasil. Informe um DDD válido (ex: 64, 62, 11, 21).`,
      isMobile: false,
      ddd
    };
  }

  // Check if all digits are the same (dummy or test number)
  const isAllSameDigits = /^(\d)\1+$/.test(normalized);
  if (isAllSameDigits) {
    return {
      isValid: false,
      normalized,
      formatted: formatWhatsAppForDisplay(normalized),
      error: 'Número inválido com dígitos repetidos. Digite um número de WhatsApp real.',
      isMobile: false,
      ddd
    };
  }

  // 11 digits -> Brazilian mobile phone (must start with 9 after DDD)
  if (normalized.length === 11) {
    const ninthDigit = normalized.charAt(2);
    if (ninthDigit !== '9') {
      return {
        isValid: false,
        normalized,
        formatted: formatWhatsAppForDisplay(normalized),
        error: 'Celulares no Brasil devem ter o dígito 9 após o DDD (ex: (64) 9XXXX-XXXX).',
        isMobile: true,
        ddd
      };
    }
    return {
      isValid: true,
      normalized,
      formatted: formatWhatsAppForDisplay(normalized),
      isMobile: true,
      ddd
    };
  }

  // 10 digits -> Brazilian landline / WhatsApp Business
  return {
    isValid: true,
    normalized,
    formatted: formatWhatsAppForDisplay(normalized),
    isMobile: false,
    ddd
  };
}

/**
 * Formats a phone number for user-friendly display in UI
 * e.g. (64) 99931-7499
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
  if (!normalized || normalized.length < 10) {
    return '#';
  }

  const fullNumber = `55${normalized}`;
  const query = message && message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${fullNumber}${query}`;
}

