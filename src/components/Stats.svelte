<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
  
    export let year;
    export let state;
    export let category;
  
    let total = 0;
    let top5 = [];
    let stateName = '';
  
    const stateMap = {
      AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
      CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
      MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
      PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
      RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
      RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
      TO: 'Tocantins'
    };
  
    $: stateName = stateMap[state] || '';
  
    $: if (year && state) {
      fetch(`/data/prouni_${year}.csv`)
        .then(r => r.text())
        .then(txt => {
          const rows = d3.csvParse(txt, d3.autoType);
          const filtered = rows.filter(r => r.sigla === state);
          total = filtered.length;
  
          // agrupar por universidad
          const counts = {};
          filtered.forEach(r => {
            const uni = r.NOME_INSTITUICAO;
            counts[uni] = (counts[uni] || 0) + 1;
          });
          top5 = Object.entries(counts)
            .map(([name, cnt]) => ({ name, cnt }))
            .sort((a, b) => b.cnt - a.cnt)
            .slice(0, 5);
        });
    }
  </script>
  
  {#if state}
    <section class="stats">
      <h2>Estado: {stateName}</h2>
      <p>Total bolsas: {total}</p>
      <h3>Top 5 universidades:</h3>
      <ul>
        {#each top5 as u}
          <li>{u.name}: {u.cnt} becas</li>
        {/each}
      </ul>
    </section>
  {:else}
    <section class="stats">
      <p>Seleccione un estado para ver estadísticas.</p>
    </section>
  {/if}
  
  <style>
    .stats {
      margin-top: 1.5rem;
      font-family: 'Inter', sans-serif;
    }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    h3 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    ul {
      list-style: disc;
      margin-left: 1.5rem;
    }
  </style>