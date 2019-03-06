/* global d3 */


document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
      './data/tractData.json',
      './data/tractDataGeoms.geojson'
    ].map(url => fetch(url).then(data => data.json())))
      .then(data => plotChi(data))
    .catch(function(error){
        console.log(`An unexpected error occured: ${error}`);
    });
});

const mapboxKey = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'

function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}


function plotChi(data) {
  // separate datasets
  const [tractData, tractDetails] = data;

  // define svg dimensions
  const height = 800;
  const width = 800;
  const margin = {top: 100, left: 50, right: 100, bottom: 50};

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.bottom - margin.top;

  const mapDet = {
    x: 41.83379,
    y: -87.732125,
    zoom: 10};

  const tractColors = {
    "latinx": "#6d7d53",
    "black": "#9d8e64",
    "asian": "#986769",
    "white": "#30505a"
  }

  const populations = computeDomain(tractData, 'latinxPop');
  console.log(populations);
  const rScale = d3.scaleLinear()
    .domain([populations.min, populations.max])
    .range([1, 15]);

  var mymap = L.map('map').setView(new L.LatLng(41.8500, -87.6298), 10);

  mapboxgl.accessToken = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'; //public key
  var aToken = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'; //public key
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.light',
    accessToken: aToken
}).addTo(mymap);

    // var map = new mapboxgl.Map({
		// 	container: 'map',
		// 	style: 'mapbox://styles/mapbox/light-v9',
		// 	zoom: 9.5,
		// 	center: [-87.6298, 41.8500]
		// });

  // map.on("load", function() {
  //   var fileLoc = './data/Boundaries - Community Areas (current).geojson';
  //   map.addSource("communities", {
  //   "type": "geojson",
  //   "data": fileLoc
  //   });
  //
  //   map.addLayer({
  //     "id": "area-boundaries",
  //     "type": "fill",
  //     "source": "communities",
  //     "paint": {
  //     "fill-color": "transparent",
  //     "fill-outline-color": "#30505a"
  //     }
  //     });
  //
  // });


  var tractPolys = new L.geoJSON(tractDetails, {
    style: function(feature) {
        switch (feature.properties.predominant_race) {
            case 'Latinx': return {color: tractColors.latinx};
            case 'Black':   return {color: tractColors.black};
            case 'Asian':   return {color: tractColors.asian};
            case 'White':   return {color: tractColors.white};
        }
    }
}).addTo(mymap);

var marker = new L.Marker(tractPolys.getBounds().getCenter()).addTo(map);

  //Mapbox + D3 connection

	//Get mapbox basemap container
	var basemap = mymap.getCanvasContainer();

  //Overlay D3 on the map in an svg
  var svg = d3.select(basemap)
    .append("svg")
    .attr('width', width)
    .attr('height', height);


  // Project tract point coordinates to the map's current state
  // function project(d) {
  //   return map.project(new mapboxgl.LngLat(d.long, d.lat));
  // };

  //Project all points in a polygon to map's current state
  // function projectPoint(lon, lat) {
  //   var point = map.project(new mapboxgl.LngLat(lon, lat));
  //   this.stream.point(point.x, point.y);
  // };

  //Projection function for polygons
  // var transform = d3.geoTransform({point:projectPoint});
  // var path = d3.geoPath().projection(transform);

  // var projection = d3.geoMercator(),
  //   path = d3.geoPath(projection);
  //
  // console.log(path([41.974, -87.4003]));
  //
  //
  // var featureElement = svg.selectAll("path")
	// 	.data(tractData)
	// 	.enter()
  //   .append("circle")
  //   .attr("fill", "red")
  //   .attr("fill-opacity", 0.4)
  //   .attr("r", d => rScale(d.latinxPop))
  //   .classed('circle-increased', d => d.fullPeriodChange > 0)
  //   .classed('circle-decreased', d => d.fullPeriodChange < 0)
  //   .classed('predom-black', d => d.predominant_race == 'Black')
  //   .classed('predom-latinx', d => d.predominant_race == 'Latinx')
  //   .classed('predom-asian', d => d.predominant_race == 'Asian')
  //   .classed('predom-white', d => d.predominant_race == 'White');

    // function update() {
    //     featureElement.attr("d", path);
    // }

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
