/**
 * handDrawnChart.js
 * Este archivo implementa un gráfico con estilo "hecho a mano" para la visualización BraVis
 * Proporciona una visualización alternativa con estética de dibujo manual
 */

/**
 * Crea un gráfico con estilo de dibujo a mano
 * @param {Array} data - Datos de estudiantes
 * @param {String} selectedState - Estado seleccionado
 * @param {Number} selectedYear - Año seleccionado
 */
function createHandDrawnChart(data, selectedState, selectedYear) {
    console.log("Creando gráfico con estilo hecho a mano para:", selectedState, selectedYear);
    
    // Limpiar el contenedor antes de agregar el nuevo gráfico
    d3.select("#hand-drawn-chart").html("");
    
    // Si no hay estado seleccionado, salir de la función
    if (!selectedState) {
        d3.select("#hand-drawn-chart").append("div")
            .attr("class", "no-data-message")
            .style("text-align", "center")
            .style("padding-top", "100px")
            .style("color", "#666")
            .text("Seleccione un estado para ver el gráfico.");
        return;
    }
    
    // Configurar dimensiones y márgenes
    const margin = {top: 40, right: 30, bottom: 60, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Verificar que los datos existan
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn("No hay datos disponibles para el gráfico hecho a mano");
        showHandDrawnNoDataMessage();
        return;
    }
    
    try {
        // Crear contenedor SVG
        const svg = d3.select("#hand-drawn-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
        // Filtrar datos para el estado y año seleccionados
        const filteredData = data.filter(d => 
            d.UF_BENEFICIARIO_BOLSA === selectedState && 
            d.ANO_CONCESSAO_BOLSA == selectedYear
        );
        
        console.log("Datos filtrados para gráfico hecho a mano:", filteredData.length);
        
        // Si no hay datos filtrados, usar datos de muestra
        let chartData;
        let isSampleData = false;
        
        if (filteredData.length === 0) {
            console.log("No hay datos filtrados para el gráfico hecho a mano, usando datos de muestra");
            chartData = createSampleHandDrawnData();
            isSampleData = true;
            
            // Mostrar indicación de datos de muestra
            svg.append("text")
                .attr("x", width)
                .attr("y", -5)
                .attr("text-anchor", "end")
                .style("font-size", "12px")
                .style("fill", "#666")
                .style("font-style", "italic")
                .text("(Datos de muestra)");
        } else {
            // Agrupar datos por turno del curso
            let turnoCounts = {};
            filteredData.forEach(d => {
                const turno = d.NOME_TURNO_CURSO_BOLSA || "No especificado";
                if (turnoCounts[turno]) {
                    turnoCounts[turno]++;
                } else {
                    turnoCounts[turno] = 1;
                }
            });
            
            // Convertir a formato de array para D3
            chartData = Object.keys(turnoCounts).map(turno => {
                return {
                    category: turno,
                    count: turnoCounts[turno],
                    percentage: (turnoCounts[turno] / filteredData.length * 100).toFixed(2)
                };
            });
            
            // Ordenar de mayor a menor
            chartData.sort((a, b) => b.count - a.count);
        }
        
        // Función para crear líneas con estilo de dibujo a mano
        function drawHandDrawnLine(x1, y1, x2, y2, noise = 2) {
            let path = d3.path();
            path.moveTo(x1, y1);
            
            // Agregar "ruido" a la línea para efecto de dibujo a mano
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const steps = Math.floor(length / 10);
            
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const xt = x1 + (x2 - x1) * t;
                const yt = y1 + (y2 - y1) * t + (Math.random() - 0.5) * noise;
                path.lineTo(xt, yt);
            }
            
            path.lineTo(x2, y2);
            return path.toString();
        }
        
        // Escalas para los ejes
        const x = d3.scaleBand()
            .domain(chartData.map(d => d.category))
            .range([0, width])
            .padding(0.3);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => parseFloat(d.percentage)) * 1.2])
            .range([height, 0]);
        
        // Agregar filtro para sombra
        const defs = svg.append("defs");
        
        const filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height", "130%");
        
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 3)
            .attr("result", "blur");
        
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "offsetBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        
        // Agregar líneas de cuadrícula con estilo de dibujo a mano
        for (let i = 0; i <= 5; i++) {
            const yPos = i * height / 5;
            const yValue = d3.max(chartData, d => parseFloat(d.percentage)) * 1.2 * (1 - i / 5);
            
            svg.append("path")
                .attr("d", drawHandDrawnLine(0, yPos, width, yPos, 1.5))
                .attr("stroke", "#ddd")
                .attr("stroke-width", 0.5)
                .attr("fill", "none");
            
            svg.append("text")
                .attr("x", -5)
                .attr("y", yPos)
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle")
                .attr("font-family", "'Comic Sans MS', cursive, sans-serif")
                .attr("font-size", "10px")
                .attr("fill", "#666")
                .text(`${Math.round(yValue)}%`);
        }
        
        // Agregar eje X con estilo personalizado
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSize(0))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end")
            .style("font-family", "'Comic Sans MS', cursive, sans-serif")
            .style("font-size", "12px");
        
        // Eliminar líneas de eje por defecto
        svg.selectAll(".domain").remove();
        svg.selectAll(".tick line").remove();
        
        // Agregar línea para eje X con estilo de dibujo a mano
        svg.append("path")
            .attr("d", drawHandDrawnLine(0, height, width, height, 1.5))
            .attr("stroke", "#333")
            .attr("stroke-width", 1.5)
            .attr("fill", "none");
        
        // Agregar línea para eje Y con estilo de dibujo a mano
        svg.append("path")
            .attr("d", drawHandDrawnLine(0, 0, 0, height, 1.5))
            .attr("stroke", "#333")
            .attr("stroke-width", 1.5)
            .attr("fill", "none");
        
        // Definir colores para cada categoría
        const colors = {
            "Integral": "#5470c6",
            "Matutino": "#91cc75",
            "Vespertino": "#fac858",
            "Noturno": "#ee6666",
            "A Distância": "#73c0de"
        };
        
        // Función para obtener color para una categoría
        function getColor(category, index) {
            if (colors[category]) {
                return colors[category];
            }
            
            // Colores alternativos si la categoría no está en el mapa
            const alternativeColors = [
                "#5470c6", "#91cc75", "#fac858", "#ee6666", 
                "#73c0de", "#3ba272", "#fc8452", "#9a60b4"
            ];
            
            return alternativeColors[index % alternativeColors.length];
        }
        
        // Crear un tooltip
        let tooltip = d3.select("body").select(".handdrawn-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip handdrawn-tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("text-align", "center")
                .style("padding", "10px")
                .style("background", "white")
                .style("border-radius", "8px")
                .style("pointer-events", "none")
                .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
                .style("font", "12px 'Comic Sans MS', cursive, sans-serif");
        }
        
        // Agregar barras con estilo de dibujo a mano
        svg.selectAll(".hand-drawn-bar")
            .data(chartData)
            .enter()
            .append("path")
            .attr("class", "hand-drawn-bar")
            .attr("d", (d, i) => {
                const barX = x(d.category);
                const barY = y(parseFloat(d.percentage));
                const barWidth = x.bandwidth();
                const barHeight = height - y(parseFloat(d.percentage));
                
                // Crear un rectángulo ligeramente irregular para efecto de dibujo a mano
                return drawHandDrawnLine(barX, barY, barX + barWidth, barY, 1) + 
                    drawHandDrawnLine(barX + barWidth, barY, barX + barWidth, barY + barHeight, 1) + 
                    drawHandDrawnLine(barX + barWidth, barY + barHeight, barX, barY + barHeight, 1) +
                    drawHandDrawnLine(barX, barY + barHeight, barX, barY, 1) + "Z";
            })
            .attr("fill", (d, i) => getColor(d.category, i))
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .style("filter", "url(#drop-shadow)")
            .on("mouseover", function(event, d) {
                // Resaltar barra al pasar el cursor
                d3.select(this)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 2);
                
                // Mostrar tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`${d.category}<br>Estudiantes: ${d.count}<br>Porcentaje: ${d.percentage}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Restaurar estilo al quitar el cursor
                d3.select(this)
                    .attr("stroke", "#666")
                    .attr("stroke-width", 1);
                
                // Ocultar tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Agregar etiquetas en la parte superior de las barras
        svg.selectAll(".value-label")
            .data(chartData)
            .enter()
            .append("text")
            .attr("class", "value-label")
            .attr("x", d => x(d.category) + x.bandwidth() / 2)
            .attr("y", d => y(parseFloat(d.percentage)) - 5)
            .attr("text-anchor", "middle")
            .text(d => d.percentage + "%")
            .style("font-family", "'Comic Sans MS', cursive, sans-serif")
            .style("font-size", "12px")
            .style("font-weight", "bold");
        
        // Agregar título del gráfico
        // Obtener nombre completo del estado
        const estadoNombre = document.querySelector(`#estado-selector option[value="${selectedState}"]`)?.text || selectedState;
        
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-family", "'Comic Sans MS', cursive, sans-serif")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Distribución de Estudiantes por Turno - ${estadoNombre}`);
        
        // Agregar etiqueta eje Y
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-family", "'Comic Sans MS', cursive, sans-serif")
            .style("font-size", "14px")
            .text("Porcentaje (%)");
        
        // Agregar nota sobre el año de los datos
        svg.append("text")
            .attr("x", width)
            .attr("y", height + 40)
            .attr("text-anchor", "end")
            .style("font-family", "'Comic Sans MS', cursive, sans-serif")
            .style("font-style", "italic")
            .style("font-size", "12px")
            .text(`Datos del año: ${selectedYear}`);
        
    } catch (error) {
        console.error("Error al crear gráfico con estilo hecho a mano:", error);
        showHandDrawnNoDataMessage("Error al crear gráfico: " + error.message);
    }
}

/**
 * Crea datos de muestra para el gráfico hecho a mano
 * @returns {Array} Datos de muestra para el gráfico
 */
function createSampleHandDrawnData() {
    return [
        { category: "Integral", count: 45, percentage: "28.65" },
        { category: "Matutino", count: 38, percentage: "24.32" },
        { category: "Vespertino", count: 36, percentage: "22.89" },
        { category: "Adistancia", count: 23, percentage: "14.67" },
        { category: "Nocturno", count: 15, percentage: "9.47" }
    ];
}

/**
 * Muestra un mensaje cuando no hay datos disponibles
 * @param {String} message - Mensaje a mostrar
 */
function showHandDrawnNoDataMessage(message = "No hay datos disponibles para el estado y año seleccionados.") {
    d3.select("#hand-drawn-chart").append("div")
        .attr("class", "no-data-message")
        .style("text-align", "center")
        .style("padding-top", "100px")
        .style("color", "#666")
        .text(message);
}