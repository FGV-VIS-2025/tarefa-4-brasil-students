<!-- src/App.svelte -->
<script>
    import YearSelect from './components/YearSelect.svelte';
    import Map from './components/Map.svelte';
  
    // Lista de estados con sigla y nombre
    const states = [
      { sigla: '', nome: 'Todos' },
      { sigla: 'AC', nome: 'Acre' },
      { sigla: 'AL', nome: 'Alagoas' },
      { sigla: 'AP', nome: 'Amapá' },
      { sigla: 'AM', nome: 'Amazonas' },
      { sigla: 'BA', nome: 'Bahia' },
      { sigla: 'CE', nome: 'Ceará' },
      { sigla: 'DF', nome: 'Distrito Federal' },
      { sigla: 'ES', nome: 'Espírito Santo' },
      { sigla: 'GO', nome: 'Goiás' },
      { sigla: 'MA', nome: 'Maranhão' },
      { sigla: 'MG', nome: 'Minas Gerais' },
      { sigla: 'MS', nome: 'Mato Grosso do Sul' },
      { sigla: 'MT', nome: 'Mato Grosso' },
      { sigla: 'PA', nome: 'Pará' },
      { sigla: 'PB', nome: 'Paraíba' },
      { sigla: 'PE', nome: 'Pernambuco' },
      { sigla: 'PI', nome: 'Piauí' },
      { sigla: 'PR', nome: 'Paraná' },
      { sigla: 'RJ', nome: 'Rio de Janeiro' },
      { sigla: 'RN', nome: 'Rio Grande do Norte' },
      { sigla: 'RO', nome: 'Rondônia' },
      { sigla: 'RR', nome: 'Roraima' },
      { sigla: 'RS', nome: 'Rio Grande do Sul' },
      { sigla: 'SC', nome: 'Santa Catarina' },
      { sigla: 'SE', nome: 'Sergipe' },
      { sigla: 'SP', nome: 'São Paulo' },
      { sigla: 'TO', nome: 'Tocantins' }
    ];
  
    // Estado reactivo: año y sigla seleccionada
    let year = 2014;
    let selectedState = '';
  </script>
  
  <main>
    <h1>BraVis Student Scholarship</h1>
  
    <!-- Controles -->
    <div class="controls">
      <div class="control-item">
        <label for="year-select">Seleccione año:</label>
        <YearSelect bind:year id="year-select" />
      </div>
  
      <div class="control-item">
        <label for="state-select">Seleccione estado:</label>
        <select bind:value={selectedState} id="state-select">
          {#each states as s}
            <option value={s.sigla}>{s.nome}</option>
          {/each}
        </select>
      </div>
    </div>
  
    <!-- Cuadro blanco con el mapa -->
    <div class="map-wrapper">
      <Map {year} state={selectedState} />
    </div>
  </main>
  
  <style>
    main {
      font-family: 'Inter', sans-serif;
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
  
    h1 {
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 2rem;
    }
  
    .controls {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
  
    .control-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  
    select {
      padding: 0.3rem;
      font-size: 1rem;
    }
  
    .map-wrapper {
      background: #fff;
      padding: 1rem;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
  