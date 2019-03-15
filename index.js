/* global d3 */


document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
      './data/Boundaries - Community Areas (current).geojson',
      './data/tractData.json',
      './data/tractDataGeomsComm.geojson'
    ].map(url => fetch(url).then(data => data.json())))
      .then(data => plotChi(data))
    .catch(function(error){
        console.log(`An unexpected error occured: ${error}`, error);
    });
});

// As demonstrated by Andrew McNutt in class example code
function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}


function plotChi(data) {
  // separate datasets and initiate starting parameters for map and chart
  let currentYear = 2012;
  let mapProperty = 'latinxPop';
  const [communityShapes, tractData, tractDetails] = data;

  // define svg dimensions
  const height = 400;
  const width = 500;

  const margin = {top: 50, left: 75, right: 0, bottom: 50};
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.bottom - margin.top;

  // calculated domains for scales
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


  // Initialize an svg for scatterplot
  var svg = d3.select('.chart-container')
    .append("svg")
    .attr('id', 'chart-area')
    .attr('width', width)
    .attr('height', height);

  // initialize axis scales for scatterplot
  const yScale = d3.scaleLinear()
    .domain([incomeDomain.max, 0])
    .range([margin.top, plotHeight])
    .nice();

  const xScale = d3.scaleLinear()
    .domain([0, wPop.max])
    .range([margin.left, plotWidth])
    .nice();

  // add Axes to scatterplot
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

  svg.append('g')
    .call(d3.axisLeft(yScale))
    .attr('transform', `translate(${margin.left}, 0)`);

  // define group for scatterplot circles
  var plotGroup = svg.append("g")
    .attr('id', 'scatterplot')

  // define scale for scattered and map radii
  const rScale = d3.scaleQuantile()
    .domain([aPop.min, wPop.max])
    .range([2, 4, 6, 8]);

  const source = svg.selectAll('.caption')
    .data([{x: plotWidth - margin.left - margin.right,
            y: plotHeight + (1.5 * margin.bottom),
            anchor: 'middle'}])

  source.enter()
    .append('text')
    .attr('class', 'caption')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('text-anchor', d=> d.anchor)
    .text('Data Source: U.S. Census Bureau, ACS 5-Year Tables')
    .attr('dy', '0.5em');

  // define color scale
  // const popColors = d3.scaleLinear()
  //   .domain([incomeDomain.min, incomeDomain.max])
  //   .range(['#326d3c','#467e4d','#5b905f','#72a170','#8ab280','#a7c28d','#edc876']);

  const popColors = d3.scaleSequential(d3.interpolateYlOrBr).domain([incomeDomain.min, incomeDomain.max])

  // map populations to data properties
  // const propertyMapping = {
  //     Latinx: {population: 'latinxPop', percent: 'latinx_pct', color: '#6d7d53'},
  //     Asian: {population: 'asianPop', percent: 'asian_pct', color: '#986769'},
  //     Black: {population: 'latinxPop', percent: 'latinx_pct', color: '#6d7d53'},
  //     White: {population: 'whitePop', percent: 'latinx_pct', color: '#30505a'},
  const propertyMapping = {
      Latinx: {pop: 'latinxPop', pct: 'latinx_pct'},
      Black: {pop: 'blackPop', pct: 'black_pct'},
      Asian: {pop: 'asianPop', pct: 'asian_pct'},
      White: {pop: 'whitePop', pct: 'white_pct'}
    }

    const tractColors = {
      "latinx": "#6d7d53",
      "black": "#9d8e64",
      "asian": "#986769",
      "white": "#30505a"
    }

    // add y-axis title, which does not change
    const ylabel = svg.selectAll('.yaxis')
      .data([{ylabely: margin.left * 0.10,
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

    // formatting axis tick text to match subtitle
    svg.selectAll('.tick > text')
      .style('font-family', "Roboto");


    // add tooltips
    var tooltip = d3.select(".chart-div-cont.second-one")
      .append("div")
      .attr("class", "tooltip-container")
      .append("div")
      // created as transparent so visibility can be triggered by mouseover
      .style("opacity", 0)
      .attr("class", "tooltip")
      .attr("id", "tooltip-inner");


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
      .classed('radio-label', d => d )
      .text(d => d.group)
        .classed('predom-black', d => d.group === 'Black')
        .classed('predom-asian', d => d.group === 'Asian')
        .classed('predom-latinx', d => d.group === 'Latinx')
        .classed('predom-white', d => d.group === 'White')
    .append('input')
      .attr('name', 'map-filter-radio')
      .attr('class', 'filter-radio')
      .attr('type', 'radio')
      .attr('id', d=> `${d.group}-radio`)
      // merge on property value?
      .merge(clean)
      .on('click', function(d) {

      mapProperty = propertyMapping[d.group]['pop'];
      updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth, currentYear, tooltip);
      mapUpdate(currentYear, mapProperty);
    });

  // display Latinx population scatterplot on page load
  d3.select('#Latinx-radio')
  .attr('checked', true);
  updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth, currentYear, tooltip);

  var buttonLookup = {};
  buttonLookup['2008-2012'] = 2012;
  buttonLookup['2013-2017'] = 2017;

  const mapUpdate = makeMap(communityShapes, tractDetails, rScale, popColors, propertyMapping);

  buttons = d3.select('.button-container')
    .selectAll('button')
    .data(['2008-2012', '2013-2017'])
    .enter()
    .append('button')
    .attr('class', 'button')
    .text(d => d)
    .on('click', function(d) {
      currentYear = buttonLookup[d];
      d3.selectAll('.button.clicked')
        .classed('clicked', false)
      d3.select(this).classed('clicked', d => d)
      mapUpdate(currentYear, mapProperty);
      updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, mapProperty, margin, plotHeight, plotWidth, currentYear);
    });

  // display earlier time period (2008-2012) and Latinx population map
  // on page load
  mapUpdate(currentYear, mapProperty);

  };



  function makeMap(communityShapes, tractDetails, rScale, popColors, propertyMapping) {
    // initiate scale domains

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
      maxZoom: 14,
      minZoom: 10,
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

    mymap.createPane('mapDots');
    // based on Leaflet defaults, 650 z-index should be above all tiles but
    // below tooltips
    mymap.getPane('mapDots').style.zIndex = 650;

    // initiate layer groups for overlay layers
    var centerpointlayer = new L.LayerGroup();
    var tracts = new L.LayerGroup();
    // var centerpointlayer = new L.FeatureGroup();
    // var tracts = new L.FeatureGroup();

    return function updateMap(currentYear, property, radiusScale=rScale, colorScale=popColors, map=mymap, colnames=propertyMapping, yearLayers) {

      const tractColors = {
        "Latinx": "#6d7d53",
        "Black": "#9d8e64",
        "Asian": "#986769",
        "White": "#30505a"
      }

      // add census tract and population circle layers
      addLayer(map, tractDetails, tractColors, currentYear, radiusScale, colorScale, property, centerpointlayer, tracts)
      };

      // map.eachLayer(function (layer) {
      //   map.removeLayer(layer);
      //   // layer.setOpacity(0);
      // });
      //
      // tracts.eachLayer(function (layer) {
      //   map.removeLayer(layer);
      //   // layer.setOpacity(0);
      // });


    };

    function addLayer(map, tractDetails, tractColors, currentYear, radiusScale, colorScale, property, centerpointlayer, tracts) {

      // Attribution for layer removal on update: Leaflet documentation on Layers
      // https://leafletjs.com/reference-1.4.0.html#layer

      centerpointlayer.clearLayers();
      tracts.clearLayers();

      // GeoJSON polygons color switch idea and circlemarker placement
      // adapted from Leaflet documentation on GeoJSON functionality:
      // https://leafletjs.com/examples/geojson/

      // add polygons and circle markers for tracts and selected population
      // group in selected year
      tractPolys = new L.geoJSON(tractDetails, {
        style: function(feature) {
            switch (feature.properties.predominant_race) {
                case 'Latinx': return {color: tractColors.Latinx};
                case 'Black':   return {color: tractColors.Black};
                case 'Asian':   return {color: tractColors.Asian};
                case 'White':   return {color: tractColors.White};
                default: return {color: 'transparent'};
            }
        },
        // style: function(feature) { return {color: colorScale(feature.properties.medianIncome)};},
        // color: feature => tractColors[feature.properties.predominant_race],
        // style: function(feature) { return {color: tractColors[feature.properties.predominant_race]};},
        fillOpacity: 0.45,
        weight: 0.25,
        opacity: 0.5,
        filter: feature => Number(feature.properties.id) === currentYear,
        ZIndex: 400,
        // approximately 5 billion thank you's to GeoJoeK for this centroid
        // onEachFeature idea I was able to adapt from SO:
        // (https://stackoverflow.com/questions/45626674/leaflet-polygon-center-objects-that-are-useable-by-markercluster)

        // define a tract marker at the center of every tract
        onEachFeature: function(feature,layer){
         if (feature.geometry.type == 'Polygon' && feature.properties && feature.properties[property]) {
           var bounds = layer.getBounds();
           var center = bounds.getCenter();
           tractMarker = L.circleMarker(center,{
           // L.circleMarker([feature.properties.lat, feature.properties.long],{
             radius: (Number(feature.properties[property]) === 0) ? 0:radiusScale(feature.properties[property]),
             color: colorScale(feature.properties.medianIncome),
             // color: tractColors[feature.properties.predominant_race],
             weight: 0.75,
             opacity: 1,
             fillOpacity: 0.85,
             ZIndex: 600,
             // learned where to pass custom panes from GIS Stack Exchange:
             // https://gis.stackexchange.com/questions/181870/draw-l-circle-in-a-custom-pane
             pane:'mapDots',
             className: `${feature.properties.GEOID} map-dots circle`
           })
           .bindTooltip(`Community Area: ${feature.properties.community}<br>Total Population: ${feature.properties.population}<br>Group Size: ${feature.properties[property]} (${(100 * (feature.properties[property]/feature.properties.population)).toFixed(2)}%)<br>Median Income: ${feature.properties.medianIncome}<br>Income Change: ${(feature.properties.fullPeriodChange/(feature.properties.fullPeriodChange+feature.properties.medianIncome)).toFixed(2)}%<br>Non-White: ${(100*(1 - feature.properties.white_pct)).toFixed(2)}%`,
             {maxWidth: 150,
              minWidth: 50,
              maxHeight: 150,
              closeButton: false,
              autoPanPadding: L.point(2,2)
          });

           tractMarker.on('mouseover', function (e) {
               this.openTooltip();

               this.setStyle({
                 weight: 3,
                 fillOpacity: 1,
                 // fillColor: tractColors[feature.properties.predominant_race],
                 color: '#edb834',
                 opacity: 1
             });

             // this.bringToFront();
           });

           tractMarker.on('mouseout', function (e) {

             this.closeTooltip();
             // this.resetStyle(e.layer);
             // tractMarker.resetStyle(e.layer);
             // e.layer.resetStyle(tractMarker);
             // layer.resetStyle(tractMarker);
             // layer.resetStyle(tractMarker);
             this.setStyle({
              // color: tractColors[feature.properties.predominant_race],
              color: colorScale(feature.properties.medianIncome),
              weight: 0.75,
              opacity: 1,
              fillOpacity: 0.65,
              fillColor: colorScale(feature.properties.medianIncome)
              // fillColor: tractColors[feature.properties.predominant_race]
            });
          }).addTo(centerpointlayer);

         };
       }
     });

     function resetHighlight(e) {
               tractPolys.resetStyle(e.target);
           }

      function resetHighlight(e) {
         var layer = e.target;
         layer.setStyle(StyleDefault);
     }

      // add colored tracts to layer group, then add to map
      tracts.addLayer(tractPolys);
      tracts.addTo(map);

      // add population circle markers to map
      centerpointlayer.addTo(map);

      };

function updateChart(plotGroup, svg, tractDetails, xScale, yScale, rScale, property, margin, plotHeight, plotWidth, currentYear, tooltip) {
  const populationMapping = {
      latinxPop: {group: 'Latinx', color: "#6d7d53"},
      blackPop: {group: 'Black', color: "#9d8e64"},
      asianPop: {group: 'Asian', color: "#986769"},
      whitePop: {group: 'White', color: "#30505a"}
    };

    // when mouse moves over a circle on chart, nix transparency, add tooltip
    // info, and mark "active"
    var mousemove = function(d) {
      d3.selectAll('.circle.active')
        .classed('active', false)
      d3.select(this).classed('active', d => d);
      // classGEOID = d.properties.GEOID
      // d3.selectAll(`.${classGEOID}`).classed('active', d => d);

      tooltip
        .html(`<b>Community Area:</b> ${d.properties.community}<br><b>Total Population:</b> ${d.properties.population}<br><b>Group Size:</b> ${d.properties[property]} (${(100 * (d.properties[property]/d.properties.population)).toFixed(2)}%)<br><b>Median Income:</b> ${d.properties.medianIncome}<br><b>Income Change:</b> ${(d.properties.fullPeriodChange/(d.properties.fullPeriodChange+d.properties.medianIncome)).toFixed(2)}%<br><b>Non-White:</b> ${(100*(1 - d.properties.white_pct)).toFixed(2)}%`)
        .style('opacity', 0.85)
        // .style('color', populationMapping[property]['color'])
        .style('left', `${d3.mouse(this)[0]}px`)
        .style("top", `${d3.mouse(this)[1] + 15}px`);
    }


    // clear active status and make tooltip transparent when leaving a circle
    var mouseleave = function(d) {
      d3.select(this).classed('active', false);
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0);
    }


    // highlight/ remove highlight on a circle with a click
    var mouseclick = function(d) {
      selected = d3.select(this)
      // Attribution for class-flipping:
      // https://jaketrent.com/post/d3-class-operations/
      selected.classed('active-hold', !selected.classed('active-hold'));
    }


  const scattered = plotGroup.selectAll('.circle')
    // data filtering adapted from example at bl.ocks.org:
    // https://bl.ocks.org/fabiomainardi/00fd581dc5ba92d99eec
    .data(tractDetails.features.filter( d => d.properties.id === currentYear),
          d => `${d.properties.GEOID}`);

  scattered.enter()
    .append('circle')
    .attr('class', d => d.properties.GEOID)
    // .attr('cx', d => margin.left)
    .classed('circle', true)
    .attr('cx', d => xScale(d.properties[property]))
    .attr('cy', d => yScale(d.properties.medianIncome))
    .attr('r', d => (Number(d.properties[property]) === 0) ? 0:rScale(d.properties[property]))
    .attr('id', d => d.properties.GEOID)
    // Addapted idea for adding multiple classes to same selection with classed
    // from benclinkinbeard.com:
    // https://benclinkinbeard.com/d3tips/attrclass-vs-classed/
    .classed('predom-black', d => d.properties.predominant_race === 'Black')
    .classed('predom-latinx', d => d.properties.predominant_race === 'Latinx')
    .classed('predom-asian', d => d.properties.predominant_race === 'Asian')
    .classed('predom-white', d => d.properties.predominant_race === 'White')
    .classed('circle-increased', d => d.properties.fullPeriodChange > 0)
    .classed('circle-decreased', d => d.properties.fullPeriodChange < 0)
    .on("mouseenter", mousemove)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", mouseclick);
    // .attr('cx', d => xScale(d.properties.whitePop))


    scattered
    .classed('predom-black', d => d.properties.predominant_race === 'Black')
    .classed('predom-latinx', d => d.properties.predominant_race === 'Latinx')
    .classed('predom-asian', d => d.properties.predominant_race === 'Asian')
    .classed('predom-white', d => d.properties.predominant_race === 'White')
    .transition().duration(1000)
    .attr('cx', d => xScale(d.properties[property]))
    .attr('cy', d => yScale(d.properties.medianIncome))
    .attr('r', d => (Number(d.properties[property]) === 0) ? 0:rScale(d.properties[property]));


    // adding x-axis title
    const xlabel = svg.selectAll('.xaxis')
      .data([{xlabelx: (plotWidth) / 2,
              xlabely: plotHeight + margin.bottom,
              anchor: 'middle'}])
      .attr('transform', `translate(${margin.left/2}, 0)`);

    xlabel.enter()
      .append('text')
      .merge(xlabel)
      .attr('class', 'xaxis')
      .attr('x', d => d.xlabelx)
      .attr('y', d => d.xlabely)
      .attr('text-anchor', d=> d.anchor)
      .text(`${populationMapping[property]['group']} Population in Census Tract`);

};
