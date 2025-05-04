<!-- src/components/Map.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import Tooltip from './Tooltip.svelte';

  export let year;
  export let state = '';

  let svgEl;
  let geoData;
  let countsByState = new Map();
  let tooltip = { html: '', x: 0, y: 0, visible: false };

  const width = 1000;
  const height = 600;

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
    const base = import.meta.env.BASE_URL;
    geoData = await d3.json(`${base}data/brazil-states.geojson`);
    await loadCsvAndDraw();
  });

  $: if (year !== undefined) loadCsvAndDraw();
  $: if (geoData && countsByState) draw();

  async function loadCsvAndDraw() {
    try {
      const base = import.meta.env.BASE_URL;
      const rows = await d3.csv(`${base}data/data.csv`, d3.autoType);
      const filtered = year === ''
        ? rows
        : rows.filter(d => d.ANO_CONCESSAO_BOLSA === +year);

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
      .scale(900)
      .center([-54, -15])
      .translate([width / 2, height / 2]);
    const path = d3.geoPath(projection);

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const maxCount = d3.max(Array.from(countsByState.values())) || 1;
    const totalBecas = Array.from(countsByState.values()).reduce((sum, c) => sum + c, 0);

    // Definir gradiente
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(stop => {
      gradient.append('stop')
        .attr('offset', `${stop * 100}%`)
        .attr('stop-color', d3.interpolateBlues(stop * 1.2));
    });

    // Función de color y resaltado del estado seleccionado
    const getFill = d => {
      const c = countsByState.get(d.properties.sigla) || 0;
      const baseColor = d3.interpolateBlues(Math.pow(c / maxCount, 0.7));
      if (d.properties.sigla === state) {
        return d3.color(baseColor).darker(1).formatHex();
      }
      return baseColor;
    };

    // Dibujar estados
    svg.selectAll('path')
      .data(geoData.features)
      .join('path')
        .attr('d', path)
        .attr('fill', d => getFill(d))
        .attr('stroke', '#999')
        .attr('transform', d => {
          if (d.properties.sigla === state) {
            const [cx, cy] = path.centroid(d);
            return `translate(${cx},${cy}) scale(1.05) translate(${-cx},${-cy})`;
          }
          return null;
        })
        .on('mouseover', (event, d) => {
          const sel = d3.select(event.currentTarget);
          const darker = d3.color(getFill(d)).darker(0.5).formatHex();
          sel.attr('fill', darker);
          const name = getStateName(d.properties.sigla);
          const count = countsByState.get(d.properties.sigla) || 0;
          const perc = totalBecas > 0
            ? ((count / totalBecas) * 100).toFixed(2)
            : '0.00';
          tooltip.html = `
            <div class="tooltip-content">
              <strong>${name}</strong><br/>
              Becas: ${count.toLocaleString()}<br/>
              Porcentaje: ${perc}%
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
          const sel = d3.select(event.currentTarget);
          sel.attr('fill', getFill(d))
             .attr('transform', d.properties.sigla === state
               ? (() => { const [cx, cy] = path.centroid(d); return `translate(${cx},${cy}) scale(1.05) translate(${-cx},${-cy})`; })()
               : null);
          tooltip.visible = false;
        });

    // Etiquetas de siglas
    svg.selectAll('text')
      .data(geoData.features)
      .join('text')
        .attr('transform', d => `translate(${path.centroid(d)})`)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(d => d.properties.sigla)
        .attr('font-size', '10px')
        .attr('fill', '#000')
        .attr('pointer-events', 'none');

    // Leyenda de porcentaje y conteo
    const legendHeight = 200;
    const legendWidth = 25;
    const legendMargin = { top: 45, right: 60, bottom: 25, left: 10 };
    const legendG = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(50, ${(height - legendHeight - legendMargin.top - legendMargin.bottom) / 2})`);

    // Fondo
    // legendG.append('rect')
    //   .attr('x', -legendMargin.left)
    //   .attr('y', -legendMargin.top)
    //   .attr('width', legendWidth + legendMargin.left + legendMargin.right)
    //   .attr('height', legendHeight + legendMargin.top + legendMargin.bottom)
    //   .attr('fill', 'white')
    //   .attr('stroke', '#ddd')
    //   .attr('rx', 4)
    //   .attr('ry', 4);

    // Título
    legendG.append('text')
      .attr('transform', `translate(${legendWidth/2}, -20)`)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .text('Distribución de Becas');

    // Barras del gradiente
    legendG.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
      .style('stroke', '#999');

    // Eje %
    const percentScale = d3.scaleLinear()
      .domain([0, 100])
      .range([legendHeight, 0]);
    legendG.append('g')
      .attr('class', 'axis-percent')
      .call(d3.axisLeft(percentScale).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text')
        .style('font-size', '9px')
        .style('fill', '#000')
        .style('font-weight', 'bold');

    // Eje count (k) a la derecha
    const countScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([legendHeight, 0]);
    legendG.append('g')
      .attr('class', 'axis-count')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(d3.axisRight(countScale)
        .tickValues([0, maxCount])
        .tickFormat(d3.format('.0s'))
      )
      .selectAll('text')
        .style('font-size', '9px')
        .style('fill', '#000');

    // Label total
    legendG.append('text')
      .attr('transform', `translate(${legendWidth/2}, ${legendHeight + 15})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#333')
      .text(`Total: ${totalBecas.toLocaleString()} becas`);
  }
</script>

<div class="single-map-container">
  <svg bind:this={svgEl} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet"></svg>
  <Tooltip {tooltip} />
</div>

<style>
  .single-map-container svg {
    width: 100%;
    height: auto;
    display: block;
  }
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
