// 1. Load WorldClim bioclimatic image (1970–2000 averages)
var worldClim = ee.Image('WORLDCLIM/V1/BIO');

// 2. Compute “Min Temperature of Coldest Month” in °F for global
var coldestF_global = worldClim
  .select('bio06')
  .divide(10)              // tenths °C → °C
  .multiply(9/5)
  .add(32);

// 3. Define a reusable classification function (codes 2–10)
function classifyZones(tempF) {
  return ee.Image(0)
    .where(tempF.gte(90),               2)
    .where(tempF.gte(70).and(tempF.lt(90)),   3)
    .where(tempF.gte(50).and(tempF.lt(70)),   4)
    .where(tempF.gte(30).and(tempF.lt(50)),   5)
    .where(tempF.gte(10).and(tempF.lt(30)),   6)
    .where(tempF.gte(-10).and(tempF.lt(10)),  7)
    .where(tempF.gte(-30).and(tempF.lt(-10)), 8)
    .where(tempF.gte(-50).and(tempF.lt(-30)), 9)
    .where(tempF.lt(-50),              10)
    .rename('coldest_month_zone');
}

// 4. Classify the global data
var zonesGlobal = classifyZones(coldestF_global);

// 5. Create an Antarctica mask from the LSIB country boundaries
var antarcticaFC = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Antarctica'));
var antarcticaMask = ee.Image.constant(1)
  .clip(antarcticaFC)
  .rename('antarctica')
  .unmask(0);

// 6. Load ERA5 MONTHLY, convert monthly mean 2 m air temperature to °F,
//    then find the coldest-month temperature over Antarctica
var era5Monthly = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .select('mean_2m_air_temperature')
  .map(function(img) {
    return img
      .subtract(273.15)        // Kelvin → °C
      .multiply(9/5)
      .add(32)
      .rename('tempF')
      .set('system:time_start', img.get('system:time_start'));
  });

var coldestF_antarctica = era5Monthly
  .reduce(ee.Reducer.min())
  .rename('coldest_month_tempF');

// 7. Classify the Antarctica-only data
var zonesAntarctica = classifyZones(coldestF_antarctica);

// 8. Mask each classification to its domain
var zonesGlobalMasked     = zonesGlobal.updateMask(antarcticaMask.eq(0));
var zonesAntarcticaMasked = zonesAntarctica.updateMask(antarcticaMask.eq(1));

// 9. Merge them: Antarctica values override the global ones
var zonesCombined = zonesGlobalMasked.blend(zonesAntarcticaMasked)
  .rename('coldest_month_zone');

// 10. Display with 50% opacity and a nine-color palette
var palette = [
  '#800000','#FF0000','#FFA500','#FFFF00',
  '#008000','#00FFFF','#0000FF','#4B0082',
  '#800080'
];
Map.setCenter(0, 20, 2);
Map.addLayer(
  zonesCombined,
  {min: 2, max: 10, palette: palette},
  'Cold-Month Temp Zones',
  true,  // visible
  0.5    // opacity
);

// 11. Map numeric codes to descriptive names
var zoneNames = {
  2:  'ultratropical (Z)',
  3:  'supertropical (A)',
  4:  'tropical (B)',
  5:  'subtropical (C)',
  6:  'temperate (D)',
  7:  'continental (E)',
  8:  'subarctic (F)',
  9:  'arctic (G)',
  10: 'superarctic (Y)'
};

// 12. Build an info-panel in the lower left
var infoPanel = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '8px',
    backgroundColor: 'rgba(255,255,255,0.7)'
  }
});
var infoLabel = ui.Label('Click on the map to identify zone');
infoPanel.add(infoLabel);
ui.root.add(infoPanel);

// 13. On click, sample the combined zones and update the panel
Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  zonesCombined.reduceRegion({
    reducer:  ee.Reducer.first(),
    geometry: pt,
    scale:    10000
  }).get('coldest_month_zone')
    .evaluate(function(code) {
      var name = zoneNames[code] || 'No data';
      infoLabel.setValue(
        'Coords [' +
          coords.lon.toFixed(2) + ', ' +
          coords.lat.toFixed(2) +
        '] → ' + name
      );
    });
});
