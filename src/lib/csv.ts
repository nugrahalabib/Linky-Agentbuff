/**
 * Tiny RFC-4180-ish CSV parser + encoder. No external deps.
 */

export function encodeCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  if (rows.length === 0) return "";
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [cols.map(escape).join(",")];
  for (const r of rows) lines.push(cols.map((c) => escape(r[c])).join(","));
  return lines.join("\r\n");
}

export function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  if (!input.trim()) return { headers: [], rows: [] };
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQ) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && input[i + 1] === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  // Drop trailing empty rows
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === "")) rows.pop();
  return { headers, rows };
}
