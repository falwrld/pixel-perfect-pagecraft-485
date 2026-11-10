const TZ = "America/Sao_Paulo";

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;
}

/** Converte "dd/mm/aaaa hh:mm:ss" em timestamp para ordenação. */
export function parseBrt(s: string): number {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return 0;
  return Date.UTC(+m[3]!, +m[2]! - 1, +m[1]!, +m[4]!, +m[5]!, +(m[6] ?? 0));
}

export function minutosDesde(iso: string | null, agora = Date.now()): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000));
}
