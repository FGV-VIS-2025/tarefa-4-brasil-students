/**
 * main.js
 * Script principal para la aplicación BraVis Student Scholarship
 * Este archivo maneja la carga de datos y la coordinación entre visualizaciones
 */

// Variables globales
let globalData = [];     // Datos de estudiantes
let geoData = null;      // Datos geográficos de Brasil
let selectedState = "";  // Estado seleccionado actualmente
let selectedYear = "2015"; // Año seleccionado (valor predeterminado)
let selectedCategory = "NOME_TURNO_CURSO_BOLSA"; // Categoría seleccionada (valor predeterminado)

// Inicializar la aplicación cuando se carga la página
document.addEventListener("DOMContentLoaded", function() {
    console.log("Aplicación inicializada, cargando datos...");
    
    // Cargar datos geográficos
    d3.json("data/brazil-states.geojson").then(function(geo) {
        geoData = geo;
        console.log("Datos geográficos cargados correctamente");
        
        // Intentar cargar datos de estudiantes
        d3.csv("data/data.csv").then(function(data) {
            if (data && data.length > 0) {
                console.log("Datos de estudiantes cargados correctamente:", data.length, "registros");
                
                // Convertir datos numéricos a números
                data.forEach(d => {
                    d.ANO_CONCESSAO_BOLSA = +d.ANO_CONCESSAO_BOLSA;
                    // Otros campos numéricos si los hay
                });
                
                globalData = data;
            } else {
                console.warn("No se encontraron datos de estudiantes o el archivo está vacío");
                // Crear datos de muestra para probar la visualización
                globalData = createSampleData();
            }
            
            // Configurar controles
            setupControls();
            
            // Inicializar visualizaciones
            updateVisualizations();
        }).catch(function(error) {
            console.error("Error al cargar datos de estudiantes:", error);
            console.log("Usando datos de muestra para visualización");
            globalData = createSampleData();
            setupControls();
            updateVisualizations();
        });
    }).catch(function(error) {
        console.error("Error al cargar datos geográficos:", error);
        console.log("Intentando cargar datos de muestra...");
        
        // Intentar cargar datos de estudiantes de todos modos
        d3.csv("data/data.csv").then(function(data) {
            globalData = data && data.length > 0 ? data : createSampleData();
            // Intentar cargar un GeoJSON alternativo
            d3.json("https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson")
                .then(function(geo) {
                    geoData = geo;
                    setupControls();
                    updateVisualizations();
                }).catch(function() {
                    // Usar visualizaciones sin mapa
                    setupControls();
                    updateVisualizations();
                });
        }).catch(function() {
            globalData = createSampleData();
            setupControls();
            updateVisualizations();
        });
    });
    
    // Agregar un botón de depuración
    const debugButton = document.createElement("button");
    debugButton.textContent = "Depurar Datos";
    debugButton.style.position = "fixed";
    debugButton.style.bottom = "10px";
    debugButton.style.right = "10px";
    debugButton.style.zIndex = "1000";
    debugButton.style.padding = "5px 10px";
    debugButton.style.backgroundColor = "#f8f8f8";
    debugButton.style.border = "1px solid #ddd";
    debugButton.style.borderRadius = "4px";
    debugButton.style.cursor = "pointer";
    debugButton.addEventListener("click", debugData);
    document.body.appendChild(debugButton);
});

/**
 * Configura los controles de selección
 */
function setupControls() {
    console.log("Configurando controles de selección...");
    
    // Obtener elementos del DOM
    const estadoSelector = document.getElementById("estado-selector");
    const yearSelector = document.getElementById("year-selector");
    const categorySelector = document.getElementById("category-selector");
    
    // Agregar eventos de cambio
    estadoSelector.addEventListener("change", function() {
        selectedState = this.value;
        console.log("Estado seleccionado:", selectedState);
        updateVisualizations();
    });
    
    yearSelector.addEventListener("change", function() {
        selectedYear = this.value;
        console.log("Año seleccionado:", selectedYear);
        updateVisualizations();
    });
    
    categorySelector.addEventListener("change", function() {
        selectedCategory = this.value;
        console.log("Categoría seleccionada:", selectedCategory);
        updateVisualizations();
    });
    
    // Establecer valores iniciales
    selectedState = estadoSelector.value;
    selectedYear = yearSelector.value;
    selectedCategory = categorySelector.value;
    
    console.log("Valores iniciales establecidos:", {
        estado: selectedState,
        año: selectedYear,
        categoría: selectedCategory
    });
}

/**
 * Actualiza todas las visualizaciones basadas en las selecciones actuales
 */
function updateVisualizations() {
    console.log("Actualizando visualizaciones con:", {
        estado: selectedState,
        año: selectedYear,
        categoría: selectedCategory
    });
    
    // Actualizar el mapa
    if (geoData) {
        console.log("Actualizando mapa...");
        updateMap(geoData, selectedState);
    } else {
        console.warn("No se puede actualizar el mapa, no hay datos geográficos disponibles");
        d3.select("#map-container")
            .html("")
            .append("div")
            .attr("class", "error-message")
            .style("color", "red")
            .style("text-align", "center")
            .style("padding", "20px")
            .text("Error: No se pudieron cargar los datos geográficos para el mapa.");
    }
    
    // Actualizar información del estado
    console.log("Actualizando información del estado...");
    updateStateInfo(globalData, selectedState, selectedYear);
    
    // Actualizar gráfico de barras
    console.log("Actualizando gráfico de barras...");
    updateBarChart(globalData, selectedState, selectedYear);
    
    // Actualizar gráficos circulares
    console.log("Actualizando gráficos circulares...");
    updatePieCharts(globalData, selectedState, selectedYear, selectedCategory);
    
    // Actualizar el nuevo gráfico con estilo hecho a mano
    console.log("Actualizando gráfico con estilo hecho a mano...");
    createHandDrawnChart(globalData, selectedState, selectedYear);
}

/**
 * Actualiza la información del estado seleccionado
 */
function updateStateInfo(data, state, year) {
    console.log("Actualizando información de estado:", state, year);
    
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
    
    console.log("Datos filtrados:", filteredData.length, "registros");
    
    // Actualizar total de becas
    totalBecas.textContent = filteredData.length;
    
    // Si no hay datos, mostrar datos de muestra
    if (filteredData.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No hay datos disponibles";
        listaUniversidades.appendChild(li);
        return;
    }
    
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
}

/**
 * Función para crear datos de muestra
 * @returns {Array} Datos de muestra para visualización
 */
function createSampleData() {
    console.log("Creando datos de muestra para visualización");
    
    // Crear un array de estados
    const estados = [
        "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", 
        "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", 
        "RO", "RR", "RS", "SC", "SE", "SP", "TO"
    ];
    
    // Crear datos de muestra para cada estado y año
    const sampleData = [];
    
    // Turnos disponibles
    const turnos = ["Integral", "Matutino", "Vespertino", "Noturno", "A Distância"];
    // Tipos de beca
    const tiposBeca = ["Integral", "Parcial"];
    // Géneros
    const generos = ["F", "M"];
    // Etnias
    const etnias = ["BRANCA", "PRETA", "PARDA", "AMARELA", "INDÍGENA", "NÃO INFORMADO"];
    // Universidades
    const universidades = [
        "Universidad Federal de São Paulo",
        "Universidad de Brasília",
        "Universidad Federal de Rio de Janeiro",
        "Universidad Federal de Minas Gerais",
        "Universidad Estadual de Campinas",
        "Pontificia Universidad Católica",
        "Universidad Federal de Bahia",
        "Universidad Federal de Pernambuco",
        "Universidad Federal de Rio Grande do Sul",
        "Universidad Federal de Santa Catarina"
    ];
    
    // Para cada estado
    estados.forEach(estado => {
        // Para cada año (2015-2022)
        for (let year = 2015; year <= 2022; year++) {
            // Generar entre 50 y 200 registros por estado/año
            const numRegistros = Math.floor(Math.random() * 150) + 50;
            
            for (let i = 0; i < numRegistros; i++) {
                sampleData.push({
                    UF_BENEFICIARIO_BOLSA: estado,
                    ANO_CONCESSAO_BOLSA: year,
                    NOME_TURNO_CURSO_BOLSA: turnos[Math.floor(Math.random() * turnos.length)],
                    TIPO_BOLSA: tiposBeca[Math.floor(Math.random() * tiposBeca.length)],
                    SEXO_BENEFICIARIO_BOLSA: generos[Math.floor(Math.random() * generos.length)],
                    RACA_BENEFICIARIO_BOLSA: etnias[Math.floor(Math.random() * etnias.length)],
                    NOME_IES_BOLSA: universidades[Math.floor(Math.random() * universidades.length)]
                });
            }
        }
    });
    
    console.log(`Datos de muestra creados: ${sampleData.length} registros`);
    return sampleData;
}

/**
 * Función de depuración para verificar el estado de los datos
 */
function debugData() {
    console.log("===== INFORMACIÓN DE DEPURACIÓN =====");
    console.log("Estado de carga de datos:");
    console.log("geoData:", geoData);
    console.log("globalData:", globalData ? `${globalData.length} registros` : "No disponible");
    
    if (globalData && globalData.length > 0) {
        console.log("Campos disponibles:", Object.keys(globalData[0]));
        console.log("Muestra de datos:", globalData[0]);
    }
    
    console.log("Estado seleccionado:", selectedState);
    console.log("Año seleccionado:", selectedYear);
    
    // Verificar si hay datos filtrados para la selección actual
    const filteredCount = globalData.filter(d => 
        d.UF_BENEFICIARIO_BOLSA === selectedState && 
        d.ANO_CONCESSAO_BOLSA == selectedYear
    ).length;
    
    console.log("Datos filtrados para selección actual:", filteredCount);
    console.log("===== FIN DE INFORMACIÓN DE DEPURACIÓN =====");
    
    // Mostrar alerta con información básica
    alert(`Estado de datos:
- Datos geográficos: ${geoData ? "Cargados" : "No disponibles"}
- Datos de estudiantes: ${globalData ? globalData.length + " registros" : "No disponibles"}
- Datos filtrados para ${selectedState} en ${selectedYear}: ${filteredCount} registros
    
Revisa la consola para más detalles (F12 para abrir la consola).`);
}