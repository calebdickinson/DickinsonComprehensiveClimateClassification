// ------------------------------
// Prefer CMIP6; fallback to current CMIP5 method
// ------------------------------

// Helper: Kelvin → °C and keep time
function k2cKeepTime(img, newName) {
  return img.subtract(273.15)
            .rename(newName || img.bandNames().get(0))
            .copyProperties(img, ['system:time_start']);
}

// Date / scenario filters
var YEAR_START = 1995;
var YEAR_END   = 2005;
var SCEN       = 'historical';

// --- Candidate 1: CMIP6 (GDDP-CMIP6) using 'tas' directly ---
var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', SCEN))
  .filter(ee.Filter.calendarRange(YEAR_START, YEAR_END, 'year'));

var has6 = cmip6.size().gt(0);

// Build monthly means from CMIP6 'tas' if available
var months = ee.List.sequence(1, 12);
var monthly6 = ee.ImageCollection(
  months.map(function(m) {
    // Convert K→°C per image, then average within month
    var mMean = cmip6
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .select('tas')
      .map(function(img){ return k2cKeepTime(img, 'tasC'); })
      .mean(); // mean of daily tasC over that month range
    return ee.Image(mMean)
      .rename('monthlyMean')
      .set('month', m);
  })
);

// --- Candidate 2: CMIP5 (NEX-GDDP) fallback using (tasmax + tasmin)/2 ---
var cmip5 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', SCEN))
  .filter(ee.Filter.calendarRange(YEAR_START, YEAR_END, 'year'));

var tasmaxC5 = cmip5.select('tasmax').map(function(img){
  return k2cKeepTime(img, 'tasmaxC');
});
var tasminC5 = cmip5.select('tasmin').map(function(img){
  return k2cKeepTime(img, 'tasminC');
});

var monthly5 = ee.ImageCollection(
  months.map(function(m) {
    var maxMean = tasmaxC5.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
    var minMean = tasminC5.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
    return ee.Image(maxMean.add(minMean).divide(2))
      .rename('monthlyMean')
      .set('month', m);
  })
);

// --- Choose CMIP6 if present, otherwise fallback to CMIP5 ---
var monthlyMeans = ee.ImageCollection(ee.Algorithms.If(has6, monthly6, monthly5));

// Extract hottest-month and coldest-month rasters

// Hottest‐month: pick the image with the highest monthlyMean at each pixel
var hottestC_global = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

// Coldest‐month: invert, mosaic, then invert back
var coldestC_global = monthlyMeans
  .map(function(img) {
    return img.multiply(-1).copyProperties(img);
  })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(50).and(tC.lt(60)),   11) // H: Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   10) // X: Uninhabitable
    .where(tC.gte(30).and(tC.lt(40)),   9) // Z: Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),   8) // A: Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2) // G: Arctic
    .where(tC.lt(-40),                  1) // Y: Superarctic
    .rename('coldZone');
}

var coldZone = classifyCold(coldestC_global);

var codeColorMap = {
  11: "#0000FF", // H: Hypercaneal
  10: "#0000FF", // X: Uninhabitable
  9: "#000000", // Z: Ultratropical
  8: "#C71585", // A: Supertropical
  7: "#FF0000", // B: Tropical
  6: "#FFA500", // C: Subtropical
  5: "#008800", // D: Temperate
  4: "#004400", // E: Continental
  3: "#0000FF", // F: Subarctic
  2: "#FFC0CB", // G: Arctic
  1: "#000000"  // Y: Superarctic
};
// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = coldZone
  .remap(codes, indices)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    min:     0,
    max:     indices.length - 1,
    palette: palette
  },
  'Climate',
  true,   // show layer
  0.7     // 70% opacity
);
