/** Convert an array of objects to a CSV string. */
export function toCSV(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const headerRow = headers.map(h => escape(h.label)).join(",");
  const dataRows  = rows.map(r => headers.map(h => escape(r[h.key])).join(","));
  return [headerRow, ...dataRows].join("\r\n");
}

/** Return a Next.js Response with CSV content and download headers. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
