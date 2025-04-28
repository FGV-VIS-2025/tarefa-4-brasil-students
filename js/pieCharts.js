/**
 * pieCharts.js
 * Script para crear y actualizar los gráficos circulares
 */

/**
 * Actualiza los gráficos circulares basados en los datos filtrados
 * @param {Array} data - Datos de estudiantes
 * @param {String} selectedState - Estado seleccionado
 * @param {Number} selectedYear - Año seleccionado
 * @param {String} selectedCategory - Categoría seleccionada
 */
function updatePieCharts(data, selectedState, selectedYear, selectedCategory) {
    // Limpiar gráficos existentes
    d3.select("#pie-chart1").html("");
    d3.select("#pie-chart2").html("");
    d3.select("#pie-chart3").html("");
    
    // Si no hay estado seleccionado, salir
    if (!selectedState) {
        showNoDataMessage("#pie-chart1");
        showNoDataMessage("#pie-chart2");
        showNoDataMessage("#pie-chart3");
        return;
    }
    
    // Filtrar datos para el estado y año seleccionados
    const filteredData = data.filter(d => 
        d.UF_BENEFICIARIO_BOLSA === selectedState && 
        d.ANO_CONCESSAO_BOLSA == selectedYear
    );
    
    // Si no hay datos, mostrar mensaje
    if (filteredData.length === 0) {
        showNoDataMessage("#pie-chart1");
        showNoDataMessage("#pie-chart2");
        showNoDataMessage("#pie-chart3");
        return;
    }
    
    // Crear gráficos para diferentes categorías
    createPieChart("#pie-chart1", filteredData, "TIPO_BOLSA", "Tipo de Beca");
    createPieChart("#pie-chart2", filteredData, "SEXO_BENEFICIARIO_BOLSA", "Género");
    createPieChart("#pie-chart3", filteredData, "RACA_BENEFICIARIO_BOLSA", "Etnia");
}

/**
 * Muestra un mensaje de "sin datos" en el contenedor especificado
 * @param {String} containerId - ID del contenedor
 */
function showNoDataMessage(containerId) {
    d3.select(containerId)
        .append("div")
        .attr("class", "no-data-message")
        .style("text-align", "center")
        .style("padding-top", "50px")
        .text("No hay datos disponibles");
}

/**
 * Crea un gráfico circular para la categoría especificada
 * @param {String} containerId - ID del contenedor
 * @param {Array} data - Datos filtrados
 * @param {String} categoryField - Campo de la categoría a visualizar
 * @param {String} title - Título del gráfico
 */
function createPieChart(containerId, data, categoryField, title) {
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
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
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
    segments.filter(d => d.data.percentage > 10)
        .append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("dy", ".35em")
        .text(d => `${d.data.percentage}%`)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#fff");
    
    // Crear leyenda para el gráfico
    const legend = svg.selectAll(".legend")
        .data(processedData)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(-${width/2}, ${height/2 - 20 - i * 20})`);
    
    // Solo mostrar leyenda si hay espacio (opcional)
    if (processedData.length <= 3) {
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