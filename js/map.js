/**
 * map.js
 * Script para renderizar y manejar el mapa interactivo de Brasil
 * Este archivo se encarga de visualizar el mapa con los estados de Brasil
 * y permitir la interacción con ellos.
 */

/**
 * Actualiza el mapa de Brasil basado en el estado seleccionado
 * @param {Object} geoData - Datos geográficos de Brasil
 * @param {String} selectedState - Código del estado seleccionado
 */
function updateMap(geoData, selectedState) {
    console.log("Actualizando mapa con estado:", selectedState);
    
    // Obtener dimensiones del contenedor
    const mapContainer = document.getElementById("map-container");
    const width = mapContainer.clientWidth;
    const height = 400; // Altura fija del mapa
    
    // Limpiar contenido existente
    d3.select("#map-container").html("");
    
    // Si no hay datos geográficos, mostrar mensaje de error y salir
    if (!geoData || !geoData.features || !Array.isArray(geoData.features)) {
        console.error("Datos geográficos no válidos:", geoData);
        d3.select("#map-container")
            .append("div")
            .attr("class", "error-message")
            .style("color", "red")
            .style("text-align", "center")
            .style("padding", "20px")
            .text("Error: No se pudieron cargar los datos geográficos del mapa.");
        return;
    }
    
    console.log("Renderizando mapa con", geoData.features.length, "estados");
    
    // Crear elemento SVG
    const svg = d3.select("#map-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    try {
        // Configurar proyección geográfica
        const projection = d3.geoMercator()
            .center([-55, -15]) // Centrado en Brasil
            .scale(700)
            .translate([width / 2, height / 2]);
        
        // Crear generador de paths
        const path = d3.geoPath().projection(projection);
        
        // Crear un tooltip global (si no existe)
        let tooltip = d3.select("body").select(".map-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip map-tooltip")
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
        
        // Dibujar estados
        svg.selectAll(".state")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("class", d => {
                // Verificar que exista la propiedad sigla
                const stateCode = d.properties && d.properties.sigla ? d.properties.sigla : null;
                return stateCode === selectedState ? "state state-selected" : "state";
            })
            .attr("d", path)
            .attr("fill", d => {
                // Verificar que exista la propiedad sigla
                const stateCode = d.properties && d.properties.sigla ? d.properties.sigla : null;
                return stateCode === selectedState ? "orange" : "#e8e8e8";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("click", function(event, d) {
                // Verificar que exista la propiedad sigla
                if (!d.properties || !d.properties.sigla) {
                    console.warn("Estado sin código (sigla):", d);
                    return;
                }
                
                const stateCode = d.properties.sigla;
                console.log("Estado cliqueado:", stateCode);
                
                // Actualizar selección en el dropdown
                const estadoSelector = document.getElementById("estado-selector");
                if (estadoSelector) {
                    estadoSelector.value = stateCode;
                    
                    // Disparar evento de cambio para actualizar visualizaciones
                    const changeEvent = new Event("change");
                    estadoSelector.dispatchEvent(changeEvent);
                }
            })
            .on("mouseover", function(event, d) {
                // Verificar que exista la propiedad nome
                const stateName = d.properties && d.properties.nome ? d.properties.nome : "Desconocido";
                
                // Resaltar estado
                d3.select(this)
                    .attr("stroke-width", 2)
                    .attr("stroke", "#333");
                
                // Mostrar tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(stateName)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Restaurar estilo
                d3.select(this)
                    .attr("stroke-width", 1)
                    .attr("stroke", "#fff");
                
                // Ocultar tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Agregar etiquetas de estado (opcional para estados grandes)
        svg.selectAll(".state-label")
            .data(geoData.features)
            .enter()
            .append("text")
            .attr("class", "state-label")
            .attr("transform", d => {
                // Verificar que el centroide sea calculable
                try {
                    return `translate(${path.centroid(d)})`;
                } catch (e) {
                    console.warn("No se pudo calcular el centroide para:", d);
                    return "translate(0,0)";
                }
            })
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .attr("fill", "#333")
            .text(d => d.properties && d.properties.sigla ? d.properties.sigla : "");
        
        // Agregar zoom y paneo
        const zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", (event) => {
                svg.selectAll("path")
                    .attr("transform", event.transform);
                
                svg.selectAll(".state-label")
                    .attr("transform", d => {
                        try {
                            const centroid = path.centroid(d);
                            return `translate(${centroid[0] * event.transform.k + event.transform.x}, ${centroid[1] * event.transform.k + event.transform.y})`;
                        } catch (e) {
                            return "translate(0,0)";
                        }
                    });
            });
        
        svg.call(zoom);
        
        // Añadir título al mapa
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Mapa de Brasil");
            
        console.log("Mapa renderizado correctamente");
            
    } catch (error) {
        console.error("Error al renderizar el mapa:", error);
        d3.select("#map-container")
            .html("")
            .append("div")
            .attr("class", "error-message")
            .style("color", "red")
            .style("text-align", "center")
            .style("padding", "20px")
            .text("Error al renderizar el mapa: " + error.message);
    }
}