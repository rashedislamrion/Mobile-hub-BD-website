/**
 * Client-side CSV generator and download utility.
 * Generates properly formatted, comma-separated, quoted CSV files compatible with
 * Microsoft Excel, Google Sheets, LibreOffice, and Apple Numbers.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
) {
  if (!rows || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];

  // Add Headers
  csvRows.push(headers.map(escapeCell).join(","));

  // Add Data Rows
  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(","));
  }

  const csvString = csvRows.join("\r\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", safeFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
