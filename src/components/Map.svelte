<!-- src/components/Map.svelte -->
<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import Tooltip from './Tooltip.svelte';
  
    export let year;
    export let state = '';
  
    let svgEl, geoData, countsByState = new Map();
    let tooltip = { html: '', x: 0, y: 0, visible: false };
  
    // Dimensiones más pequeñas pero proporcionadas
    const width = 1000;
    const height = 600;
  
    // Mapeo de siglas ➔ nombres
    const stateNames = {
      AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
      BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
      ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
      MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
      PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí',
      PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
      RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul',
      SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
      TO: 'Tocantins'
    };
    function getStateName(sigla) {
      return stateNames[sigla] || sigla;
    }
  
    onMount(async () => {
      geoData = await d3.json('/data/brazil-states.geojson');
      await loadCsvAndDraw();
    });
  
    // 1) Recarga y dibuja al cambiar de año
    $: if (year) {
        loadCsvAndDraw();
    }
    // 2) Re-dibuja al cambiar de estado
    $: if (geoData && countsByState && state !== undefined) {
        draw();
    }

    async function loadCsvAndDraw() {
      try {
        const rows = await d3.csv('/data/data.csv', d3.autoType);
        const filtered = rows.filter(d => d.ANO_CONCESSAO_BOLSA === +year);
        countsByState = d3.rollup(
          filtered,
          v => v.length,
          d => d.SIGLA_UF_BENEFICIARIO_BOLSA
        );
        draw();
      } catch (error) {
        console.error('Error al cargar datos:', error);
        createSampleData();
        draw();
      }
    }

    function createSampleData() {
      countsByState = new Map();
      Object.keys(stateNames).forEach(sigla => {
        countsByState.set(sigla, Math.floor(Math.random() * 1000));
      });
    }
  
    function draw() {
      const projection = d3.geoMercator()
        .scale(900) // Ajustamos la escala para que quepa mejor
        .center([-54, -15])
        .translate([width/2, height/2]);
      const path = d3.geoPath(projection);
  
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();
      svg.attr('width', width).attr('height', height);
  
      const maxCount = d3.max(Array.from(countsByState.values())) || 1;
      const totalBecas = Array.from(countsByState.values()).reduce((sum, count) => sum + count, 0);

      // ─── DEFINICIÓN DE GRADIENTE MEJORADO ────────────────────────
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%');
      
      // Gradiente más pronunciado hacia azul oscuro
      const stops = [0, 0.2, 0.4, 0.6, 0.8, 1];
      stops.forEach(stop => {
        gradient.append('stop')
          .attr('offset', `${stop * 100}%`)
          .attr('stop-color', d3.interpolateBlues(stop * 1.2)); // Más oscuro
      });

      // Función de color
      const getFill = d => {
        if (d.properties.sigla === state) return '#ffa500';
        const c = countsByState.get(d.properties.sigla) || 0;
        return d3.interpolateBlues(Math.pow(c / maxCount, 0.7)); // Exponente para acentuar diferencias
      };
  
      svg.selectAll('path')
        .data(geoData.features)
        .join('path')
          .attr('d', path)
          .attr('fill', getFill)
          .attr('stroke', '#999')
          .on('mouseover', (event, d) => {
            // resaltamos el polígono
            d3.select(event.currentTarget).attr('fill', '#ff8c00');

            // recuperamos sigla, nombre y conteo
            const sigla = d.properties.sigla;
            const name = getStateName(sigla);
            const count = countsByState.get(sigla) || 0;
            const percentage = totalBecas > 0 ? Math.round((count / totalBecas) * 100) : 0;

            // actualizamos el tooltip con nombre + total + porcentaje
            tooltip.html = `
              <div class="tooltip-content">
                <strong>${name}</strong><br/>
                Becas: ${count.toLocaleString()}<br/>
                Porcentaje: ${percentage}%
              </div>
            `;
            tooltip.visible = true;
            tooltip.x = event.pageX + 5;
            tooltip.y = event.pageY + 5;
          })
          .on('mousemove', event => {
            tooltip.x = event.pageX + 5;
            tooltip.y = event.pageY + 5;
          })
          .on('mouseout', (event, d) => {
            tooltip.visible = false;
            d3.select(event.currentTarget).attr('fill', getFill(d));
          });
  
      svg.selectAll('text')
        .data(geoData.features)
        .join('text')
          .attr('transform', d => `translate(${path.centroid(d)})`)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .text(d => d.properties.sigla)
          .attr('font-size', '10px')
          .attr('fill', '#000')
          .attr('pointer-events', 'none'); // Evita interferencia con hover

      // Leyenda mejorada y encuadrada
      const legendHeight = 200;
      const legendWidth = 25;
      const legendMargin = { top: 35, right: 45, bottom: 25, left: 45 };
      
      // Grupo legend con posición ajustada - movemos más hacia la izquierda
      const legendG = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(50, ${(height - legendHeight - legendMargin.top - legendMargin.bottom) / 2})`);

      // Fondo blanco para encuadrar toda la leyenda
      legendG.append('rect')
        .attr('x', -legendMargin.left)
        .attr('y', -legendMargin.top)
        .attr('width', legendWidth + legendMargin.left + legendMargin.right)
        .attr('height', legendHeight + legendMargin.top + legendMargin.bottom)
        .attr('fill', 'white')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('ry', 4);

      // Título de la leyenda
      legendG.append('text')
        .attr('transform', `translate(${legendWidth/2}, -20)`)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '11px')
        .attr('fill', '#333')
        .text('Distribución de Becas');

      // Subtítulo de la leyenda
      legendG.append('text')
        .attr('transform', `translate(${legendWidth/2}, -7)`)
        .attr('text-anchor', 'middle')
        .attr('font-style', 'italic')
        .attr('font-size', '9px')
        .attr('fill', '#333')
        .text('Por estado (%)');

      // Rectángulo con el gradiente
      legendG.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)')
        .style('stroke', '#999');

      // Escala lineal para la leyenda
      const percentScale = d3.scaleLinear()
        .domain([0, 100])
        .range([legendHeight, 0]);
      
      // Eje izquierdo con porcentajes
      const percentAxis = d3.axisLeft(percentScale)
        .ticks(5)
        .tickFormat(d => d + '%');
      
      legendG.append('g')
        .attr('transform', `translate(0, 0)`)
        .call(percentAxis)
        .selectAll('text')
        .style('font-size', '9px')
        .style('fill', '#000')  // Texto más oscuro
        .style('font-weight', 'bold');
      
      // Etiqueta en la parte inferior
      legendG.append('text')
        .attr('transform', `translate(${legendWidth/2}, ${legendHeight + 15})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#333')
        .text(`Total: ${totalBecas.toLocaleString()} becas`);
    }
  </script>
  
  <div class="single-map-container">
    <svg bind:this={svgEl}></svg>
    <Tooltip {tooltip} />
  </div>
  
  <style>
    .single-map-container {
      position: relative;
      background: #fff;
      padding: 1rem;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 900px; /* Reducimos el ancho máximo */
      margin: 0 auto; /* Centramos el mapa */
      overflow: hidden; /* Evitamos desbordamiento */
    }
    
    /* Asegúrate de que tu componente Tooltip.svelte use estos estilos */
    :global(.tooltip-content) {
      min-width: 150px;
      padding: 8px 12px;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      font-size: 12px;
      line-height: 1.4;
    }
  </style>