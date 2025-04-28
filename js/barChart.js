/**
 * barChart.js
 * Script para crear y actualizar el gráfico de barras de estudiantes por turno
 */

/**
 * Actualiza el gráfico de barras con los datos del estado y año seleccionados
 * @param {Array} data - Datos de estudiantes
 * @param {String} selectedState - Estado seleccionado
 * @param {Number} selectedYear - Año seleccionado
 */
function updateBarChart(data, selectedState, selectedYear) {
    // Limpiar contenedor
    d3.select("#bar-chart").html("");
    
    // Actualizar título con el estado seleccionado
    const estadoNombre = selectedState 
        ? document.querySelector(`#estado-selector option[value="${selectedState}"]`).text 
        : "Ninguno seleccionado";
    
    d3.select("#estado-barchart").text(estadoNombre);
    
    // Si no hay estado seleccionado, salir
    if (!selectedState) {
        d3.select("#bar-chart")
            .append("div")
            .attr("class", "no-data-message")
            .text("Seleccione un estado para ver el gráfico.");
        return;
    }
    
    // Filtrar datos para el estado y año seleccionados
    const filteredData = data.filter(d => 
        d.UF_BENEFICIARIO_BOLSA === selectedState && 
        d.ANO_CONCESSAO_BOLSA == selectedYear
    );
    
    // Si no hay datos, mostrar datos de muestra
    if (filteredData.length === 0) {
        // Datos de muestra para pruebas
        const sampleData = [
            { category: "Integral", value: 45, percentage: 28.65 },
            { category: "Matutino", value: 38, percentage: 24.32 },
            { category: "Vespertino", value: 36, percentage: 22.89 },
            { category: "Adistancia", value: 23, percentage: 14.67 },
            { category: "Nocturno", value: 15, percentage: 9.47 }
        ];
        
        // Mostrar un mensaje explicando que son datos de muestra
        d3.select("#bar-chart")
            .append("div")
            .attr("class", "sample-data-notice")
            .style("color", "#666")
            .style("font-style", "italic")
            .style("margin-bottom", "10px")
            .text("Mostrando datos de muestra para fines de visualización");
            
        // Usar sampleData para renderizar el gráfico
        renderBarChart(sampleData, estadoNombre);
        return;
    }
    
    // Procesar datos para el gráfico
    // Contar estudiantes por turno
    const turnoCounts = {};
    filteredData.forEach(d => {
        const turno = d.NOME_TURNO_CURSO_BOLSA || "No especificado";
        if (turnoCounts[turno]) {
            turnoCounts[turno]++;
        } else {
            turnoCounts[turno] = 1;
        }
    });
    
    // Convertir a formato de array para D3
    const chartData = Object.keys(turnoCounts).map(turno => {
        return {
            category: turno,
            value: turnoCounts[turno],
            percentage: (turnoCounts[turno] / filteredData.length * 100).toFixed(2)
        };
    });
    
    // Ordenar de mayor a menor
    chartData.sort((a, b) => b.value - a.value);
    
    // Renderizar el gráfico con los datos reales
    renderBarChart(chartData, estadoNombre);
}

/**
 * Renderiza el gráfico de barras
 * @param {Array} chartData - Datos para el gráfico
 * @param {String} estadoNombre - Nombre del estado seleccionado
 */
function renderBarChart(chartData, estadoNombre) {
    // Configurar dimensiones
    const container = document.getElementById("bar-chart");
    const margin = {top: 20, right: 20, bottom: 50, left: 50};
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Crear SVG
    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Definir escalas
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.category))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => parseFloat(d.percentage)) * 1.1])
        .nice()
        .range([height, 0]);
    
    // Agregar ejes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
    
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));
    
    // Agregar líneas de cuadrícula horizontales
    svg.selectAll("line.horizontalGrid")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("fill", "none")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.5);
    
    // Agregar etiqueta eje Y
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Porcentaje (%)");
    
    // Crear un tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Colores para las barras
    const colors = ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"];
    
    // Agregar barras
    svg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.category))
        .attr("width", x.bandwidth())
        .attr("y", d => y(parseFloat(d.percentage)))
        .attr("height", d => height - y(parseFloat(d.percentage)))
        .attr("fill", (d, i) => colors[i % colors.length])
        .attr("rx", 2) // Bordes redondeados
        .attr("ry", 2)
        .on("mouseover", function(event, d) {
            // Resaltar barra
            d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 0.8)
                .attr("stroke", "#333")
                .attr("stroke-width", 1);
            
            // Mostrar tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.category}<br>Estudiantes: ${d.value}<br>Porcentaje: ${d.percentage}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            // Restaurar estilo
            d3.select(this)
                .transition()
                .duration(500)
                .attr("opacity", 1)
                .attr("stroke", "none");
            
            // Ocultar tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Agregar etiquetas en las barras
    svg.selectAll(".bar-label")
        .data(chartData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.category) + x.bandwidth() / 2)
        .attr("y", d => y(parseFloat(d.percentage)) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(d => d.percentage + "%");
    
    // Agregar título
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`Distribución por Turno - ${estadoNombre}`);
}