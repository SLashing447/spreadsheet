<script lang="ts">
  import { exBlockSel } from "../utils/extract";

  import {
    toggleTheme,
    getCellElement,
    getFilteredData,
    toggleHeaderWrap,
    saveGridInDb,
    loadGridFromDb,
  } from "../utils/utils";
  import { sum2DLines } from "../utils/math";

  import {
    FileHeaders,
    hasIndex,
    lastSaved,
    msg,
    previewMode,
    SIGN,
  } from "../utils/values";

  import Toolbar from "./Toolbar.svelte";
  import Header from "../lib/Header.svelte";

  const grid = $state([20, 10]); // cols & rows

  let gridContainer: HTMLDivElement | null = $state(null);

  let printData = $state<string[][]>([]);

  let activeCell = $state<HTMLDivElement | null>(null);

  function cellCommands(cmd: string) {
    if (!activeCell) return;

    if (cmd === "bold" || cmd === "italic" || cmd === "underline") {
      document.execCommand(cmd, false, undefined);
      activeCell?.focus();
    }

    if (cmd === "h") {
      toggleHeaderWrap(activeCell as HTMLElement);
    }
  }

  function handleFocus(event: FocusEvent) {
    activeCell = event.target as HTMLDivElement;
  }

  function loadCSVintoGrid(data: string[][]) {
    clearGrid();

    const md = data[0];
    if (md[0] !== SIGN) {
      alert("File not valid");
      console.error("CSV file is corrupted");
      return;
    }

    // load name space headers
    let fheads = [];
    for (let i = 1; i < md.length - 1; i++) {
      fheads.push(md[i]);
    }
    try {
      lastSaved.set(Number(md[md.length - 1]));
    } catch (e) {
      alert("File not valid");
      console.error("CSV file is corrupted");
      return;
    }
    FileHeaders.set(fheads);

    // load headers

    const headers = data[1];

    for (let i = 0; i < headers.length; i++) {
      const cell = getCellElement(0, i);
      const val = headers[i];

      if (cell) {
        cell.innerHTML = val || "";
        if (val) toggleHeaderWrap(cell as HTMLElement, true);
      }
    }

    // load data

    for (let i = 2; i < data.length; i++) {
      for (let j = 0; j < headers.length; j++) {
        const cell = getCellElement(i - 1, j);
        const val = data[i][j];
        if (cell) {
          cell.innerHTML = val || "";
        }
      }
    }
  }

  function clearGrid() {
    if (!gridContainer) return;

    let cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      toggleHeaderWrap(cell as HTMLElement);
      cell.innerHTML = "";
    });
    hasIndex.set(false);
  }

  function previewGrid() {
    const filtered = getFilteredData($hasIndex);

    if (!filtered) {
      alert("Grid is empty");
      return;
    }

    toggleTheme("l", true); // temporary change

    printData = filtered;
    previewMode.set(true);
  }

  function closePreview() {
    // loadCSVintoGrid(printData);
    previewMode.set(false);
    toggleTheme(localStorage.getItem("theme")); // toggle to wtv was before

    printData = [];
  }

  function checkForUserCmd() {
    if (!activeCell) return false;
    let html = activeCell.innerHTML;
    if (html.includes("<br>") || !html.trim().startsWith("/")) return false;
    let cmd = activeCell.innerText;
    let args = cmd.split(" ");

    let fn = args[0];

    const block = exBlockSel(args[1], args[2]);
    if (block === undefined) return;

    switch (fn) {
      case "/sum":
        activeCell.innerHTML = JSON.stringify(sum2DLines(block));
        break;
      default:
        console.error("Command not recognised");
    }

    return true;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      if (activeCell) grid[1] = grid[1] + 1;
      // console.log("Escape pressed!");
      return;
    }

    if (e.key === "Enter" && e.ctrlKey) {
      if (!activeCell) return;
      let row = Number(activeCell.getAttribute("data-row"));
      let col = Number(activeCell.getAttribute("data-col"));

      let _row = row + 1;

      let cell = getCellElement(_row, col);
      if (cell) cell.focus();

      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();

      let isCmd = checkForUserCmd();
      if (isCmd) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);

      // Create <br> and insert
      const br = document.createElement("br");
      range.insertNode(br);

      // Create an invisible text node (caret anchor)
      const spacer = document.createTextNode("\u200B"); // zero-width space
      br.after(spacer);

      // Move caret after the spacer
      const newRange = document.createRange();
      newRange.setStartAfter(spacer);
      newRange.collapse(true);

      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === "s" && e.ctrlKey) {
      e.preventDefault();
      msg.set("Saving... ");
      saveGridInDb()
        .then(() => {
          msg.set("Saved");
          setTimeout(() => msg.set(null), 5000);
        })
        .catch((e: string) => {
          msg.set(e);
          setTimeout(() => msg.set(null), 5000);
        });
    }
  }

  // ! LOAD DATA FROM DBD HERE LOL
  loadGridFromDb().then(([data, ls]) => {
    loadCSVintoGrid(data);
    lastSaved.set(ls);
  });
</script>

<svelte:window on:keydown={handleKeydown} />
<Header />
<Toolbar
  {clearGrid}
  {closePreview}
  {previewGrid}
  {loadCSVintoGrid}
  cmd={cellCommands}
/>

<div
  class="grid-container no-print"
  id="grid-main"
  bind:this={gridContainer}
  style={`   
      grid-template-columns: repeat(${grid[0]}, max-content);
      grid-template-rows: repeat(${grid[1]}, max-content);
      display:${$previewMode ? "none" : "grid"}
 
    `}
>
  <!-- Corner -->
  <div class="corner" aria-hidden="true"></div>
  {#if $hasIndex}
    <div class="corner" aria-hidden="true"></div>
  {/if}

  <!-- Top header: 1..cols -->
  {#each Array(grid[0]) as _, c}
    <div
      class="col-head"
      id={`col-${c}`}
      style={`grid-row: 1; grid-column: ${$hasIndex ? c + 3 : c + 2};`}
      aria-hidden="true"
    >
      {c + 1}
    </div>
  {/each}

  <!-- Left header: 1..rows -->
  {#each Array(grid[1]) as _, r}
    <div
      class="row-head"
      style={`grid-row: ${r + 2}; grid-column: 1;`}
      aria-hidden="true"
    >
      {r + 1}
    </div>
  {/each}

  <!-- INDEXING -->
  {#if $hasIndex}
    {#each Array(grid[1]) as _, r}
      {#if r === 0}
        <div
          class="idx header"
          contenteditable
          spellcheck="false"
          tabindex="0"
          role="textbox"
          dir="auto"
          id="idx-0"
          style={`grid-row: 2; grid-column: 2;`}
        >
          <he> Index </he>
        </div>
      {:else}
        <div
          class="idx"
          contenteditable
          spellcheck="false"
          tabindex="0"
          role="textbox"
          id={`idx-${r}`}
          dir="auto"
          style={`grid-row: ${r + 2}; grid-column: 2;`}
        >
          {r}
        </div>
      {/if}
    {/each}
  {/if}

  {#each Array(grid[1]) as _, rowIndex}
    {#each Array(grid[0]) as _, colIndex}
      <div
        data-row={rowIndex}
        data-col={colIndex}
        class="cell"
        contenteditable="true"
        role="textbox"
        onfocus={handleFocus}
        onkeydown={onKeyDown}
        spellcheck="false"
        tabindex="0"
        dir="auto"
      ></div>
    {/each}
  {/each}
</div>
{#if $previewMode && printData.length > 0}
  <table class="print-table">
    <thead>
      <tr>
        {#each printData[0] as header}
          <th>{@html header}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each printData.slice(1) as row}
        <tr>
          {#each row as cell}
            <td>{@html cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .grid-container {
    display: grid;
    gap: 1px;
    width: fit-content;
    max-width: 100%;

    overflow: auto;
    max-height: 90vh;

    background-color: transparent;
    margin-bottom: 1rem;
  }
  .row-head {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 0.2rem;
    margin-right: 0.4rem;
  }
  .col-head,
  .row-head {
    user-select: none;
    cursor: default;
  }
  .col-head {
    display: flex;
    justify-content: start;
    align-items: center;
    padding: 0.2rem 0;

    position: sticky;
    left: 2px;
    top: 2px;
    z-index: 2;
  }

  .cell,
  .idx {
    background-color: var(--cell);

    padding: 8px;
    min-width: 80px;
    min-height: 30px;
    outline: none;
    white-space: pre-wrap;

    word-break: break-word;
    position: relative;
  }

  .cell:hover,
  .idx:hover {
    background-color: var(--cell-high);
  }
  .cell:focus,
  .idx:focus {
    background-color: var(--cell-high);
    box-shadow: inset 0 0 0 3px var(--cell-border);
  }

  /* Print Styles for A4 Paper */

  /* Landscape specific */
  /* Global or print stylesheet */
  @page {
    /* size: A4 portrait; */
    margin: 3mm 0 3mm 0;
  }

  @media print {
    /* Hide everything except the grid */
    .no-print {
      display: none !important;
    }
  }

  .print-table {
    margin-top: 0.2rem;
    display: table !important;
    width: 100%;
    border-collapse: separate !important;
    border-spacing: 0;
    font-size: 12pt;
    page-break-inside: auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin-bottom: 10rem;
  }

  .print-table thead {
    display: table-header-group;
  }

  .print-table thead th {
    background-color: var(--header);
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-weight: bold;
    color: lightgray;

    border: 1px solid var(--bg) !important;

    padding: 4px 6px;

    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
    /* Preserve line breaks in headers */
    white-space: pre-wrap;
    word-wrap: break-word;
    vertical-align: top;
  }

  .print-table tbody {
    display: table-row-group;
  }

  .print-table tr {
    page-break-inside: avoid;

    page-break-after: auto;
  }

  .print-table td {
    border: 1px solid var(--header) !important;
    border-top: none !important;

    padding: 3px 6px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    /* CRITICAL: Preserve line breaks and spaces */
    white-space: pre-wrap !important;
    word-wrap: break-word;
    word-break: break-word;
    vertical-align: top;
  }
</style>
