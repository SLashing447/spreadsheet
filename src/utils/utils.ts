import { get } from "svelte/store";
import {
  FileHeaders,
  hasIndex,
  isDarkTheme,
  lastSaved,
  SIGN,
  type WrapperCommands,
} from "./values";
import { getDbItem, setDbItem } from "./db";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export function getFilteredData(
  hasIndexing: boolean = false
): string[][] | undefined {
  console.log("i am here and hasIndexing is : ", hasIndexing);

  const grid = document.getElementById("grid-main") as HTMLElement | null;
  if (!grid) return;

  let cells = grid.querySelectorAll(":scope > .cell");

  let current_row = 0;
  let row_data: string[] = [];
  const res: string[][] = [];
  let biggest_row_size = -1;

  for (let k = 0; k < cells.length; k++) {
    const cell = cells[k];
    // if()
    let row = Number(cell.getAttribute("data-row"));

    if (row > current_row) {
      let trmd = trimRightEmpty(row_data);
      row_data = [];
      if (trmd.length > biggest_row_size) biggest_row_size = trmd.length;

      res.push(trmd);

      current_row++;
    }
    row_data.push(cell.innerHTML);
  }

  const out = trimRightEmptyArrays(res);

  // compensate for same size
  for (let i = 0; i < out.length; i++) {
    let len = biggest_row_size - out[i].length;
    if (hasIndexing) {
      let cell = document.getElementById(`idx-${i}`);
      if (cell) {
        out[i].unshift(cell.innerHTML);
      }
    }
    for (let k = 0; k < len; k++) {
      out[i].push("");
    }
  }

  console.log(out);

  return out;
}
function trimRightEmptyArrays<T>(arr: T[][]): T[][] {
  let lastNonEmpty = arr.length - 1;
  while (lastNonEmpty >= 0 && arr[lastNonEmpty].length === 0) {
    lastNonEmpty--;
  }
  return arr.slice(0, lastNonEmpty + 1);
}

function trimRightEmpty(arr: string[]): string[] {
  let lastNonEmpty = arr.length - 1;
  while (lastNonEmpty >= 0 && arr[lastNonEmpty].trim() === "") {
    lastNonEmpty--;
  }
  return arr.slice(0, lastNonEmpty + 1);
}

export function getCellElement(
  row: number,
  col: number
): HTMLDivElement | null {
  // Only data cells should use this id pattern
  const el = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  return el as HTMLDivElement | null;
}

export function toggleTheme(to?: string | null, isTemp?: boolean) {
  if (typeof to === "string") {
    if (to !== "d" && to !== "l") {
      console.error("Invalid to");
      return;
    }
  }
  let isDark = true;
  let thState = get(isDarkTheme);
  if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", thState ? "d" : "l");
  }
  if (to) {
    isDark = to === "d";
  } else {
    isDark = !thState;
  }

  const root = document.documentElement;

  if (isDark) {
    root.style.setProperty("--bg", "rgb(20, 13, 30)");
    root.style.setProperty("--color", "lightgrey");
    if (!isTemp) localStorage.setItem("theme", "d");
  } else {
    root.style.setProperty("--bg", "white");
    root.style.setProperty("--color", "black");
    if (!isTemp) localStorage.setItem("theme", "l");
  }

  isDarkTheme.set(isDark);
}

export function formatTimestamp(ts: number | undefined | null): string {
  if (!ts) return "error";
  const date = new Date(ts);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert 0 → 12 for midnight

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}

export function toggleWrapper(
  el: HTMLElement,
  name: WrapperCommands,
  always?: boolean
) {
  const tag = name.trim().toLowerCase();
  if (!tag) return;

  const first = el.firstChild;

  // Always: unconditionally wrap the immediate child
  if (always) {
    if (!first) return;
    const wrapper = document.createElement(tag);
    el.insertBefore(wrapper, first);
    wrapper.appendChild(first);
    return;
  }

  // Toggle: if any descendant <name> exists, unwrap all of them
  const matches = el.querySelectorAll(tag);
  if (matches.length > 0) {
    Array.from(matches)
      .reverse()
      .forEach((node) => {
        const parent = node.parentNode;
        if (!parent) return;

        // Move children out before the node
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }

        // Remove the now-empty wrapper
        parent.removeChild(node);
      });

    // Merge adjacent text nodes created during unwrapping
    el.normalize();
    return;
  }

  // Otherwise, wrap the immediate child
  if (!first) return;
  const wrapper = document.createElement(tag);
  el.insertBefore(wrapper, first);
  wrapper.appendChild(first);
}

export function createMd(): string[] {
  const timestamp = Date.now().toString();
  const fileHeaders = get(FileHeaders);

  if (fileHeaders.length === 0) {
    return [SIGN, "", "", "", timestamp];
  }

  // Use spread to include all file headers
  return [SIGN, ...fileHeaders, timestamp];
}

export function saveGridInDb(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const time = Date.now();

      const filtered = getFilteredData(get(hasIndex));
      const md = createMd();

      if (filtered) {
        if (filtered.length !== 0) {
          filtered.unshift(md);

          await setDbItem("saved-data", filtered);
          await setDbItem("ls", time);
          lastSaved.set(time);
        } else {
          reject();
        }
      } else {
        reject();
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
export function loadGridFromDb(): Promise<[string[][], number]> {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await getDbItem("saved-data");
      const ls = (await getDbItem("ls")) as number;
      if (data && ls) {
        resolve([data as string[][], ls]);
      } else {
        reject("No data in db");
      }
    } catch (e) {
      reject(e);
    }
  });
}

export async function saveCSV(csv: string, fileName = "bill.csv") {
  const chosen = await save({
    title: "Save CSV file",
    filters: [{ name: "CSV", extensions: ["csv"] }],
    defaultPath: fileName,
  });
  if (!chosen) return;

  const path = chosen.endsWith(".csv") ? chosen : `${chosen}.csv`;
  await writeTextFile(path, csv); // path is auto-scoped by dialog.save
}

export function cellsToFillScreen(
  cellWidth: number = 80,
  cellHeight: number = 38
): number[] {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const cellsPerRow = Math.floor(screenWidth / cellWidth);
  const cellsPerCol = Math.floor(screenHeight / cellHeight);

  return [cellsPerRow, cellsPerCol-3];
}
