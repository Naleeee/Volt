// RFC 4180: quote a field holding a comma, quote or line break, doubling embedded quotes.
function field(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: unknown[][]) {
  return (
    [header, ...rows].map((row) => row.map(field).join(",")).join("\r\n") +
    "\r\n"
  );
}
