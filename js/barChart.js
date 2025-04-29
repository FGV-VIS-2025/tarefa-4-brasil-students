// js/barChart.js

/**
 * Actualiza el gráfico de barras de “estudiantes por turno”
 * @param {Array<Object>} data  – Array con todos los registros CSV
 * @param {string} state        – Código del estado seleccionado (ej. "RS")
 * @param {string|number} year  – Año seleccionado (ej. 2015)
 */
function updateBarChart(data, state, year) {
    // 1) Selecciona el contenedor y limpia contenido previo
    const container = d3.select("#bar-chart");
    container.selectAll("*").remove();
  
    // 2) Si no hay estado, muestra placeholder
    if (!state) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "100px 0")
        .text("Seleccione un estado para visualizar datos");
      return;
    }
  
    // 3) Filtrar por estado y año
    const filtered = data.filter(
      d => d.UF_BENEFICIARIO_BOLSA === state && d.ANO_CONCESSAO_BOLSA == year
    );
  
    // 4) Si filtrado vacío, aviso
    if (filtered.length === 0) {
      container
        .append("div")
        .attr("class", "chart-placeholder")
        .style("text-align", "center")
        .style("padding", "100px 0")
        .text(`No hay datos disponibles para ${state} en ${year}`);
      return;
    }
  
    // 5) Agrupar y contar por turno
    const rollup = d3.rollup(
      filtered,
      v => v.length,
      d => d.NOME_TURNO_CURSO_BOLSA
    );
    const entries = Array.from(rollup, ([turno, count]) => ({ turno, count }))
                        .sort((a, b) => b.count - a.count);
  
    // 6) Márgenes y dimensiones
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width  = container.node().clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
  
    // 7) Crear SVG
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
  
    // 9) Dibujar ejes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");
  
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // 10) Dibujar las barras
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
  