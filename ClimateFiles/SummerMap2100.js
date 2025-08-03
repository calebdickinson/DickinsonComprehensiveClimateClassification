// a) NASA/NEX-GDDP
var data = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2099, 2100, 'year'));

// Convert tasmax and tasmin from Kelvin to Celsius
var tasmax = data.select('tasmax')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasmaxC')
      .copyProperties(img, ['system:time_start']);
  });
var tasmin = data.select('tasmin')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasminC')
      .copyProperties(img, ['system:time_start']);
  });

// Build monthly means by averaging tasmax/tasmin
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    var maxMean = tasmax
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    var minMean = tasmin
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    // daily‐mean → monthly‐mean
    return maxMean.add(minMean)
                  .divide(2)
                  .rename('monthlyMean')
                  .set('month', m);
  })
);

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

function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(100).and(tC.lt(150)),  11) // Boiling
    .where(tC.gte(50).and(tC.lt(100)),  10) // Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),  9) // X1: Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8) // Z2: Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7) // Z1: Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6) // A2: Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5) // A1: Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4) // B2: Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3) // B1: Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2) // C2: Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1) // C1: Freezing Summer
    .where(tC.lt(0),                   0) // Y: Frigid Summer
    .rename('warmZone');
}

var warmZone = classifySummer(hottestC_global);

var codeColorMap = {
  11: "#888888", // Boiling
  10: "#0000FF", // Hypercaneal
  9: "#000000", // X: Extreme Hyperthermal Summer
  8: "#550000", // Z2: Hyperthermal Summer
  7: "#C71585", // Z1: Scorching Hot Summer
  6: "#FF0000", // A2: Very Hot Summer
  5: "#FFA500", // A1: Hot Summer
  4: "#FFFF00", // B2: Mild Summer
  3: "#008000", // B1: Cold Summer
  2: "#0000FF", // C2: Very Cold Summer
  1: "#FFC0CB", // C1: Freezing Summer
  0: "#000000"  // Y: Frigid Summer
};

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = warmZone
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
