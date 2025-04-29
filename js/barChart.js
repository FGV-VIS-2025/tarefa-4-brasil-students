// js/barChart.js

/**
 * Actualiza el gráfico de barras de “estudiantes por turno”
 * @param {Array<Object>} data  – Array con todos los registros CSV
 * @param {string} state        – Código del estado seleccionado (ej. "MT")
 * @param {string|number} year  – Año seleccionado (ej. "2015")
 */
function updateBarChart(data, state, year) {
    const container = d3.select("#bar-chart");
    // 1) Limpia cualquier gráfico o placeholder previo
    container.selectAll("*").remove();
  
    // 2) Si no hay estado seleccionado, muestro mensaje
    if (!state) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "100px 0")
        .text("Selecione um estado para visualizar dados");
      return;
    }
  
    // 3) Filtro los datos usando ufKey y anoKey detectados en main.js
    const yearNum = +year;
    const filtered = data.filter(
      d => d[ufKey] === state && d[anoKey] === yearNum
    );
  
    // 4) Si no hay registros, muestro placeholder de “sin datos”
    if (filtered.length === 0) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "100px 0")
        .text(`Não há dados disponíveis para ${state} em ${year}`);
      return;
    }
  
    // 5) Agrupo y cuento la cantidad de estudiantes por turno
    const rollup = d3.rollup(
      filtered,
      v => v.length,
      d => d.NOME_TURNO_CURSO_BOLSA
    );
    const entries = Array.from(rollup, ([turno, count]) => ({ turno, count }))
                         .sort((a, b) => b.count - a.count);
  
    // 6) Defino márgenes y dimensiones
    const margin = { top: 20, right: 20, bottom: 70, left: 50 };
    const width  = container.node().clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
  
    // 7) Creo el SVG
    const svg = container
      .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // 8) Escalas
    const x = d3.scaleBand()
      .domain(entries.map(d => d.turno))
      .range([0, width])
      .padding(0.1);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(entries, d => d.count)])
      .nice()
      .range([height, 0]);
  
    // 9) Ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");
  
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // 10) Barras
    svg.selectAll(".bar")
      .data(entries)
      .enter()
      .append("rect")
        .attr("class", "bar")
        .attr("x",      d => x(d.turno))
        .attr("y",      d => y(d.count))
        .attr("width",  x.bandwidth())
        .attr("height", d => height - y(d.count))
        .style("fill",  "#69b3a2");
  }
  