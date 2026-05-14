const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;

/** "DD/MM/YYYY" → "YYYY-MM-DD" (for API) */
export function toApiDate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

/** "HH:MM" → "HH:MM:00" (for API) */
export function toApiTime(hhmm: string): string {
  if (!hhmm) return "";
  return `${hhmm}:00`;
}

/** ISO/date string → "14 Mei 2026" */
export function fromApiDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const ymd = iso.substring(0, 10);
  const [yyyy, mm, dd] = ymd.split("-");
  const monthIndex = parseInt(mm, 10) - 1;
  return `${parseInt(dd, 10)} ${MONTHS_ID[monthIndex] ?? ""} ${yyyy}`;
}

/** "HH:MM:SS" → "HH:MM" */
export function fromApiTime(hms: string | null | undefined): string {
  if (!hms) return "";
  return hms.substring(0, 5);
}
