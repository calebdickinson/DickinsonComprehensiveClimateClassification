
// 1. Load the WorldClim bioclimatic image (1970–2000 averages)
var worldClim = ee.Image('WORLDCLIM/V1/BIO');

// 2. Compute “Max Temperature of Warmest Month” (bio05) in °F for global
var hottestF_global = worldClim
  .select('bio05')
  .divide(10)              // tenths °C → °C
  .multiply(9/5)
  .add(32);

// 3. Define a reusable classification function for summer zones:
function classifySummer(tempF) {
  return ee.Image.constant(12)  // default = No data (12)
    .where(tempF.gt(120),                                   1)  // Extreme Wasteland
    .where(tempF.gt(110).and(tempF.lte(120)),               2)  // Wasteland
    .where(tempF.gt(100).and(tempF.lte(110)),               3)  // Very Hot Summer
    .where(tempF.gt(90).and(tempF.lte(100)),                4)  // Hot Summer
    .where(tempF.gt(80).and(tempF.lte(90)),                 5)  // Very Warm Summer
    .where(tempF.gt(70).and(tempF.lte(80)),                 6)  // Warm Summer
    .where(tempF.gt(60).and(tempF.lte(70)),                 7)  // Mild Summer
    .where(tempF.gt(50).and(tempF.lte(60)),                 8)  // Cold Summer
    .where(tempF.gt(40).and(tempF.lte(50)),                 9)  // Very Cold Summer
    .where(tempF.gt(30).and(tempF.lte(40)),                10)  // Freezing Summer
    .where(tempF.lte(30),                                   11)  // Frigid Summer
    .rename('hottest_month_zone');
}

// 4. Classify the global data
var zonesGlobal = classifySummer(hottestF_global);

// 5. Build an Antarctica mask from LSIB boundaries
var antarcticaFC = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Antarctica'));
var antarcticaMask = ee.Image.constant(1)
  .clip(antarcticaFC)
  .unmask(0);

// 6. Load ERA5 MONTHLY, convert mean 2 m air temperature to °F,
//    then find each pixel’s warmest‐month temperature over Antarctica
var era5Monthly = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .select('mean_2m_air_temperature')
  .map(function(img) {
    return img
      .subtract(273.15)       // K → °C
      .multiply(9/5)
      .add(32)
      .rename('tempF')
      .set('system:time_start', img.get('system:time_start'));
  });

var hottestF_antarctica = era5Monthly
  .reduce(ee.Reducer.max())
  .rename('hottest_month_tempF');

// 7. Classify the Antarctica‐only data
var zonesAnt = classifySummer(hottestF_antarctica);

// 8. Mask each classification to its domain and blend
var zonesGlobalMasked = zonesGlobal.updateMask(antarcticaMask.eq(0));
var zonesAntMasked    = zonesAnt.updateMask(antarcticaMask.eq(1));
var zonesCombined     = zonesGlobalMasked.blend(zonesAntMasked)
  .rename('hottest_month_zone');

// 9. Display with 50% opacity using a 12-color palette
var palette = [
  '#650000', // 1 Extreme Wasteland (>120°F)
  '#8B0000', // 2 Wasteland (110–120°F)
  '#FF4500', // 3 Very Hot Summer (100–110°F)
  '#FF8C00', // 4 Hot Summer (90–100°F)
  '#FFD700', // 5 Very Warm Summer (80–90°F)
  '#ADFF2F', // 6 Warm Summer (70–80°F)
  '#7FFF00', // 7 Mild Summer (60–70°F)
  '#00FA9A', // 8 Cold Summer (50–60°F)
  '#1E90FF', // 9 Very Cold Summer (40–50°F)
  '#4169E1', // 10 Freezing Summer (30–40°F)
  '#4B0082', // 11 Frigid Summer (<30°F)
  '#ADD8E6'  // 12 No data
];

Map.addLayer(
  zonesCombined,
  {min: 1, max: 12, palette: palette},
  'Warmest‐Month Temp Zones',
  true, 0.5
);

// 10. Map numeric codes to descriptive names
var zoneNames = {
   1: 'Extreme Wasteland (X2)',
   2: 'Wasteland (X1)',
   3: 'Very Hot Summer (Z2)',
   4: 'Hot Summer (Z1)',
   5: 'Very Warm Summer (A2)',
   6: 'Warm Summer (A1)',
   7: 'Mild Summer (B2)',
   8: 'Cold Summer (B1)',
   9: 'Very Cold Summer (C2)',
  10: 'Freezing Summer (C1)',
  11: 'Frigid Summer (Y)',
  12: 'No data'
};

// 11. Build an info‐panel in the lower left
var infoPanel = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '8px',
    backgroundColor: 'rgba(255,255,255,0.7)'
  }
});
var infoLabel = ui.Label('Click on the map to identify summer zone');
infoPanel.add(infoLabel);
ui.root.add(infoPanel);

// 12. On click, sample the combined zones and update the panel
Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  zonesCombined.reduceRegion({
    reducer:  ee.Reducer.first(),
    geometry: pt,
    scale:    10000
  }).get('hottest_month_zone')
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
