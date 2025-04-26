const width = 800, height = 600;

// 1. Proyección y path
const projection = d3.geoMercator()
  .scale(800)
  .center([-52, -15])        // centrar en Brasil
  .translate([width/2, height/2]);
const path = d3.geoPath().projection(projection);

// 2. Crear SVG
const svg = d3.select('#mapa')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

// 3. Cargar datos simultáneamente
Promise.all([
    d3.json('data/brazil-states.geojson'),
    d3.csv('data/data.csv', d3.autoType)
  ]).then(([geo, data]) => {
  // a) Dibujar todos los estados
  svg.append('g')
    .selectAll('path')
    .data(geo.features)
    .join('path')
      .attr('class', 'estado')
      .attr('d', path)
      .attr('id', d => d.properties.sigla)
      .on('click', (evt, d) => selEstado(d.properties.sigla));

  // b) Rellenar dropdown
  const ufs = geo.features.map(d => d.properties.sigla).sort();
  const sel = d3.select('#sel-uf');
  sel.selectAll('option')
    .data(['--'].concat(ufs))
    .join('option')
      .attr('value', d => d)
      .text(d => d);
  sel.on('change', () => selEstado(sel.property('value')));

  // c) Función de selección
  function selEstado(uf) {
    // reset estilos
    svg.selectAll('.estado').classed('seleccionado', false);
    if (uf === '--') {
      d3.select('#titulo-estado').text('—');
      d3.select('#stats').text('Aquí aparecerán las estadísticas.');
      return;
    }
    // 1) Resaltar en el mapa
    svg.select(`#${uf}`).classed('seleccionado', true);

    // 2) Filtrar datos Prouni
    const datosUF = data.filter(d => d.SG_UF === uf);

    // 3) Calcular estadísticas
    const total = datosUF.length;
    const porUni = d3.rollup(datosUF, v => v.length, d => d.NO_IES);
    const top5 = Array.from(porUni, ([uni, cnt]) => ({uni, cnt}))
                      .sort((a,b)=>b.cnt-a.cnt).slice(0,5);

    // 4) Mostrar en panel
    d3.select('#titulo-estado').text(`Estado: ${uf}`);
    let html = `<strong>Total becas:</strong> ${total}<br/>
      <strong>Top 5 universidades:</strong><ul>`;
    top5.forEach(o => {
      html += `<li>${o.uni}: ${o.cnt}</li>`;
    });
    html += '</ul>';
    d3.select('#stats').html(html);
  }
});
