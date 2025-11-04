<script lang="ts">
  import { FileHeaders } from "../utils/values";

  let headers = $state<string[]>([]);

  $effect(() => {
    const unsubscribe = FileHeaders.subscribe((v) => {
      headers = v;
    });
    return unsubscribe;
  });

  function updateHeader(index: number, value: string, el: HTMLInputElement) {
    const updated = [...headers];
    updated[index] = value;
    headers = updated;
    FileHeaders.set(updated);

    // Adjust width dynamically based on content
    el.style.width = `${Math.max(1, el.value.length)}ch`;
  }

  // set initial width on mount
  function adjustWidth(el: HTMLInputElement) {
    el.style.width = `${Math.max(1, el.value.length)}ch`;
  }
</script>

{#if headers.length}
  <div class="wrapper">
    {#each headers as head, i}
      <input
        value={head}
        placeholder="header"
        use:adjustWidth
        oninput={(e) => updateHeader(i, e.currentTarget.value, e.currentTarget)}
      />
    {/each}
  </div>
{/if}

<style>
  @media print {
    .wrapper {
      border: 2px solid var(--btn-high);
      padding: 0rem 1rem;
    }
    .wrapper > input {
      border: none !important;
    }
    input:placeholder-shown {
      opacity: 0;
    }
  }
  .wrapper {
    border-bottom: 2px solid var(--btn-high);
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.5rem 1rem;
  }

  .wrapper > input {
    font-weight: bold;
    font-size: 18px;
    outline: none !important;
    border: 2px solid var(--header);
    background-color: transparent;
    padding: 0 0.4rem;
    text-align: center;
    width: auto;
    min-width: 200px;
  }

  .wrapper > input::placeholder {
    color: var(--color);
  }
</style>
