const PHONE_DIGITS_REQUIRED = 10;
const INDIAN_PHONE_RE = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_DIGITS_REQUIRED);
}

export function validateIndianPhone(value: string): string | undefined {
  const normalized = normalizeIndianPhone(value);

  if (!normalized) {
    return "Phone number is required";
  }

  if (!INDIAN_PHONE_RE.test(normalized)) {
    return "Enter a valid 10-digit Indian mobile number";
  }

  return undefined;
}

export function isIndianPhoneValid(value?: string): boolean {
  if (!value) return false;
  return INDIAN_PHONE_RE.test(normalizeIndianPhone(value));
}
