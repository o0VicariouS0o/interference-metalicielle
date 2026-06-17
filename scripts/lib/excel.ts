import ExcelJS from 'exceljs';

export type Row = Record<string, unknown>;

function flattenCell(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v !== 'object') return v;
  const o = v as Record<string, unknown>;
  if ('hyperlink' in o) return o.hyperlink ?? o.text ?? null;
  if ('result'    in o) return flattenCell(o.result);
  if ('richText'  in o && Array.isArray(o.richText)) {
    return (o.richText as Array<{ text?: string }>).map(r => r.text ?? '').join('');
  }
  if ('text' in o) return o.text;
  return String(v);
}

export async function readWorkbook(filePath: string): Promise<Map<string, Row[]>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const result = new Map<string, Row[]>();

  wb.eachSheet(sheet => {
    const rows: Row[] = [];
    let headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      const values = row.values as unknown[]; // index 0 vide (1-indexed)
      if (rowNumber === 1) {
        headers = values.slice(1).map(v => String(v ?? '').trim());
      } else {
        const obj: Row = {};
        headers.forEach((h, i) => {
          if (h) obj[h] = flattenCell(values[i + 1]);
        });
        // ignorer lignes entièrement vides
        if (Object.values(obj).some(v => v !== null && v !== '')) {
          rows.push(obj);
        }
      }
    });

    result.set(sheet.name, rows);
  });

  return result;
}