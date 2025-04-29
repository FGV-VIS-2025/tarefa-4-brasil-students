// js/handDrawnChart.js

/**
 * Dibuja en #hand-drawn-chart la evolución anual
 * del total de becas para el estado dado.
 * @param {Array<Object>} data  – globalData
 * @param {string} state        – código UF (ej. "MT")
 * @param {string|number} year  – año seleccionado (no se usa aquí)
 */
function createHandDrawnChart(data, state, year) {
    const container = d3.select("#hand-drawn-chart");
    // Limpio lo anterior (placeholder o SVG)
    container.selectAll("*").remove();
  
    // Placeholder si no han elegido estado
    if (!state) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "150px 0")
        .text("Selecione um estado para visualizar dados");
      return;
    }
  
    // Filtrar todos los registros de ese estado
    const filtered = data.filter(d => d[ufKey] === state);
    if (filtered.length === 0) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "150px 0")
        .text(`Não há dados para ${state}`);
      return;
    }
  
    // Agrupar por año y contar
    const rollup = d3.rollup(
      filtered,
      v => v.length,
      d => d[anoKey]
    );
    const entries = Array.from(rollup, ([year, count]) => ({ year: +year, count }))
                         .sort((a, b) => a.year - b.year);
  
    // Márgenes y dimensiones
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width  = container.node().clientWidth  - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
  
    // SVG principal
    const svg = container
      .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Escalas
    const x = d3.scaleLinear()
      .domain(d3.extent(entries, d => d.year))
      .range([0, width]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(entries, d => d.count)])
      .nice()
      .range([height, 0]);
  
    // Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3.axisBottom(x)
            .ticks(entries.length)
            .tickFormat(d3.format("d"))
        );
  
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // Generador de línea
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count));
  
    // Dibujar la línea
    svg.append("path")
        .datum(entries)
        .attr("fill", "none")
        .attr("stroke", "#444")
        .attr("stroke-width", 2)
        .attr("d", line);
  
    // Dibujar puntos
    svg.selectAll("circle")
      .data(entries)
      .enter()
      .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .style("fill", "#444");
  }
  