/**
 * pieCharts.js
 * Script para crear y actualizar los gráficos circulares
 * Este archivo se encarga de generar los tres gráficos circulares que muestran
 * la distribución de estudiantes por tipo de beca, género y etnia.
 */

/**
 * Actualiza los gráficos circulares basados en los datos filtrados
 * @param {Array} data - Datos de estudiantes
 * @param {String} selectedState - Estado seleccionado
 * @param {Number} selectedYear - Año seleccionado
 * @param {String} selectedCategory - Categoría seleccionada
 */
function updatePieCharts(data, selectedState, selectedYear, selectedCategory) {
    console.log("Actualizando gráficos circulares para:", selectedState, selectedYear, selectedCategory);
    
    // Limpiar gráficos existentes
    d3.select("#pie-chart1").html("");
    d3.select("#pie-chart2").html("");
    d3.select("#pie-chart3").html("");
    
    // Si no hay estado seleccionado, mostrar mensaje
    if (!selectedState) {
        showNoDataMessage("#pie-chart1", "Seleccione un estado");
        showNoDataMessage("#pie-chart2", "Seleccione un estado");
        showNoDataMessage("#pie-chart3", "Seleccione un estado");
        return;
    }
    
    // Verificar que los datos existan
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn("No hay datos disponibles para los gráficos circulares");
        showNoDataMessage("#pie-chart1", "No hay datos disponibles");
        showNoDataMessage("#pie-chart2", "No hay datos disponibles");
        showNoDataMessage("#pie-chart3", "No hay datos disponibles");
        return;
    }
    
    // Filtrar datos para el estado y año seleccionados
    const filteredData = data.filter(d => 
        d.UF_BENEFICIARIO_BOLSA === selectedState && 
        d.ANO_CONCESSAO_BOLSA == selectedYear
    );
    
    console.log("Datos filtrados para gráficos circulares:", filteredData.length);
    
    // Si no hay datos filtrados, mostrar datos de muestra
    if (filteredData.length === 0) {
        console.log("No hay datos filtrados, usando datos de muestra");
        
        // Crear datos de muestra para cada categoría
        const sampleData = createSamplePieData(selectedState, selectedYear);
        
        // Crear gráficos con datos de muestra
        createPieChart("#pie-chart1", sampleData, "TIPO_BOLSA", "Tipo de Beca", true);
        createPieChart("#pie-chart2", sampleData, "SEXO_BENEFICIARIO_BOLSA", "Género", true);
        createPieChart("#pie-chart3", sampleData, "RACA_BENEFICIARIO_BOLSA", "Etnia", true);
        return;
    }
    
    // Crear gráficos con datos reales
    try {
        createPieChart("#pie-chart1", filteredData, "TIPO_BOLSA", "Tipo de Beca", false);
        createPieChart("#pie-chart2", filteredData, "SEXO_BENEFICIARIO_BOLSA", "Género", false);
        createPieChart("#pie-chart3", filteredData, "RACA_BENEFICIARIO_BOLSA", "Etnia", false);
    } catch (error) {
        console.error("Error al crear gráficos circulares:", error);
        showNoDataMessage("#pie-chart1", "Error al crear gráfico: " + error.message);
        showNoDataMessage("#pie-chart2", "Error al crear gráfico: " + error.message);
        showNoDataMessage("#pie-chart3", "Error al crear gráfico: " + error.message);
    }
}

/**
 * Muestra un mensaje de "sin datos" en el contenedor especificado
 * @param {String} containerId - ID del contenedor
 * @param {String} message - Mensaje a mostrar
 */
function showNoDataMessage(containerId, message = "No hay datos disponibles") {
    d3.select(containerId)
        .append("div")
        .attr("class", "no-data-message")
        .style("text-align", "center")
        .style("padding-top", "50px")
        .style("color", "#666")
        .text(message);
}

/**
 * Crea datos de muestra para gráficos circulares
 * @returns {Array} Datos de muestra
 */
function createSamplePieData(state, year) {
    // Generar entre 50 y 150 registros de muestra
    const count = Math.floor(Math.random() * 100) + 50;
    const sampleData = [];
    
    // Tipos de beca
    const tiposBeca = ["Integral", "Parcial"];
    // Géneros
    const generos = ["F", "M"];
    // Etnias
    const etnias = ["BRANCA", "PRETA", "PARDA", "AMARELA", "INDÍGENA", "NÃO INFORMADO"];
    
    // Generar datos
    for (let i = 0; i < count; i++) {
        sampleData.push({
            UF_BENEFICIARIO_BOLSA: state,
            ANO_CONCESSAO_BOLSA: year,
            TIPO_BOLSA: tiposBeca[Math.floor(Math.random() * tiposBeca.length)],
            SEXO_BENEFICIARIO_BOLSA: generos[Math.floor(Math.random() * generos.length)],
            RACA_BENEFICIARIO_BOLSA: etnias[Math.floor(Math.random() * etnias.length)]
        });
    }
    
    return sampleData;
}

/**
 * Crea un gráfico circular para la categoría especificada
 * @param {String} containerId - ID del contenedor
 * @param {Array} data - Datos filtrados
 * @param {String} categoryField - Campo de la categoría a visualizar
 * @param {String} title - Título del gráfico
 * @param {Boolean} isSampleData - Indica si son datos de muestra
 */
function createPieChart(containerId, data, categoryField, title, isSampleData = false) {
    // Configurar dimensiones
    const container = d3.select(containerId);
    const width = container.node().getBoundingClientRect().width;
    const height = 220;
    const radius = Math.min(width, height) / 2 - 10;
    
    // Actualizar título
    container.select("h4").text(title);
    
    // Crear SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Si son datos de muestra, mostrar indicador
    if (isSampleData) {
        container.append("div")
            .attr("class", "sample-data-notice")
            .style("text-align", "center")
            .style("font-style", "italic")
            .style("font-size", "10px")
            .style("color", "#666")
            .style("margin-top", "-30px")
            .text("(Datos de muestra)");
    }
    
    // Procesar datos para el gráfico
    const categoryCounts = {};
    data.forEach(d => {
        const category = d[categoryField] || "No especificado";
        if (categoryCounts[category]) {
            categoryCounts[category]++;
        } else {
            categoryCounts[category] = 1;
        }
    });
    
    // Convertir a formato de array para D3
    const pieData = Object.keys(categoryCounts).map(category => {
        return {
            category: category,
            value: categoryCounts[category],
            percentage: (categoryCounts[category] / data.length * 100).toFixed(1)
        };
    });
    
    // Ordenar de mayor a menor
    pieData.sort((a, b) => b.value - a.value);
    
    // Limitar a 5 categorías para mejor visualización
    // Combinar el resto en "Otros"
    let processedData = pieData.slice(0, 5);
    if (pieData.length > 5) {
        const others = {
            category: "Otros",
            value: pieData.slice(5).reduce((acc, curr) => acc + curr.value, 0),
            percentage: pieData.slice(5).reduce((acc, curr) => acc + parseFloat(curr.percentage), 0).toFixed(1)
        };
        processedData.push(others);
    }
    
    // Si no hay datos procesados, mostrar mensaje
    if (processedData.length === 0) {
        showNoDataMessage(containerId, "No hay datos para esta categoría");
        return;
    }
    
    // Configurar generador de pie
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    // Configurar arco
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    // Configurar arco para etiquetas
    const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);
    
    // Colores para el gráfico
    const colors = d3.scaleOrdinal()
        .domain(processedData.map(d => d.category))
        .range(["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#af7aa1", "#ff9da7"]);
    
    // Crear un tooltip
    let tooltip = d3.select("body").select(".pie-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip pie-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("text-align", "center")
            .style("padding", "8px")
            .style("background", "white")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
            .style("font", "12px sans-serif");
    }
    
    // Dibujar segmentos
    const segments = svg.selectAll(".arc")
        .data(pie(processedData))
        .enter()
        .append("g")
        .attr("class", "arc");
    
    segments.append("path")
        .attr("d", arc)
        .attr("fill", d => colors(d.data.category))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .on("mouseover", function(event, d) {
            // Resaltar segmento
            d3.select(this)
                .transition()
                .duration(200)
                .attr("d", d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 1.1));
            
            // Mostrar tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.data.category}<br>${d.data.value} (${d.data.percentage}%)`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Restaurar tamaño
            d3.select(this)
                .transition()
                .duration(500)
                .attr("d", arc);
            
            // Ocultar tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Agregar etiquetas
    // Solo mostrar etiquetas para segmentos grandes
    segments.filter(d => parseFloat(d.data.percentage) > 10)
        .append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("dy", ".35em")
        .text(d => `${d.data.percentage}%`)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#fff")
        .style("font-weight", "bold");
    
    // Crear leyenda para el gráfico
    // Solo si hay espacio suficiente
    if (width >= 120) {
        const legendItemHeight = 20;
        const legendItemCount = Math.min(processedData.length, 3); // Mostrar máximo 3 elementos
        const legendHeight = legendItemCount * legendItemHeight;
        const legendStartY = height / 2 - legendHeight / 2;
        
        const legend = svg.selectAll(".legend")
            .data(processedData.slice(0, legendItemCount))
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(-${width/2}, ${legendStartY + i * legendItemHeight})`);
        
        legend.append("rect")
            .attr("x", 0)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => colors(d.category));
        
        legend.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .attr("dy", ".35em")
            .style("font-size", "10px")
            .text(d => {
                // Acortar texto si es muy largo
                let text = d.category;
                if (text.length > 15) {
                    text = text.substring(0, 12) + "...";
                }
                return text;
            });
    }
}