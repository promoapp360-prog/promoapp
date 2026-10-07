export const legacyServiceCodes: Record<string, string> = {
  generale: "general", "siti-web": "website_399", "menu-digitali": "menu_qr_99", "web-app": "webapp_custom",
};

/** Italian local numbers default to +39; explicit foreign prefixes are preserved. */
export function normalizeWhatsApp(value: string): string | null {
  const raw = value.trim();
  if (!/^\+?[\d\s().-]{6,30}$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  else if (!raw.startsWith("+") && !(digits.startsWith("39") && digits.length >= 11)) {
    if (!/^[03]\d{5,10}$/.test(digits)) return null;
    digits = `39${digits}`;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}
