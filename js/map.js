/**
 * map.js
 * Script para renderizar y manejar el mapa interactivo de Brasil
 */

/**
 * Actualiza el mapa de Brasil basado en el estado seleccionado
 * @param {Object} geoData - Datos geográficos de Brasil
 * @param {String} selectedState - Código del estado seleccionado
 */
function updateMap(geoData, selectedState) {
    // Obtener dimensiones del contenedor
    const mapContainer = document.getElementById("map-container");
    const width = mapContainer.clientWidth;
    const height = 400; // Altura fija del mapa
    
    // Limpiar contenido existente
    d3.select("#map-container").html("");
    
    // Si no hay datos geográficos, salir
    if (!geoData) {
        d3.select("#map-container")
            .append("div")
            .attr("class", "error-message")
            .text("Error: No se pudieron cargar los datos geográficos.");
        return;
    }
    
    // Crear elemento SVG
    const svg = d3.select("#map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Configurar proyección geográfica
    const projection = d3.geoMercator()
        .center([-55, -15]) // Centrado en Brasil
        .scale(700)
        .translate([width / 2, height / 2]);
    
    // Crear generador de paths
    const path = d3.geoPath().projection(projection);
    
    // Dibujar estados
    svg.selectAll(".state")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("class", d => {
            // Agregar clase adicional si es el estado seleccionado
            const stateCode = d.properties.sigla;
            return stateCode === selectedState 
                ? "state state-selected" 
                : "state";
        })
        .attr("d", path)
        .attr("fill", d => {
            // Cambiar color si es el estado seleccionado
            const stateCode = d.properties.sigla;
            return stateCode === selectedState ? "orange" : "#e8e8e8";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("click", function(event, d) {
            // Al hacer clic en un estado, actualizar selección
            const stateCode = d.properties.sigla;
            document.getElementById("estado-selector").value = stateCode;
            
            // Disparar evento de cambio para actualizar visualizaciones
            const changeEvent = new Event("change");
            document.getElementById("estado-selector").dispatchEvent(changeEvent);
        })
        .on("mouseover", function(event, d) {
            // Efecto visual al pasar el cursor
            d3.select(this)
                .attr("stroke-width", 2)
                .attr("stroke", "#333");
            
            // Mostrar tooltip con nombre del estado
            const stateName = d.properties.nome;
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(stateName)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Restaurar estilo al quitar el cursor
            d3.select(this)
                .attr("stroke-width", 1)
                .attr("stroke", "#fff");
            
            // Ocultar tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Agregar etiquetas de estado (opcional)
    svg.selectAll(".state-label")
        .data(geoData.features)
        .enter()
        .append("text")
        .attr("class", "state-label")
        .attr("transform", d => `translate(${path.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .text(d => d.properties.sigla);
    
    // Crear tooltip para el mapa
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Agregar zoom y paneo (opcional)
    const zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on("zoom", (event) => {
            svg.selectAll("path")
                .attr("transform", event.transform);
            svg.selectAll(".state-label")
                .attr("transform", d => {
                    const centroid = path.centroid(d);
                    return `translate(${centroid[0] * event.transform.k + event.transform.x}, ${centroid[1] * event.transform.k + event.transform.y})`;
                });
        });
    
    svg.call(zoom);
}