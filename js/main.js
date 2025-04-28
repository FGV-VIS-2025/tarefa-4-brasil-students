// Variables globales
let globalData = [];     // Datos de estudiantes
let geoData = null;      // Datos geográficos de Brasil
let selectedState = "";  // Estado seleccionado actualmente
let selectedYear = "2015"; // Año seleccionado (valor predeterminado)
let selectedCategory = "NOME_TURNO_CURSO_BOLSA"; // Categoría seleccionada (valor predeterminado)

// Inicializar la aplicación cuando se carga la página
document.addEventListener("DOMContentLoaded", function() {
    // Cargar datos geográficos
// En main.js, busca la parte donde se cargan los datos y sustitúyela por:
        d3.json("data/brazil-states.geojson")
        .catch(() => d3.json("../data/brazil-states.geojson"))
        .catch(() => d3.json("./data/brazil-states.geojson"))
        .catch(() => d3.json("https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson"))
        .then(function(geo) {
            geoData = geo;
            console.log("Datos geográficos cargados correctamente");
            
            // Intentar cargar datos de estudiantes desde varias rutas posibles
            return d3.csv("data/data.csv")
            .catch(() => d3.csv("../data/data.csv"))
            .catch(() => d3.csv("./data/data.csv"))
            .catch(() => {
                console.warn("No se pudo cargar el archivo CSV desde ninguna ruta");
                return [];
            });
        })
        .then(function(data) {
            if (data && data.length > 0) {
            console.log("Datos cargados correctamente:", data.length, "registros");
            console.log("Campos disponibles:", Object.keys(data[0]));
            
            data.forEach(d => {
                d.ANO_CONCESSAO_BOLSA = +d.ANO_CONCESSAO_BOLSA;
            });
            
            globalData = data;
            } else {
            console.warn("No hay datos o el archivo está vacío. Usando datos de muestra.");
            globalData = createSampleData();
            }
            
            setupControls();
            updateVisualizations();
        })
        .catch(function(error) {
            console.error("Error completo:", error);
            alert("Error al cargar datos. Usando datos de muestra.");
            globalData = createSampleData();
            setupControls();
            updateVisualizations();
        });

/**
 * Configura los controles de selección
 */
function setupControls() {
    // Obtener elementos del DOM
    const estadoSelector = document.getElementById("estado-selector");
    const yearSelector = document.getElementById("year-selector");
    const categorySelector = document.getElementById("category-selector");
    
    // Agregar eventos de cambio
    estadoSelector.addEventListener("change", function() {
        selectedState = this.value;
        updateVisualizations();
    });
    
    yearSelector.addEventListener("change", function() {
        selectedYear = this.value;
        updateVisualizations();
    });
    
    categorySelector.addEventListener("change", function() {
        selectedCategory = this.value;
        updateVisualizations();
    });
    
    // Establecer valores iniciales
    selectedState = estadoSelector.value;
    selectedYear = yearSelector.value;
    selectedCategory = categorySelector.value;
}

/**
 * Actualiza todas las visualizaciones basadas en las selecciones actuales
 */
function updateVisualizations() {
    // Actualizar el mapa
    updateMap(geoData, selectedState);
    
    // Actualizar información del estado
    updateStateInfo(globalData, selectedState, selectedYear);
    
    // Actualizar gráfico de barras
    updateBarChart(globalData, selectedState, selectedYear);
    
    // Actualizar gráficos circulares
    updatePieCharts(globalData, selectedState, selectedYear, selectedCategory);
    
    // Actualizar el nuevo gráfico con estilo hecho a mano
    createHandDrawnChart(globalData, selectedState, selectedYear);
}

/**
 * Actualiza la información del estado seleccionado
 */
function updateStateInfo(data, state, year) {
    // Obtener elementos del DOM
    const estadoNombre = document.getElementById("estado-nombre");
    const totalBecas = document.getElementById("total-becas");
    const listaUniversidades = document.getElementById("lista-universidades");
    
    // Limpiar contenido actual
    listaUniversidades.innerHTML = "";
    
    // Si no hay estado seleccionado, mostrar mensaje
    if (!state) {
        estadoNombre.textContent = "Ninguno seleccionado";
        totalBecas.textContent = "0";
        return;
    }
    
    // Obtener nombre completo del estado
    const nombreCompleto = document.querySelector(`#estado-selector option[value="${state}"]`).text;
    estadoNombre.textContent = nombreCompleto;
    
    // Filtrar datos para el estado y año seleccionados
    const filteredData = data.filter(d => 
        d.UF_BENEFICIARIO_BOLSA === state && 
        d.ANO_CONCESSAO_BOLSA == year
    );
    
    // Actualizar total de becas
    totalBecas.textContent = filteredData.length;
    
    // Contar becas por universidad
    const universidadesCount = {};
    filteredData.forEach(d => {
        const universidad = d.NOME_IES_BOLSA;
        if (universidadesCount[universidad]) {
            universidadesCount[universidad]++;
        } else {
            universidadesCount[universidad] = 1;
        }
    });
    
    // Convertir a array y ordenar
    const universidadesArray = Object.keys(universidadesCount).map(uni => {
        return {
            nombre: uni,
            count: universidadesCount[uni]
        };
    });
    
    universidadesArray.sort((a, b) => b.count - a.count);
    
    // Mostrar top 5 universidades
    const top5 = universidadesArray.slice(0, 5);
    top5.forEach(uni => {
        const li = document.createElement("li");
        li.textContent = `${uni.nombre}: ${uni.count} becas`;
        listaUniversidades.appendChild(li);
    });
    
    // Si no hay universidades, mostrar mensaje
    if (top5.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No hay datos disponibles";
        listaUniversidades.appendChild(li);
    }
