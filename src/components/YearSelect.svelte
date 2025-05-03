<script>
    export let year;
    const years = Array.from({ length: 2019 - 2014+ 1 }, (_, i) => 2014 + i);
  </script>
  
  <select bind:value={year}>
    {#each years as y}
      <option value={y}>{y}</option>
    {/each}
  </select>