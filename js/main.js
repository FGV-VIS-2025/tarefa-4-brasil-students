// js/main.js

/**
 * main.js
 * Script principal para la aplicación BraVis Student Scholarship
 * Este archivo maneja la carga de datos y la coordinación entre visualizaciones
 */

// Variables globales
let globalData = [];           // Datos de estudiantes
let geoData = null;            // GeoJSON de Brasil
let selectedState = "";        // Estado seleccionado
let selectedYear = "2015";     // Año seleccionado por defecto
let selectedCategory = "NOME_TURNO_CURSO_BOLSA"; // Categoría por defecto

// Inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("▶ Aplicación inicializada");

  // 1) Cargar GeoJSON de Brasil
  d3.json("data/brazil-states.geojson")
    .then(geo => {
      geoData = geo;
      console.log("✅ Geodatos cargados");
      return d3.csv("data/data.csv");
    })
    // 2) Cargar CSV de estudiantes
    .then(data => {
      if (data && data.length > 0) {
        console.log(`✅ ${data.length} registros de estudiantes cargados`);
        // Convertir campos numéricos
        data.forEach(d => {
          d.ANO_CONCESSAO_BOLSA = +d.ANO_CONCESSAO_BOLSA;
        });
        globalData = data;
      } else {
        console.warn("⚠ CSV vacío: usando datos de muestra");
        globalData = createSampleData();
      }
    })
    .catch(err => {
      console.error("❌ Error cargando datos:", err);
      console.log("▶ Cargando datos de muestra y Geo alternativo...");
      globalData = createSampleData();
      // Geo alternativo remoto
      return d3.json(
        "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson"
      )
      .then(geo => {
        geoData = geo;
      })
      .catch(() => {
        console.warn("⚠ No se pudo cargar Geo alternativo");
      });
    })
    .finally(() => {
      setupControls();
      updateVisualizations();
      addDebugButton();
    });
});

// Configura los selects y sus listeners
function setupControls() {
  const estadoSel   = document.getElementById("estado-selector");
  const yearSel     = document.getElementById("year-selector");
  const categorySel = document.getElementById("category-selector");

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

  // Valores iniciales
  selectedState    = estadoSel.value;
  selectedYear     = yearSel.value;
  selectedCategory = categorySel.value;
  console.log("Valores iniciales:", { selectedState, selectedYear, selectedCategory });
}

// Llama a todas las actualizaciones de visualizaciones
function updateVisualizations() {
  console.log("🔄 updateVisualizations", { selectedState, selectedYear, selectedCategory });

  // Mapa
  if (geoData) {
    updateMap(geoData, selectedState);
  } else {
    d3.select("#map-container")
      .html("")
      .append("div")
        .attr("class", "error-message")
        .text("Error: no hay datos geográficos disponibles");
  }

  // Info de estado
  updateStateInfo(globalData, selectedState, selectedYear);

  // Bar chart
  updateBarChart(globalData, selectedState, selectedYear);

  // Pie charts
  updatePieCharts(globalData, selectedState, selectedYear, selectedCategory);


}

// Muestra nombre del estado, total de becas y top universidades
function updateStateInfo(data, state, year) {
  const nombreEl   = document.getElementById("estado-nombre");
  const totalEl    = document.getElementById("total-becas");
  const listEl     = document.getElementById("lista-universidades");
  listEl.innerHTML = "";

  if (!state) {
    nombreEl.textContent = "Ninguno seleccionado";
    totalEl.textContent  = "0";
    return;
  }

  const option = document.querySelector(`#estado-selector option[value="${state}"]`);
  nombreEl.textContent = option ? option.text : state;

  const filtered = data.filter(
    d => d.UF_BENEFICIARIO_BOLSA === state && d.ANO_CONCESSAO_BOLSA == year
  );
  totalEl.textContent = filtered.length;

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay datos disponibles";
    listEl.appendChild(li);
    return;
  }

  // Contar becas por universidad
  const counts = {};
  filtered.forEach(d => {
    counts[d.NOME_IES_BOLSA] = (counts[d.NOME_IES_BOLSA] || 0) + 1;
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

// Genera datos aleatorios si falla la carga real
function createSampleData() {
  const states = [
    "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
    "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
    "RO","RR","RS","SC","SE","SP","TO"
  ];
  const turnos      = ["Integral","Matutino","Vespertino","Noturno","A Distância"];
  const tiposBeca   = ["Integral","Parcial"];
  const generos     = ["F","M"];
  const etnias      = ["BRANCA","PRETA","PARDA","AMARELA","INDÍGENA","NÃO INFORMADO"];
  const universidades = [
    "UF São Paulo","UnB","UFRJ","UFMG","Unicamp",
    "PUC","UFBA","UFPE","UFRGS","UFSC"
  ];
  const sample = [];
  states.forEach(uf => {
    for (let y = 2015; y <= 2022; y++) {
      const n = Math.floor(Math.random() * 150) + 50;
      for (let i = 0; i < n; i++) {
        sample.push({
          UF_BENEFICIARIO_BOLSA: uf,
          ANO_CONCESSAO_BOLSA: y,
          NOME_TURNO_CURSO_BOLSA: turnos[Math.floor(Math.random() * turnos.length)],
          TIPO_BOLSA: tiposBeca[Math.floor(Math.random() * tiposBeca.length)],
          SEXO_BENEFICIARIO_BOLSA: generos[Math.floor(Math.random() * generos.length)],
          RACA_BENEFICIARIO_BOLSA: etnias[Math.floor(Math.random() * etnias.length)],
          NOME_IES_BOLSA: universidades[Math.floor(Math.random() * universidades.length)]
        });
      }
    }
  });
  console.log(`🤖 Datos de muestra generados: ${sample.length} registros`);
  return sample;
}

// Agrega un botón flotante para depurar en runtime
function addDebugButton() {
  const btn = document.createElement("button");
  btn.textContent = "Depurar Datos";
  Object.assign(btn.style, {
    position: "fixed", bottom: "10px", right: "10px",
    padding: "6px 12px", background: "#fff", border: "1px solid #ccc",
    cursor: "pointer", zIndex: 1000
  });
  btn.addEventListener("click", () => {
    const filteredCount = globalData.filter(d =>
      d.UF_BENEFICIARIO_BOLSA === selectedState &&
      d.ANO_CONCESSAO_BOLSA == selectedYear
    ).length;
    console.log("🛠️ Debug:", {
      geoDataExists: !!geoData,
      totalRecords: globalData.length,
      filteredCount,
      selected: { selectedState, selectedYear, selectedCategory }
    });
    alert(`Debug info:\n• GeoData: ${geoData? "sí":"no"}\n• Total: ${globalData.length}\n• Filtrados: ${filteredCount}`);
  });
  document.body.appendChild(btn);
}
