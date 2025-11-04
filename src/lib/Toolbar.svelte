<script lang="ts">
  import { clearDb } from "../utils/db";
  import {
    toggleTheme,
    getFilteredData,
    formatTimestamp,
    createMd,
    saveCSV,
  } from "../utils/utils";
  import {
    hasIndex,
    isDarkTheme,
    lastSaved,
    msg,
    previewMode,
    type WrapperCommands,
  } from "../utils/values";
  import Papa from "papaparse";

  interface props {
    loadCSVintoGrid: (data: string[][]) => void;
    clearGrid: () => void;
    cmd: (data: WrapperCommands) => void;
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
  let fileName: string | null = $state(null);

  async function exportToCSV() {
    const md = createMd();
    const filtered = getFilteredData($hasIndex);

    if (!filtered) {
      alert("Grid is empty");
      return;
    }

    filtered.unshift(md);
    const csv = Papa.unparse(filtered);

    await saveCSV(csv);
  }

  function getCSV(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    fileName = file.name;

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
    <div class="cntrl">
      <button
        title="Load File"
        onclick={() => fileInput?.click()}
        class="upload-btn"
      >
        📁
      </button>

      <button title="Save File" onclick={exportToCSV} class="export-btn">
        💾
      </button>

      <button title="Print File" onclick={prntSetup} class="upload-btn">
        🖨️
      </button>

      <button title="Clear" onclick={clearGrid} class="clear-btn"> 🧹 </button>
      <input
        type="file"
        accept=".csv"
        bind:this={fileInput}
        onchange={getCSV}
        style="display: none;"
      />

      <span></span>

      <button onclick={() => cmd("b")} class="B">B</button>
      <button onclick={() => cmd("i")} class="I">I</button>
      <button onclick={() => cmd("u")} class="U">U</button>
      <button onclick={() => cmd("ce")}>C</button>

      <span></span>

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

      <button onclick={() => cmd("he")}>Header</button>

      <span></span>

      <button class="wipe" onclick={async () => await clearDb()}>
        Wipe Memory
      </button>
    </div>
    <div class="info">
      <div>
        {#if $lastSaved}
          <div class="lsaved">
            {formatTimestamp($lastSaved)}
          </div>
        {/if}

        {#if $msg}
          <div class="msg">
            {$msg}
          </div>
        {/if}
      </div>
      {#if fileName}
        <div class="file-name">{fileName}</div>
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
    font-size: 13px;
    font-variant: small-caps;
    color: rgb(16, 201, 182);
    font-weight: bold;
    user-select: none;
  }
  .file-name {
    font-size: 13px;

    font-weight: bold;
    user-select: none;
    font-style: italic;
  }
  span {
    padding: 0 0.1rem;
    height: 20px;
    width: 0.4px;
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
    flex-direction: column-reverse;
    width: 100%;
    gap: 0.6rem;
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
  .cntrl {
    display: flex;
    gap: 0.5rem;
  }

  .info > div {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .info {
    width: 100%;

    display: flex;
    justify-content: space-between;

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
