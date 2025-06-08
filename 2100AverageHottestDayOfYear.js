// paste this in address bar and paste this code in new script box
// https://code.earthengine.google.com/

// ===========================================
// 1. LOAD RCP8.5 NEX-GDDP DAILY MAX TEMPS FOR 2100
// ===========================================
var future = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2100, 2100, 'year'))
  .select('tasmax');

// ===========================================
// 2. CONVERT TO FAHRENHEIT
// ===========================================
var tasmaxF = future.map(function(img) {
  return img.subtract(273.15).multiply(9/5).add(32)
            .rename('tasmaxF')
            .copyProperties(img, ['system:time_start']);
});

// ===========================================
// 3. REDUCE TO MAXIMUM TEMPERATURE OF THE YEAR
// ===========================================
var hottest = tasmaxF.reduce(ee.Reducer.max()).rename('hottestTempF');

// ===========================================
// 4. BUILD DISCRETE COLOR CLASS ZONES
// ===========================================
var binEdges = ee.List.sequence(30, 170, 10);
var colors = [
  '#A0A0A0', '#808080', '#606060', '#404040', '#202020',  // 30–80°F (gray)
  '#007FFF', '#00FFFF', '#00FF00', '#FFFF00', '#FFA500',  // 80–130°F (cool → hot)
  '#FF4500', '#FF0000', '#800000', '#8B008B'              // 130–170°F (extreme heat)
];

// Initialize classified image
var classified = ee.Image(0);

// Assign numeric class per bin (1–14)
for (var i = 0; i < binEdges.length().getInfo() - 1; i++) {
  var minEdge = ee.Number(binEdges.get(i));
  var maxEdge = ee.Number(binEdges.get(i + 1));
  var zone = hottest.gte(minEdge).and(hottest.lt(maxEdge)).multiply(i + 1);
  classified = classified.where(zone.eq(i + 1), i + 1);
}

// ===========================================
// 5. DISPLAY COLORED ZONES (BUT NOT VALUES)
// ===========================================
Map.setCenter(0, 20, 2);
Map.addLayer(classified, {
  min: 1,
  max: colors.length,
  palette: colors
}, 'Max Temp Zones (10°F steps)');

// ===========================================
// 6. CLICK TO PRINT EXACT VALUE (°F)
// ===========================================
Map.onClick(function(coords) {
  var pt = ee.Geometry.Point(coords.lon, coords.lat);
  hottest.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 25000,
    maxPixels: 1e8
  }).get('hottestTempF').evaluate(function(val) {
    print('Hottest daily max in 2100: ' +
      (val !== null ? val.toFixed(2) + ' °F' : 'No data'));
  });
});
