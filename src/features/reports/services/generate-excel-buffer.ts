import type { ExportColumn } from "../types";

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function generateExcelBuffer<T>({
  columns,
  rows,
}: {
  columns: ExportColumn<T>[];
  rows: T[];
}): Buffer {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(";");
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.value(row))).join(";"),
  );

  return Buffer.from(`\ufeff${[header, ...body].join("\r\n")}`, "utf8");
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
