// js/map.js

/**
 * map.js
 * Script para renderizar y manejar el mapa interactivo de Brasil
 */

/**
 * Actualiza el mapa de Brasil basado en el estado seleccionado.
 *
 * @param {Object} geoData        – GeoJSON de Brasil
 * @param {string} selectedState  – Código UF del estado seleccionado (ej. "MT")
 */
function updateMap(geoData, selectedState) {
    console.log("Atualizando mapa, estado:", selectedState);
  
    const container = d3.select("#map-container");
    // 1) Limpiar contenido previo
    container.html("");
    const width  = container.node().clientWidth;
    const height = 400;
  
    // 2) Validar geoData
    if (!geoData || !Array.isArray(geoData.features)) {
      container.append("div")
        .attr("class", "error-message")
        .style("color", "red")
        .style("text-align", "center")
        .style("padding", "20px")
        .text("Error: não foi possível carregar os dados geográficos do mapa.");
      return;
    }
  
    // 3) Crear SVG
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);
  
    // 4) Configurar proyección y path
    const projection = d3.geoMercator()
      .center([-55, -15])       // centrar en Brasil
      .scale(width * 1.3)       // escala proporcional al ancho
      .translate([width/2, height/2]);
    const path = d3.geoPath().projection(projection);
  
    // 5) Preparar tooltip (solo uno para todo el mapa)
    let tooltip = d3.select("body").select(".map-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "tooltip map-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("background", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 1px 3px rgba(0,0,0,0.3)")
        .style("font", "12px sans-serif");
    }
  
    // 6) Dibujar cada estado
    svg.selectAll(".state")
      .data(geoData.features)
      .enter().append("path")
        .attr("class", d => {
          const code = d.properties.sigla;
          return code === selectedState ? "state state-selected" : "state";
        })
        .attr("d", path)
        .attr("fill", d => {
          const code = d.properties.sigla;
          return code === selectedState ? "orange" : "#e8e8e8";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("click", (event, d) => {
          const code = d.properties.sigla;
          if (!code) return;
          d3.select("#estado-selector")
            .property("value", code)
            .dispatch("change");
        })
        .on("mouseover", (event, d) => {
          // 6.1) Determinar nombre del estado dinámicamente
          const props   = d.properties || {};
          const nameKey = Object.keys(props).find(k => /nome|name|nm_/i.test(k));
          const stateName = nameKey
            ? props[nameKey]
            : (props.sigla || "Sin nombre");
          console.log("Hover propiedades:", props, "→ nameKey:", nameKey, "→ stateName:", stateName);
  
          // 6.2) Resaltar
          d3.select(event.currentTarget)
            .attr("stroke-width", 2)
            .attr("stroke", "#333");
  
          // 6.3) Mostrar tooltip
          tooltip.html(stateName)
            .style("left", (event.pageX + 10) + "px")
            .style("top",  (event.pageY - 28) + "px")
            .transition().duration(200)
            .style("opacity", 0.9);
        })
        .on("mouseout", (event, d) => {
          // Restaurar estilo
          d3.select(event.currentTarget)
            .attr("stroke-width", 1)
            .attr("stroke", "#fff");
          // Ocultar tooltip
          tooltip.transition().duration(200)
            .style("opacity", 0);
        });
  
    // 7) Etiquetas (siglas) en el centro de cada estado
    svg.selectAll(".state-label")
      .data(geoData.features)
      .enter().append("text")
        .attr("class", "state-label")
        .attr("transform", d => {
          const centroid = path.centroid(d);
          return `translate(${centroid[0]},${centroid[1]})`;
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .text(d => d.properties.sigla || "");
  
    // 8) Zoom y paneo
    const zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", event => {
        svg.selectAll("path").attr("transform", event.transform);
        svg.selectAll(".state-label").attr("transform", d => {
          const centroid = path.centroid(d);
          const [x, y]   = [
            centroid[0] * event.transform.k + event.transform.x,
            centroid[1] * event.transform.k + event.transform.y
          ];
          return `translate(${x},${y})`;
        });
      });
    svg.call(zoom);
  
    console.log("Mapa renderizado corretamente");
  }
  