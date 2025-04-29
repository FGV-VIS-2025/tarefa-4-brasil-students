// js/main.js

/**
 * Script principal para BraVis Student Scholarship
 */

let globalData = [];    // datos CSV
let geoData = null;     // geojson
let ufKey = null;       // nombre de la columna UF detectada
let anoKey = null;      // nombre de la columna Año detectada

// controles actuales
let selectedState = "";
let selectedYear = "";
let selectedCategory = "";

/**
 * Inicia la carga de datos y la app cuando el DOM esté listo
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("▶ Iniciando aplicación...");

  // 1) Cargar geodatos
  d3.json("data/brazil-states.geojson")
    .then(geo => {
      geoData = geo;
      console.log("✅ Geodatos cargados");
      // 2) Cargar CSV
      return d3.csv("data/data.csv");
    })
    .then(data => {
      if (!data || data.length === 0) {
        throw new Error("CSV vacío o no encontrado");
      }

      // 3) Diagnóstico de columnas
      console.log("Primer registro CSV:", data[0]);
      const keys = Object.keys(data[0]);
      ufKey  = keys.find(k => k.toLowerCase().includes("uf"));
      anoKey = keys.find(k => k.toLowerCase().includes("ano"));
      console.log(`Usando columna UF: '${ufKey}', columna Año: '${anoKey}'`);

      // 4) Parsear año a número
      data.forEach(d => {
        d[anoKey] = +d[anoKey];
      });

      globalData = data;
      console.log(`✅ ${globalData.length} registros cargados`);

    })
    .catch(err => {
      console.error("❌ Error cargando datos:", err);
      // Si quieres datos de muestra, podrías llamar aquí a createSampleData()
      globalData = [];
    })
    .finally(() => {
      setupControls();
      updateVisualizations();

    });
});

/**
 * Configura los select de estado, año y categoría
 */
function setupControls() {
  const estadoSel    = document.getElementById("estado-selector");
  const yearSel      = document.getElementById("year-selector");
  const categorySel  = document.getElementById("category-selector");

  // valores iniciales
  selectedState    = estadoSel.value;
  selectedYear     = yearSel.value;
  selectedCategory = categorySel.value;

  // listeners
  estadoSel.addEventListener("change", () => {
    selectedState = estadoSel.value;
    updateVisualizations();
  });
  yearSel.addEventListener("change", () => {
    selectedYear = yearSel.value;
    updateVisualizations();
  });
  categorySel.addEventListener("change", () => {
    selectedCategory = categorySel.value;
    updateVisualizations();
  });
}

/**
 * Orquesta la actualización de todas las visualizaciones
 */
function updateVisualizations() {
  console.log("🔄 updateVisualizations", { selectedState, selectedYear, selectedCategory });

  // 1) Mapa
  if (geoData) {
    updateMap(geoData, selectedState);
  }

  // 2) Información del estado (nombre, total becas, top universidades)
  updateStateInfo();

  // 3) Actualizar título del bar chart
  const spanTitle = document.getElementById("estado-barchart");
  if (selectedState) {
    const opt = document.querySelector(`#estado-selector option[value="${selectedState}"]`);
    spanTitle.textContent = opt ? opt.text : selectedState;
  } else {
    spanTitle.textContent = "Ninguno seleccionado";
  }

  // 4) Bar Chart
  updateBarChart(globalData, selectedState, selectedYear);

  // 5) Pie Charts
  updatePieCharts(globalData, selectedState, selectedYear, selectedCategory);

  // (No llamamos a handDrawnChart porque ya lo eliminaste)
}

/**
 * Actualiza el bloque de Información del Estado
 * - Nombre del estado
 * - Total de becas
 * - Top 5 universidades
 */
function updateStateInfo() {
  const nombreEl = document.getElementById("estado-nombre");
  const totalEl  = document.getElementById("total-becas");
  const listEl   = document.getElementById("lista-universidades");
  listEl.innerHTML = "";

  if (!selectedState) {
    nombreEl.textContent = "Ninguno seleccionado";
    totalEl.textContent  = "0";
    listEl.innerHTML     = `<li>Seleccione un estado para ver información</li>`;
    return;
  }

  // Nombre legible
  const option = document.querySelector(`#estado-selector option[value="${selectedState}"]`);
  nombreEl.textContent = option ? option.text : selectedState;

  // Filtrar datos usando las columnas detectadas
  const filtered = globalData.filter(d =>
    d[ufKey] === selectedState &&
    d[anoKey] === +selectedYear
  );

  totalEl.textContent = filtered.length;

  if (filtered.length === 0) {
    listEl.innerHTML = `<li>No hay datos disponibles</li>`;
    return;
  }

  // Contar por universidad
  const counts = {};
  filtered.forEach(d => {
    const uni = d.NOME_IES_BOLSA;
    counts[uni] = (counts[uni] || 0) + 1;
  });

  // Top 5
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([uni, cnt]) => {
      const li = document.createElement("li");
      li.textContent = `${uni}: ${cnt} becas`;
      listEl.appendChild(li);
    });
}

/**
 * Agrega un botón de depuración para inspeccionar estado interno en runtime
 */
function addDebugButton() {
  const btn = document.createElement("button");
  btn.textContent = "🛠 Debug";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "12px",
    right: "12px",
    padding: "6px 10px",
    background: "#fff",
    border: "1px solid #ccc",
    cursor: "pointer",
    zIndex: 1000
  });
  btn.addEventListener("click", () => {
    alert(`Debug info:
• geoData cargado: ${!!geoData}
• Registros totales: ${globalData.length}
• Estado seleccionado: ${selectedState}
• Año seleccionado: ${selectedYear}
• Columnas detectadas: UF='${ufKey}', Año='${anoKey}'`);
    console.log({ globalData, selectedState, selectedYear, ufKey, anoKey });
  });
  document.body.appendChild(btn);
}
