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

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

export function detectDelimiter(input: string): "," | ";" | "\t" {
  // Sniff first non-empty line; pick the candidate with the most occurrences (outside quotes)
  const sample = stripBom(input).split(/\r?\n/).find((l) => l.trim()) ?? "";
  const count = (delim: string): number => {
    let n = 0;
    let inQ = false;
    for (let i = 0; i < sample.length; i++) {
      const ch = sample[i];
      if (ch === '"') {
        if (inQ && sample[i + 1] === '"') {
          i++;
          continue;
        }
        inQ = !inQ;
      } else if (!inQ && ch === delim) n++;
    }
    return n;
  };
  const c = count(",");
  const s = count(";");
  const t = count("\t");
  if (s > c && s >= t) return ";";
  if (t > c && t > s) return "\t";
  return ",";
}

export function parseCsv(
  input: string,
  options?: { delimiter?: "," | ";" | "\t" },
): { headers: string[]; rows: string[][]; delimiter: "," | ";" | "\t" } {
  const stripped = stripBom(input);
  if (!stripped.trim()) return { headers: [], rows: [], delimiter: options?.delimiter ?? "," };
  const delimiter = options?.delimiter ?? detectDelimiter(stripped);
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inQ) {
      if (ch === '"') {
        if (stripped[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === delimiter) {
        row.push(cur);
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && stripped[i + 1] === "\n") i++;
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
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === "")) rows.pop();
  return { headers, rows, delimiter };
}
