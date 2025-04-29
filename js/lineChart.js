// js/lineChart.js

/**
 * Dibuja un line-chart con la evolución anual del número de becas
 * para el estado seleccionado.
 *
 * @param {Array<Object>} data  – tu array globalData
 * @param {string} state        – código UF seleccionado (ej. "BA")
 */
function updateComparativeChart(data, state) {
    const container = d3.select("#hand-drawn-chart");
    container.selectAll("*").remove();
  
    // 1) Placeholder si no hay estado
    if (!state) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "150px 0")
        .text("Seleccione un estado para visualizar datos");
      return;
    }
  
    // 2) Filtrar por estado
    const filtered = data.filter(d => d[ufKey] === state);
    if (filtered.length === 0) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "150px 0")
        .text(`No hay datos para ${state}`);
      return;
    }
  
    // 3) Agrupar por año y contar
    const rollup = d3.rollup(
      filtered,
      v => v.length,
      d => d[anoKey]
    );
    const entries = Array.from(rollup, ([year, count]) => ({ year: +year, count }))
                         .sort((a, b) => a.year - b.year);
  
    // 4) Márgenes y dimensiones
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width  = container.node().clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
  
    // 5) Crear SVG
    const svg = container
      .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // 6) Escalas
    const x = d3.scaleLinear()
        .domain(d3.extent(entries, d => d.year))
        .range([0, width]);
  
    const y = d3.scaleLinear()
        .domain([0, d3.max(entries, d => d.count)])
        .nice()
        .range([height, 0]);
  
    // 7) Generador de línea
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count));
  
    // 8) Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .ticks(entries.length)
          .tickFormat(d3.format("d"))
        );
  
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // 9) Dibujar línea
    svg.append("path")
        .datum(entries)
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 2)
        .attr("d", line);
  
    // 10) Dibujar puntos
    svg.selectAll("circle")
      .data(entries)
      .enter()
      .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .style("fill", "#69b3a2");
  }
  