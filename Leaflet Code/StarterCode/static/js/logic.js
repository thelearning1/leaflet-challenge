// create tile layers for the map
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// a layer for grayscale
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// a layer for terrain
var terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
});

// make a basemaps object
let basemaps = {
    Default: defaultMap,
    GrayScale: grayscale,
    Terrain: terrain
};

// create map object
var myMap = L.map("map",{
    center: [36.7783, -119.4179],
    zoom: 3,
    layers: [defaultMap, grayscale]
});

// set default map for map
defaultMap.addTo(myMap);

// draw the tectonic plates on the map
let tectonicplates = new L.layerGroup();
// make api call for the plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){   
    // load using geoJson and add to tectonicPlates
    L.geoJson(plateData,{
        // set style parameters to make lines visible
        color: "orange",
        weight: 1.2
    }).addTo(tectonicplates);
});
// add the styled layer to the map
tectonicplates.addTo(myMap);

// create earthquake overlay
let earthquakes = new L.layerGroup();

// acquire earthquake data from USGS and fill to layergroup
// from https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        // circles, radius changes with magnitude, color changes with depth
        // color
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70)
                return "orange";
            else if (depth > 50)
                return "olive";
            else if (depth > 30)
                return "yellow";
            else if (depth > 10)
                return "lime"
            else
                return "green";
        }
        // size of circle
        function radiusSize(mag){
            if (mag == 0)
                return 1;
            else
                return mag * 5;   
        }
        // style each data point with the functions
        function dataStyle(feature){
            return {
                opacity: .8,
                fillOpacity: .4,
                fillColor: dataColor(feature.geometry.coordinates[2]), //pulls depth from JSON
                color: "gray",
                radius: radiusSize(feature.properties.mag) // pulls magnitude from JSON
            }
        }
        // add the earthquake data to the earthquakes layer group
        L.geoJson(earthquakeData, {
                // each feature from the JSON as a circular marker
                // needs feature probably to reference the latLng object through "feature" in the json
                pointToLayer: function(feature, latLng) {
                    return L.circleMarker(latLng);
                },
                // style each marker
                style: dataStyle,
                // make info popups
                onEachFeature: function(feature, layer){
                    layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                    Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                    Location: <b>${feature.properties.place}</b><br>`);
                }
        }).addTo(earthquakes);
    }
);

// add the earthquake layer to the map itself
earthquakes.addTo(myMap);

// establish an overlayer for plates and earthquakes
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// toggle control for the Layers
L.control.layers(basemaps, overlays).addTo(myMap);

// create the map legend
let legend = L.control({
    position: "bottomright"
});

legend.onAdd = function() {
    // create a <div> for the legend
    var div = L.DomUtil.create('div','info legend');
    // set the list to populate with inner html
    let labels = [`<strong>Depth in km</strong>`];
    // set intervals
    let intervals = [-10,10,30,50,70,90];
    // set the color per interval
    let colors = ["green",
        "lime",
        "yellow",
        "olive",
        "orange",
        "red"
    ];
    // loop through intervals/colors to make a square and label
    for(var i = 0; i < intervals.length; i++) {
        // inner html to set the square shape
            div.innerHTML += 
            labels.push(
                '<i class="square" style="background:' + colors[i] + '"></i> '
                + intervals[i] 
                + (intervals[i + 1] ? ' - ' + intervals[i + 1] : '+'));

// sample string for i = 0
//'<i class="square" style="background:green"></1> ' -10 - 10 <br>'

    }
    div.innerHTML = labels.join('<br>');
return div;
};

// actually put the legend on the map
legend.addTo(myMap);