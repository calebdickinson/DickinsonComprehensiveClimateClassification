/***** CHELSA monthly tas (°C) → Coldest-month classes, 2175 = 2100 + (2100−2025) *****/

var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets'; // or 'users/<yourname>'

// Helper to build "01".."12"
function pad2(n){ return (n < 10 ? '0' : '') + n; }
var monthsJS = [1,2,3,4,5,6,7,8,9,10,11,12];

// ---- loader for one month's tas (°C already) ----
function loadTas(year, m){
  var id = ASSET_ROOT + '/tas_' + year + '_' + pad2(m);
  var date = ee.Date.fromYMD(year, m, 15);
  return ee.Image(id)
    .select(0)                         // band 'b1'
    .rename('monthlyMean')             // downstream expects this
    .set('month', m)
    .set('system:time_start', date.millis());
}

// ---- build 2025, 2100, and projected 2175 stacks ----
var tas2025 = ee.ImageCollection(monthsJS.map(function(m){ return loadTas(2025, m); }));
var tas2100 = ee.ImageCollection(monthsJS.map(function(m){ return loadTas(2100, m); }));

// 2175 = 2100 + (2100 − 2025)  ==  2025 + 2Δ
var tas2175 = ee.ImageCollection(ee.List.sequence(1,12).map(function(m){
  m = ee.Number(m);
  var t25 = tas2025.filter(ee.Filter.eq('month', m)).first().select('monthlyMean');
  var t00 = tas2100.filter(ee.Filter.eq('month', m)).first().select('monthlyMean');
  var dT  = t00.subtract(t25);
  var t75 = t00.add(dT).rename('monthlyMean'); // double the 2025→2100 change beyond 2100
  return t75.set('month', m);
}));

// ---- hottest/coldest helpers (unchanged) ----
function hottestFromMonthly(monthlyIC) {
  return monthlyIC.qualityMosaic('monthlyMean')
                  .select('monthlyMean').rename('hottestC');
}
function coldestFromMonthly(monthlyIC) {
  return monthlyIC.map(function (img) { return img.multiply(-1).copyProperties(img); })
                  .qualityMosaic('monthlyMean')
                  .multiply(-1)
                  .select('monthlyMean').rename('coldestC');
}

// Use the projected 2175 temps
var hottestC = hottestFromMonthly(tas2175);
var coldestC = coldestFromMonthly(tas2175);

// ---- classification (unchanged thresholds) ----
function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(50).and(tC.lt(60)),   11) // H: Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   10) // X: Uninhabitable
    .where(tC.gte(30).and(tC.lt(40)),    9) // Z: Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),    8) // A: Supertropical
    .where(tC.gte(10).and(tC.lt(20)),    7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),     6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),    5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)),  4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)),  3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)),  2) // G: Arctic
    .where(tC.lt(-40),                   1) // Y: Superarctic
    .rename('coldZone');
}

var coldZone = classifyCold(coldestC);

// ---- palette & rendering (unchanged) ----
var codeColorMap = {
  11: "#0000FF", // H: Hypercaneal
  10: "#0000FF", // X: Uninhabitable
  9:  "#000000", // Z: Ultratropical
  8:  "#C71585", // A: Supertropical
  7:  "#FF0000", // B: Tropical
  6:  "#FFA500", // C: Subtropical
  5:  "#008800", // D: Temperate
  4:  "#004400", // E: Continental
  3:  "#0000FF", // F: Subarctic
  2:  "#FF10F0", // G: Arctic
  1:  "#000000"  // Y: Superarctic
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = coldZone
  .remap(codes, indices)
  .rename('classIndex');

// Optional: center on an existing footprint (use any known asset)
Map.centerObject(ee.Image(ASSET_ROOT + '/tas_2100_01'), 2);

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (coldest month, 2175 projection)',
  true, 0.7
);
