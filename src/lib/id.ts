export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${random}`;
}
