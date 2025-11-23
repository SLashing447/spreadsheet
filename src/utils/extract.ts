import { getCellElement } from "./utils";


export function exBlockSel(
  a: string, // e.g. "3-2"
  b: string // e.g. "7-2"
): string[][][] | undefined {
  const _r = [Number(a.split("-")[0]) - 1, Number(b.split("-")[0]) - 1];
  const _c = [Number(a.split("-")[1]) - 1, Number(b.split("-")[1]) - 1];
  const res: string[][][] = [];

  // for column
  for (let j = 0; j <= Math.abs(_c[0] - _c[1]); j++) {
    const rows: string[][] = [];
    // for rows
    for (let i = 0; i <= Math.abs(_r[0] - _r[1]); i++) {
      const row = _r[0] + i;
      const col = _c[0] + j;

      const cell = getCellElement(row, col);
      const raw = cell?.innerHTML;
      if (!raw) continue;

      const parts: string[] = raw
        .split(/<br\s*\/?>/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      rows.push(parts);
    }
    res.push(rows);
  }


  return res;
}
