// js/main.js

/**
 * Script principal de BraVis Student Scholarship
 */

let globalData = [];   // datos del CSV
let geoData    = null; // geoJSON de Brasil

// Claves dinámicas de columna (detectadas tras cargar CSV)
let ufKey = null;
let anoKey = null;

// Estado de los select
let selectedState    = "";
let selectedYear     = "";
let selectedCategory = "";

// Arranca cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("▶ Iniciando aplicativo...");

  // 1) Cargar geoJSON
  d3.json("data/brazil-states.geojson")
    .then(geo => {
      geoData = geo;
      console.log("✅ Geodatos carregados");
      // 2) Cargar CSV con datos de estudiantes
      return d3.csv("data/data.csv");
    })
    .then(data => {
      if (!data || data.length === 0) {
        throw new Error("CSV vazio ou não encontrado");
      }

      globalData = data;
      console.log("Primeiro registro CSV:", globalData[0]);
      console.log("Campos disponíveis:", Object.keys(globalData[0]).join(", "));

      // Detectar columnas de UF y de Año
      ufKey  = Object.keys(globalData[0]).find(k => k.toLowerCase().includes("uf"));
      anoKey = Object.keys(globalData[0]).find(k => k.toLowerCase().includes("ano"));
      console.log(`→ ufKey='${ufKey}', anoKey='${anoKey}'`);

      // Convertir año a número
      globalData.forEach(d => {
        d[anoKey] = +d[anoKey];
      });
    })
    .catch(err => {
      console.error("❌ Error carregando dados:", err);
      // Opcional: podrías asignar datos de muestra aquí
      globalData = [];
    })
    .finally(() => {
      setupControls();
      updateVisualizations();
      addDebugButton();
    });
});

/**
 * Configura los <select> de estado, año y categoría, con sus listeners
 */
function setupControls() {
  const estadoSel    = document.getElementById("estado-selector");
  const yearSel      = document.getElementById("year-selector");
  const categorySel  = document.getElementById("category-selector");

  // Valores iniciales
  selectedState    = estadoSel.value;
  selectedYear     = yearSel.value;
  selectedCategory = categorySel.value;

  // Listeners
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

  // 1) Mapa de Brasil
  if (geoData) {
    updateMap(geoData, selectedState);
  }

  // 2) Info del estado: nombre, total becas, top universidades
  updateStateInfo();

  // 3) Actualizar título del bar chart
  const bTitle = document.getElementById("estado-barchart");
  if (selectedState) {
    const opt = document.querySelector(`#estado-selector option[value="${selectedState}"]`);
    bTitle.textContent = opt ? opt.text : selectedState;
  } else {
    bTitle.textContent = "Nenhum selecionado";
  }

  // 4) Gráfico de barras
  updateBarChart(globalData, selectedState, selectedYear);

  // 5) Pie charts
  updatePieCharts(globalData, selectedState, selectedYear, selectedCategory);

  // 6) Chart comparativo (“hand drawn”)
  createHandDrawnChart(globalData, selectedState, selectedYear);
}

/**
 * Rellena el bloque de Información del Estado:
 * - Nombre legible del estado
 * - Total de becas
 * - Top 5 universidades
 */
function updateStateInfo() {
  const nombreEl = document.getElementById("estado-nombre");
  const totalEl  = document.getElementById("total-becas");
  const listEl   = document.getElementById("lista-universidades");
  listEl.innerHTML = "";

  if (!selectedState) {
    nombreEl.textContent = "Nenhum selecionado";
    totalEl.textContent  = "0";
    listEl.innerHTML     = `<li>Selecione um estado para ver informação</li>`;
    return;
  }

  // Nombre legible
  const opt = document.querySelector(`#estado-selector option[value="${selectedState}"]`);
  nombreEl.textContent = opt ? opt.text : selectedState;

  // Filtrar por estado y año
  const filtered = globalData.filter(d =>
    d[ufKey] === selectedState &&
    d[anoKey] === +selectedYear
  );

  totalEl.textContent = filtered.length;

  if (filtered.length === 0) {
    listEl.innerHTML = `<li>Não há dados disponíveis</li>`;
    return;
  }

  // Contar becas por universidad
  const counts = {};
  filtered.forEach(d => {
    const uni = d.NOME_IES_BOLSA;
    counts[uni] = (counts[uni] || 0) + 1;
  });

  // Top 5 y añadir al DOM
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
 * Añade un botón flotante de debug para inspeccionar el estado interno
 */
function addDebugButton() {
  const btn = document.createElement("button");
  btn.textContent = "🛠️ Debug";
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
  btn.onclick = () => {
    console.log({
      geoDataExists: !!geoData,
      totalRecords: globalData.length,
      selectedState,
      selectedYear,
      ufKey,
      anoKey
    });
    alert(`Debug info:
• geoData: ${!!geoData}
• Registros: ${globalData.length}
• Estado: ${selectedState}
• Año: ${selectedYear}
• ufKey: ${ufKey}
• anoKey: ${anoKey}`);
  };
  document.body.appendChild(btn);
}
