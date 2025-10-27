/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param filename The name of the file to download.
 * @param data The array of objects to export.
 * @param headers An array of keys to include as columns in the CSV.
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  data: T[],
  headers: (keyof T)[]
): void {
  if (data.length === 0) {
    alert("No data to export.");
    return;
  }

  const replacer = (key: string, value: any): string => (value === null || value === undefined ? '' : String(value));

  const csv = [
    headers.join(','), // header row
    ...data.map(row =>
      headers
        .map(fieldName => JSON.stringify(row[fieldName], replacer))
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
