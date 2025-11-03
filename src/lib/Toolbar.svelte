<script lang="ts">
  import { clearDb } from "../utils/db";
  import {
    toggleTheme,
    getFilteredData,
    formatTimestamp,
    createMd,
  } from "../utils/utils";
  import {
    hasIndex,
    isDarkTheme,
    lastSaved,
    msg,
    previewMode,
  } from "../utils/values";
  import Papa from "papaparse";

  interface props {
    loadCSVintoGrid: (data: string[][]) => void;
    clearGrid: () => void;
    cmd: (data: string) => void;
    previewGrid: () => void;
    closePreview: () => void;
  }

  let {
    loadCSVintoGrid,
    previewGrid,
    clearGrid,
    cmd,

    closePreview,
  }: props = $props();
  let fileInput: HTMLInputElement | null = $state(null);

  function exportToCSV() {
    const md = createMd();
    const filtered = getFilteredData($hasIndex);

    if (!filtered) {
      alert("Grid is empty");
      return;
    }

    filtered.unshift(md);
    const csv = Papa.unparse(filtered);

    // Create a Blob and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bill.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // downloadCsvFromCustom(filtered);
  }

  function getCSV(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => loadCSVintoGrid(results.data as string[][]),
      error: (error) => console.error("CSV parsing error:", error),
    });
  }

  function calcIndexing() {
    hasIndex.set(!$hasIndex);
  }

  function prntSetup() {
    previewGrid();

    previewMode.set(true);
  }

  function print() {
    window.print();
  }
</script>

<div class="file-controls no-print">
  {#if !$previewMode}
    <div>
      <div>
        <button onclick={() => fileInput?.click()} class="upload-btn">
          📁
        </button>

        <button onclick={exportToCSV} class="export-btn"> 💾 </button>

        <button onclick={prntSetup} class="upload-btn"> 🖨️ </button>

        <button onclick={clearGrid} class="clear-btn"> 🧹 </button>
        <input
          type="file"
          accept=".csv"
          bind:this={fileInput}
          onchange={getCSV}
          style="display: none;"
        />
      </div>
      <span></span>
      <div>
        <button onclick={() => cmd("bold")} class="B">B</button>
        <button onclick={() => cmd("italic")} class="I">I</button>
        <button onclick={() => cmd("underline")} class="U">U</button>
      </div>
      <span></span>
      <div>
        <button onclick={calcIndexing}>
          {#if $hasIndex}
            Indexing:ON
          {:else}
            Indexing:OFF
          {/if}
        </button>

        <button onclick={() => toggleTheme()}>
          {#if !$isDarkTheme}
            Dark
          {:else}
            Light
          {/if}
        </button>

        <button onclick={() => cmd("h")}>Header</button>
      </div>
      <span></span>
      <div>
        <button class="wipe" onclick={async () => await clearDb()}>
          Wipe Memory
        </button>
      </div>
    </div>
    <div class="msgs">
      {#if $msg}
        <div class="msg">
          {$msg}
        </div>
      {/if}
      {#if $lastSaved}
        <div class="lsaved">
          {formatTimestamp($lastSaved)} - saved
        </div>
      {/if}
    </div>
  {:else}
    <div class="print-preview-tools">
      <button onclick={print}>Print</button>
      <button onclick={closePreview}> Back</button>
    </div>
  {/if}
</div>

<style>
  @media print {
    .no-print {
      display: none !important;
    }
  }
  .print-preview-tools {
    display: flex;
    margin: 0.23rem 0;
    gap: 0.5rem;
  }
  .msg {
    font-family: monospace;
    font-size: 16px;
    font-variant: small-caps;
    color: rgb(16, 201, 182);
    font-weight: bold;
    user-select: none;
  }
  span {
    padding: 0 0.1rem;

    background-color: var(--header);
  }
  .wipe {
    background-color: rgb(143, 29, 29);
  }
  .wipe:hover {
    background-color: rgb(161, 44, 44);
  }
  .lsaved {
    font-size: 13px;
    font-weight: bold;
    font-style: italic;
    user-select: none;
  }

  .file-controls {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 0.4rem;
    padding: 0.4rem;
    margin: 0.2rem 0;
  }
  .B {
    font-weight: bold;
  }
  .I {
    font-style: italic;
  }
  .U {
    text-decoration: underline;
  }
  .file-controls > div:first-child {
    display: flex;
    gap: 0.5rem;
  }
  .msgs {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }
  button {
    outline: none !important;
    border: none !important;
    background-color: var(--btn);
    color: rgb(225, 223, 223);
    font-weight: bold;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    border-radius: 5px;
  }
  button:hover {
    background-color: var(--btn-high);
  }
</style>
