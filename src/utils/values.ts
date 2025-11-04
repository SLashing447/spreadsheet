import { writable } from "svelte/store";

export const SIGN = "@_____CSV_____CSV_____BILL/233fjkπ∑☕welfjAPPP";

export const hasIndex = writable<boolean>(false);
export const previewMode = writable<boolean>(false);
export const isDarkTheme = writable<boolean>(true);
export const FileHeaders = writable<string[]>(["", "", ""]);
export const lastSaved = writable<number | null>(null);
export const msg = writable<string | null>(null);

export type WrapperCommands = "b" | "u" | "i" | "he" | "ce";
