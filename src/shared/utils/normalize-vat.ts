export function normalizeVat(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}
