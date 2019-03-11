/* global d3 */


document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
      './data/Boundaries - Community Areas (current).geojson',
      './data/tractData.json',
      './data/tractDataGeoms.geojson'
    ].map(url => fetch(url).then(data => data.json())))
      .then(data => plotChi(data))
    .catch(function(error){
        console.log(`An unexpected error occured: ${error}`, error);
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
  let currentYear = 2012;
  let mapProperty = 'latinxPop';
  const [communityShapes, tractData, tractDetails] = data;

  // define svg dimensions
  const height = 400;
  const width = 500;

  const wPop = computeDomain(tractDetails.features.map(
    feature => {
    return feature.properties;
  }), 'whitePop');

  const aPop = computeDomain(tractDetails.features.map(
    feature => {
    return feature.properties;
  }), 'asianPop');


  const incomeDomain = computeDomain(tractDetails.features.map(
    feature => {
    return feature.properties;
    }), 'medianIncome')

  const margin = {top: 50, left: 75, right: 25, bottom: 25};
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.bottom - margin.top;

  // Initialize an svg
  var svg = d3.select('.chart-container')
    .append("svg")
    .attr('width', width)
    .attr('height', height);

  const yScale = d3.scaleLinear()
    .domain([incomeDomain.max, 0])
    .range([margin.top, plotHeight])
    .nice();

  const xScale = d3.scaleLinear()
    .domain([0, wPop.max])
    .range([margin.left, plotWidth])
    .nice();

  // add Axes
  svg.append('g')
    .call(d3.axisBottom(xScale))
    .attr('transform', `translate(0, ${plotHeight})`)
    .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)"
                });
    // .attr('transform', `translate(0, ${y(Math.ceil(incomeDomain.min / 10000) * 10000)})`);
  svg.append('g')
    .call(d3.axisLeft(yScale))
    .attr('transform', `translate(${margin.left}, 0)`);

  var plotGroup = svg.append("g")
    .attr('id', 'scatterplot')

  const rScale = d3.scaleQuantile()
    .domain([aPop.min, wPop.max])
    .range([2, 4, 6, 8]);


  const propertyMapping = {
      Latinx: 'latinxPop',
      Black: 'blackPop',
      Asian: 'asianPop',
      White: 'whitePop'
    }


    // adding y-axis title
    const ylabel = svg.selectAll('.yaxis')
      .data([{ylabely: 0,
              ylabelx: -plotHeight * 4/7,
              anchor: 'middle'}])
      .attr('transform', `translate(${margin.left}, 0)`);

      ylabel.enter()
        .append('text')
        .attr('class', 'yaxis')
        .attr('transform', 'rotate(-90)')
        .attr('x', d => d.ylabelx)
        .attr('y', d => d.ylabely)
        .attr('text-anchor', d=> d.anchor)
        .text('Census Tract Median Income')
        .attr('dy', '1em');

    // formatting axis tics to match subtitle
    svg.selectAll('.tick > text')
      .style('font-family', "Roboto");

  // MAKE STATE VARIABLE HERE (WHICH ONE IS SELECTED)
  var checkedRadio = d3.select('input[name="map-filter-radio"]:checked').value;
  console.log(checkedRadio);

  // SAVE JOIN FOR INPUTS
  clean = d3.selectAll(".filter-radio")
      .selectAll('input')
      .data([{'group': 'Latinx', 'value': 'off'},
             {'group': 'Black', 'value': 'off'},
             {'group': 'White', 'value': 'off'},
             {'group': 'Asian', 'value': 'off'}])


  d3.select('.map-filter')
    .selectAll('input')
    .data([{'group': 'Latinx', 'value': 'off'},
           {'group': 'Black', 'value': 'off'},
           {'group': 'White', 'value': 'off'},
           {'group': 'Asian', 'value': 'off'}])
    .enter()
    .append('label')
      .attr('for', d => d.group)
      .text(d => d.group)
    .append('input')
      .attr('name', 'map-filter-radio')
      .attr('class', 'filter-radio')
      .attr('type', 'radio')
      .attr('id', d=> `${d.group}-radio`)
      // merge on property value?
      .merge(clean)
    .on('click', function(d) {

      // $(this).siblings("input:radio").attr("disabled","disabled");
      console.log(propertyMapping[d.group])
      mapProperty = propertyMapping[d.group];
      updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth, currentYear);
      mapUpdate(currentYear, mapProperty);
    });
  // updateChart(plotGroup, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth);

  d3.select('#Latinx-radio')
  .attr('checked', true);

  var baseControl;
  var overlays;

  const mapUpdate = makeMap(tractData, communityShapes, tractDetails, rScale, baseControl, overlays);
  d3.select('.button-container')
    .selectAll('button')
    .data([2012, 2017])
    .enter()
    .append('button')
    .text(d => d)
    .on('click', function(d) {
      currentYear = d;
      mapUpdate(currentYear, mapProperty);
      updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth, currentYear);
    });
  mapUpdate(currentYear, mapProperty);




  };



  function makeMap(tractData, communityShapes, tractDetails, rScale) {

    const wPop = computeDomain(tractData, 'whitePop');
    const aPop = computeDomain(tractData, 'asianPop');

    const incomeDomain = computeDomain(tractData, 'medianIncome');

    const popColors = d3.scaleQuantize()
      .domain([incomeDomain.min, incomeDomain.max])
      .range(['#f6eff7','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450']);

    var mymap = L.map('map', {
      scrollWheelZoom: false,
      renderer: L.svg()
    })
    .setView(new L.LatLng(41.8400, -87.7000), 10);

    var aToken = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'; //public key
    var baseMap = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.light',
      accessToken: aToken
  }).addTo(mymap);


  var communityPolys = new L.geoJSON(communityShapes, {
    style: function communityStyle(feature) {
      return {
          fillColor: "transparent",
          weight: 2,
          opacity: 1,
          color: "#30505a",  //Outline color
          fillOpacity: 0
      };
    },
    }).addTo(mymap);

    var baselayers = {
      "basemap": baseMap,
      "boundaries": communityPolys
    }

    var centerpointlayer = new L.LayerGroup();
    var tracts = new L.LayerGroup();


    return function updateMap(currentYear, property, radiusScale=rScale, colorScale=popColors, map=mymap) {

      const tractColors = {
        "latinx": "#6d7d53",
        "black": "#9d8e64",
        "asian": "#986769",
        "white": "#30505a"
      }

      // removeLayer(mymap, baseControl);
      addLayer(map, tractDetails, tractColors, currentYear, radiusScale, colorScale, property, centerpointlayer, tracts)
      };

    };

    function addLayer(map, tractDetails, tractColors, currentYear, radiusScale, colorScale, property, centerpointlayer, tracts) {
      console.log("Adding new population layer");

      // centerpointlayer = L.featureGroup();
      tracts.eachLayer(function (layer) {
        map.removeLayer(layer);
      });

      centerpointlayer.eachLayer(function (layer) {
        map.removeLayer(layer);
      });

      tractPolys = new L.geoJSON(tractDetails, {
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
        filter: feature => Number(feature.properties.id) === currentYear,

        // approximately 5 billion thank you's to GeoJoeK for this centroid
        // onEachFeature idea I was able to adapt from SO:
        // (https://stackoverflow.com/questions/45626674/leaflet-polygon-center-objects-that-are-useable-by-markercluster)
        onEachFeature: function(feature,layer){
         if (feature.geometry.type == 'Polygon' && feature.properties && feature.properties[property]) {
           var bounds = layer.getBounds();
           var center = bounds.getCenter();
           L.circleMarker([feature.properties.lat, feature.properties.long],{
             radius: radiusScale(feature.properties[property]),
             color: colorScale(feature.properties.medianIncome),
             id: feature.properties.GEOID,
             weight: 0.75,
             opacity: 1,
             fillOpacity: 0.5
           }).addTo(centerpointlayer);
         };
       }

     });

      var overlays = {
         "populations": centerpointlayer,
         "tractsColored": tractPolys
       };


      tracts.addLayer(tractPolys);

      // console.log("checking if tracts")
      // console.log(map.hasLayer(overlays.tractsColored));
      // if (map.hasLayer(tractPolys)) {
      // map.removeLayer(tractPolys);
      // }

      // console.log("checking if circles")
      // console.log(map.hasLayer(centerpointlayer));

      // if (map.hasLayer(centerpointlayer)) {
      // map.removeLayer(centerpointlayer);
        // remove populations control and add back base control
      // map.removeControl(populationsControl);
      // baseCtrl.addTo(map);
      // }

      map.addLayer(tracts);
      map.addLayer(centerpointlayer);
      // remove the current control panel
      // map.removeControl(baseCtrl);

      // populationsControl = L.control.layers(overlays).addTo(map)

      };



function updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, property, margin, plotHeight, plotWidth, currentYear) {
  const populationMapping = {
      latinxPop: 'Latinx',
      blackPop: 'Black',
      asianPop: 'Asian',
      whitePop: 'White'
    }

  const scattered = plotGroup.selectAll('.circle')
    .data(tractDetails.features.filter( d => d.properties.id == currentYear))

  scattered.enter()
    .append('circle')
    .merge(scattered)
    .attr('class', 'circle')
    .attr('cx', d => xScale(d.properties.whitePop))
    .attr('cy', d => yScale(d.properties.medianIncome))
    // .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('r', d => rScale(d.properties[property]))
    .attr('id', d => d.properties.GEOID)
    .attr('class', function(d) {
      if (d.properties.predominant_race == 'Black') {
        return 'predom-black'}
      else if (d.properties.predominant_race == 'Latinx') {
        return 'predom-latinx'}
      else if (d.properties.predominant_race == 'Asian') {
        return 'predom-asian'}
      else {return 'predom-white'}
    })
    // idea for adding multiple classes to same selection from benclinkinbeard.com
    // https://benclinkinbeard.com/d3tips/attrclass-vs-classed/
    .classed('circle', d => d.GEOID === d.GEOID)
    .classed('circle-increased', d => d.properties.fullPeriodChange > 0)
    .classed('circle-decreased', d => d.properties.fullPeriodChange < 0);

    // adding x-axis title
    const xlabel = svg.selectAll('.xaxis')
      .data([{xlabelx: (plotWidth) / 2,
              xlabely: plotHeight + margin.bottom + 30,
              anchor: 'middle'}])
      .attr('transform', `translate(${margin.left/2}, 0)`);

    console.log(`${populationMapping[property]} Population Percentage of Census Tract`)
    xlabel.enter()
      .append('text')
      .merge(xlabel)
      .attr('class', 'xaxis')
      .attr('x', d => d.xlabelx)
      .attr('y', d => d.xlabely)
      .attr('text-anchor', d=> d.anchor)
      .text(`${populationMapping[property]} Population Percentage of Census Tract`)





};



// function removeLayer(map, overlays) {
//   console.log("Removing populations layer");
//   // map.removeLayer(populations);
//
//
//
//   if (map.hasLayer(overlays.tractsColored)) {
//     map.removeLayer(overlays.tractsColored);
//   };
//
//   if (map.hasLayer(overlays.populations)) {
//     map.removeLayer(overlays.populations);
//   };



  // remove populations control and add back base control
  // map.removeControl(overlaysControl);
  // baseControl.addTo(map);
// };

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
