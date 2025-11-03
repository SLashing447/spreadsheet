import { getCellElement } from "./utils";

/**
 * Convert a cell's HTML to separate lines.
 * - Treat <br> and common block closers as newline boundaries
 * - Strip residual tags
 * - Trim and drop empty lines
 */
function htmlToLines(text: string): string[] {
  const html = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|h[1-6]|tr|td|th)>/gi, "\n")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "");
  return html
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function exBlockSel(
  a: [number, number] | string, // e.g. "3-2"
  b: [number, number] | string // e.g. "7-2"
): string[][][] | undefined {
  // Parse string form into tuple
  function parse(pos: [number, number] | string): [number, number] {
    if (typeof pos === "string") {
      const [x, y] = pos.split("-").map(Number);
      return [x, y];
    }
    return pos;
  }

  const _a = parse(a);
  const _b = parse(b);

  // Must be on the same "row" (or whatever your second index means)
  if (_a[1] !== _b[1]) return;

  const start = Math.min(_a[0], _b[0]);
  const end = Math.max(_a[0], _b[0]);
  const y = _a[1];
  const res = [];

  for (let i = start; i <= end; i++) {
    let data = [];
    console.log(i - 1, y - 1);
    const cell = getCellElement(i - 1, y - 1);
    if (!cell) continue; // skip instead of returning undefined for the whole thing

    const html = cell.innerHTML ?? "";
    const txt = htmlToLines(html);
    data.push(txt);
    res.push(data);
  }

  return res;
}
