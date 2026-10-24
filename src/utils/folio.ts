// Display aliases only. Never use these as database IDs, idempotency keys or access tokens.
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function encode(hex: string, length: number) {
  let value = BigInt(`0x${hex}`), result = '';
  for (let i = 0; i < length; i++) { result = alphabet[Number(value & 31n)] + result; value >>= 5n; }
  return result;
}
export function visibleFolio(folio: string): string {
  const quote = /^CO-(\d{2})(\d{6})-([A-F0-9]{32})$/i.exec(folio);
  if (quote) return `CO-${quote[2]}-${encode(quote[3].slice(0, 12), 10)}`;
  const event = /^EV-([A-F0-9]{16})$/i.exec(folio);
  return event ? `EV-${encode(event[1], 13)}` : folio;
}
// Only a validated alias can introduce a LIKE pattern; ordinary searches stay literal.
export function folioSearchPattern(search: string): string | null {
  const match = /^CO-(\d{6})-([0-9A-HJKMNP-TV-Z]{10})$/i.exec(search);
  if (!match) return null;
  let value = 0n;
  for (const char of match[2].toUpperCase()) value = (value << 5n) + BigInt(alphabet.indexOf(char));
  if (value >= 1n << 48n) return null;
  return `CO-__${match[1]}-${value.toString(16).toUpperCase().padStart(12, '0')}%`;
}
