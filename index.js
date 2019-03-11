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
    .attr('height', height)
    .attr('fill', '#fffbe6');

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
  updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth, currentYear);


  const mapUpdate = makeMap(tractData, communityShapes, tractDetails, rScale);
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
    // initiate scale domains
    const wPop = computeDomain(tractData, 'whitePop');
    const aPop = computeDomain(tractData, 'asianPop');

    const incomeDomain = computeDomain(tractData, 'medianIncome');

    // define color scale
    const popColors = d3.scaleQuantize()
      .domain([incomeDomain.min, incomeDomain.max])
      .range(['#f6eff7','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450']);

    // initiate map object
    var mymap = L.map('map', {
      scrollWheelZoom: false,
      renderer: L.svg()
    })
    .setView(new L.LatLng(41.8400, -87.7000), 10);

    // add Mapbox layer
    var aToken = 'pk.eyJ1IjoibGhpbmtzb24iLCJhIjoiY2pzcW52ZnoxMDFyejQ0cGRtZDRtMWppNSJ9.jIRwyua0hfpSpvwjxZcZkQ'; //public key
    var baseMap = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.light',
      accessToken: aToken
  }).addTo(mymap);

  // plot Chicago community area polygons as a base layer
  var communityPolys = new L.geoJSON(communityShapes, {
    style: function communityStyle(feature) {
      return {
          fillColor: "transparent",
          weight: 2,
          opacity: 1,
          color: "#30505a",
          fillOpacity: 0
      };
    },
    }).addTo(mymap);

    // initiate layer groups for overlay layers
    var centerpointlayer = new L.LayerGroup();
    var tracts = new L.LayerGroup();

    return function updateMap(currentYear, property, radiusScale=rScale, colorScale=popColors, map=mymap) {

      const tractColors = {
        "latinx": "#6d7d53",
        "black": "#9d8e64",
        "asian": "#986769",
        "white": "#30505a"
      }

      // add census tract and population circle layers
      addLayer(map, tractDetails, tractColors, currentYear, radiusScale, colorScale, property, centerpointlayer, tracts)
      };

    };

    function addLayer(map, tractDetails, tractColors, currentYear, radiusScale, colorScale, property, centerpointlayer, tracts) {
      console.log("Adding new population layer");

      // Attribution for layer removal on update: Leaflet documentation on Layers
      // https://leafletjs.com/reference-1.4.0.html#layer

      // remove existing non-base layers from map
      tracts.eachLayer(function (layer) {
        map.removeLayer(layer);
      });

      centerpointlayer.eachLayer(function (layer) {
        map.removeLayer(layer);
      });

      // GeoJSON polygons color switch idea and circlemarker placement
      // adapted from Leaflet documentation on GeoJSON functionality:
      // https://leafletjs.com/examples/geojson/

      // add polygons and circle markers for tracts and selected population
      // group in selected year
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
        fillOpacity: 0.45,
        weight: 0.25,
        opacity: 0.5,
        filter: feature => Number(feature.properties.id) === currentYear,

        // approximately 5 billion thank you's to GeoJoeK for this centroid
        // onEachFeature idea I was able to adapt from SO:
        // (https://stackoverflow.com/questions/45626674/leaflet-polygon-center-objects-that-are-useable-by-markercluster)

        // define a point
        onEachFeature: function(feature,layer){
         if (feature.geometry.type == 'Polygon' && feature.properties && feature.properties[property]) {
           var bounds = layer.getBounds();
           var center = bounds.getCenter();
           // console.log(feature)
           L.circleMarker(center,{
           // L.circleMarker([feature.properties.lat, feature.properties.long],{
             radius: radiusScale(feature.properties[property]),
             color: colorScale(feature.properties.medianIncome),
             id: feature.properties.GEOID,
             weight: 0.75,
             opacity: 1,
             fillOpacity: 0.5,
             className: `${feature.properties.GEOID} map-dots`
           }).addTo(centerpointlayer);
         };
       }

     });

      // add colored tracts to layer group, then add to map
      tracts.addLayer(tractPolys);
      map.addLayer(tracts);

      // add population circle markers to map
      map.addLayer(centerpointlayer);

      };

function updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, property, margin, plotHeight, plotWidth, currentYear) {
  const populationMapping = {
      latinxPop: 'Latinx',
      blackPop: 'Black',
      asianPop: 'Asian',
      whitePop: 'White'
    };

  const scattered = plotGroup.selectAll('.circle')
    .data(tractDetails.features.filter( d => d.properties.id == currentYear));

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

    xlabel.enter()
      .append('text')
      .merge(xlabel)
      .attr('class', 'xaxis')
      .attr('x', d => d.xlabelx)
      .attr('y', d => d.xlabely)
      .attr('text-anchor', d=> d.anchor)
      .text(`${populationMapping[property]} Population Percentage of Census Tract`);

};
