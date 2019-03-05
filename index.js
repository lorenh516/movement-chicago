/* global d3 */


document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
      './data/Boundaries - Community Areas (current).geojson',
      './data/tractDataGeoms.geojson'
    ].map(url => fetch(url).then(data => data.json())))
      .then(data => plotChi(data))
    .catch(function(error){
        console.log(`An unexpected error occured: ${error}`);
    });
});

const mapboxKey = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'

function plotChi(data) {
  // separate datasets
  const [communityShapes, tractDetails] = data;

  // define svg dimensions
  const height = 800;
  const width = 800;
  const margin = {top: 100, left: 50, right: 100, bottom: 50};

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.bottom - margin.top;

  const map_det = {
    x: 41.83379,
    y: -87.732125,
    zoom: 10};

  mapboxgl.accessToken = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'; //public key
		var map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/light-v9',
			zoom: 9.5,
			center: [-87.6298, 41.8500]
		});

  map.on("load", function() {
    var fileLoc = './data/Boundaries - Community Areas (current).geojson';
    map.addSource("communities", {
    "type": "geojson",
    "data": fileLoc
    });

  map.addLayer({
    "id": "area-boundaries",
    "type": "fill",
    "source": "communities",
    "paint": {
    "fill-color": "transparent",
    "fill-outline-color": "#30505a"
    }
    });
});
		//Mapbox + D3 connection

	//Get mapbox basemap container
	var basemap = map.getCanvasContainer();

  //Overlay D3 on the map
  var svg = d3.select(basemap)
    .append("svg")
    .attr('width', width)
    .attr('height', height);

  //Projection function
  var transform = d3.geoTransform({point:projectPoint});
  var path = d3.geoPath().projection(transform);

  //Project geojson coordinate to the map's current state
  function project(d) {
    return map.project(new mapboxgl.LngLat(+d[0], +d[1]));
  }

  //Project any point to map's current state
  function projectPoint(lon, lat) {
    var point = map.project(new mapboxgl.LngLat(lon, lat));
    this.stream.point(point.x, point.y);
  }



  // max/ min code adapted from textbook (Interactive Data Visualization for
  // the Web)
//   const incomeDomain = {
//     max: d3.max(data, function(d) {
//     return d.medianIncome;
//   }),
//     min: d3.min(data, function(d) {
//     return d.medianIncome;
//   })
// };

//   const maxPct = d3.max(data, function(d) {
//     return d.latinx_pct;
//   });

//   const x = d3.scaleLinear()
//     .domain([maxPct, 0])
//     .range([margin.left, plotWidth])
//     .nice();
//   const y = d3.scaleLinear()
//     .domain([incomeDomain.max, 0])
//     .range([plotHeight, margin.top])
//     .nice();
//   const rScale = d3.scaleLinear()
//     .domain([0, d3.max(data, function(d) {
//       return d.population; })])
//     .range([3, 15]);


  // add Axes
  // svg.append('g')
  //   .call(d3.axisTop(x))
  //   .attr('transform', `translate(0, ${margin.top})`);
  //   // .attr('transform', `translate(0, ${y(Math.ceil(incomeDomain.min / 10000) * 10000)})`);
  // svg.append('g')
  //   .call(d3.axisRight(y))
  //   .attr('transform', `translate(${plotWidth}, 0)`);


  // var plotGroup = svg.append("g")
  //   .attr('id', 'scatterplot')

  // const scattered = plotGroup.selectAll('.circle')
  //   .data(data);

  // scattered.enter()
  //   .append('circle')
  //   // .attr('class', 'circle')
  //   .attr('cx', d => x(d.latinx_pct))
  //   .attr('cy', d => y(d.medianIncome))
  //   // .attr('transform', `translate(${margin.left}, ${margin.top})`)
  //   .attr('r', d => rScale(d.population * d.latinx_pct))
  //   .attr('class', function(d) {
  //     if (d.predominant_race == 'Black') {
  //       return 'predom-black'}
  //     else if (d.predominant_race == 'Latinx') {
  //       return 'predom-latinx'}
  //     else {return 'predom-white'}
  //   })
  //   // idea for adding multiple classes to same selection from benclinkinbeard.com
  //   // https://benclinkinbeard.com/d3tips/attrclass-vs-classed/
  //   .classed('circle', d => d.id == d.id)
  //   .classed('circle-increased', d => d.fullPeriodChange > 0)
  //   .classed('circle-decreased', d => d.fullPeriodChange < 0);


  };
