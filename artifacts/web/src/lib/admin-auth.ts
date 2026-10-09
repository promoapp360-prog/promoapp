// Encoding is not encryption: credentials must still travel over HTTPS.
// ASCII header transport preserves Unicode passwords across HTTP proxies.
export function adminHeaders(password: string): Record<string, string> {
  const bytes = new TextEncoder().encode(password.trim());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { "x-admin-credential": btoa(binary) };
}
