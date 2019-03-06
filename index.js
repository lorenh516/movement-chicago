/* global d3 */


document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
      './data/Boundaries - Community Areas (current).geojson',
      './data/tractData.json',
      './data/tractDataGeoms.geojson'
    ].map(url => fetch(url).then(data => data.json())))
      .then(data => plotChi(data))
    .catch(function(error){
        console.log(`An unexpected error occured: ${error}`);
    });
});

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
  const [communityShapes, tractData, tractDetails] = data;

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

  const wPop = computeDomain(tractData, 'whitePop');
  const aPop = computeDomain(tractData, 'asianPop');

  const incomeDomain = computeDomain(tractData, 'medianIncome');
  // console.log(populations);
  const rScale = d3.scaleQuantile()
    .domain([aPop.min, wPop.max])
    .range([2, 4, 6, 8]);

  const popColors = d3.scaleQuantize()
    .domain([incomeDomain.min, incomeDomain.max])
    .range(["#dae0e2","#b6c1c5","#92a3a9","#70868d","#4e6973","#2d4f5a"]);


  var mymap = L.map('map', {
    scrollWheelZoom: false,
    renderer: L.svg()
  })
  .setView(new L.LatLng(41.8500, -87.6298), 10);

  // mapboxgl.accessToken = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'; //public key

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
  function communityStyle(feature) {
    return {
        fillColor: "transparent",
        weight: 2,
        opacity: 1,
        color: "#30505a",  //Outline color
        fillOpacity: 0
    };
}


  var communityPolys = new L.geoJSON(communityShapes, {
    style: communityStyle,
  }).addTo(mymap);


  function yearFilter(feature) {
    if (feature.properties.id == 2012) return true
  };

  var centerpointlayer = L.featureGroup();

  // function tractMarkerOptions(feature, sizeProp, fillProp, strokeProp) {
  //   console.log(rScale(feature.properties[sizeProp]));
  //   return {
  //     radius: rScale(feature.properties[sizeProp]),
  //     fillColor: popColors(feature.properties[fillProp]),
  //     color: function(feature) {
  //     if (feature.properties[strokeProp] > 12140) {
  //       return "darkgreen";
  //     } else if (feature.properties[strokeProp] < -121400) {
  //       return "red"
  //     } else {
  //       return "transparent"
  //     }
  //   },
  //   weight: 0.75,
  //   opacity: 1,
  //   fillOpacity: 0.5
  // };
  // };

  // function onEachTract(feature, sizeProp, colorProp, strokeProp) {
  //     if (feature.geometry.type == 'Polygon' && feature.properties && feature.properties[sizeProp] && feature.properties[colorProp] && feature.properties[strokeProp]) {
  //       var bounds = layer.getBounds();
  //       var center = bounds.getCenter();
  //       centerpointlayer.addLayer(L.circleMarker([feature.properties.lat,
  //         feature.properties.long],
  //         tractMarkerOptions(feature, sizeProp=latinxPop, fillProp=medianIncome, strokeProp=fullPeriodChange)));
  //   };
  // };


  var tractPolys = new L.geoJSON(tractDetails, {
    style: function(feature) {
        switch (feature.properties.predominant_race) {
            case 'Latinx': return {color: tractColors.latinx};
            case 'Black':   return {color: tractColors.black};
            case 'Asian':   return {color: tractColors.asian};
            case 'White':   return {color: tractColors.white};
            default: return {color: 'transparent'};
        }
    },
    fillOpacity: 0.35,
    weight: 0.25,
    opacity: 0.5,
    filter: yearFilter,

    // approximately 5 billion thank you's to GeoJoeK for this centroid
    // onEachFeature idea I was able to adapt from SO:
    // (https://stackoverflow.com/questions/45626674/leaflet-polygon-center-objects-that-are-useable-by-markercluster)
    onEachFeature: function(feature,layer){
     if (feature.geometry.type == 'Polygon' && feature.properties && feature.properties.latinxPop) {
       var bounds = layer.getBounds();
       var center = bounds.getCenter();
       centerpointlayer.addLayer(L.circleMarker([feature.properties.lat, feature.properties.long],{
         radius: rScale(feature.properties.latinxPop),
         color: popColors(feature.properties.medianIncome),
         weight: 0.75,
         opacity: 1,
         fillOpacity: 0.5
       }));
     };
   }
    // onEachFeature: onEachTract
  }).addTo(mymap);

centerpointlayer.addTo(mymap);
// function onEachTract(feature, layer) {
//   // if (feature.geometry.type = 'Polygon' && feature.properties) {
//     var bounds = layer.getBounds();
//     var center = bounds.getCenter();
//     console.log(center);
//     centerpointlayer.addLayer(L.circleMarker(center));
//   };
  //Mapbox + D3 connection

	//Get mapbox basemap container
	// var basemap = mymap.getCanvasContainer();

  //Overlay D3 on the map in an svg
  // var svg = d3.select(basemap)
  //   .append("svg")
  //   .attr('width', width)
  //   .attr('height', height);


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
