export function buildSmsUrl(phoneE164: string, body: string): string {
  return `sms:${phoneE164}?body=${encodeURIComponent(body)}`;
}

export function buildTelUrl(phoneE164: string): string {
  return `tel:${phoneE164}`;
}
