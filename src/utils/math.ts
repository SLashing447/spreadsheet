export function sum2DLines(cells: string[][][]): number {
  let total = 0;
  const numRE = /-?\d+(?:\.\d+)?/g;

  for (const row of cells) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (!Array.isArray(cell)) continue;
      for (const line of cell) {
        if (typeof line !== "string") continue;
        const matches = line.match(numRE);
        if (!matches) continue;
        for (const m of matches) {
          const n = Number(m);
          if (Number.isFinite(n)) total += n;
        }
      }
    }
  }
  return total;
}
