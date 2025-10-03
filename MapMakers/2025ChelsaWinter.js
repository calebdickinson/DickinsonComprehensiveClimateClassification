/***** CHELSA monthly tas (°C) from your uploaded assets → Coldest-month classes *****/

// >>> CHANGE THESE <<<
var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets'; // or 'users/<yourname>'
var YEAR = 2025; // e.g., 2025 or 2100

// Helper to build "01".."12"
function pad2(n){ return (n < 10 ? '0' : '') + n; }

// Build a client-side array of monthly asset IDs, then load each as an ee.Image
var monthsJS = [1,2,3,4,5,6,7,8,9,10,11,12];

var tasImages = monthsJS.map(function(m){
  var id = ASSET_ROOT + '/tas_' + YEAR + '_' + pad2(m);  // e.g. projects/.../tas_2100_01
  var date = ee.Date.fromYMD(YEAR, m, 15);
  return ee.Image(id)
    .select(0)                         // band 'b1' from your GeoTIFF
    .rename('monthlyMean')             // downstream code expects this name
    .set('month', m)
    .set('system:time_start', date.millis()); // nice to have for future filtering
});

var monthlyTas = ee.ImageCollection(tasImages);

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

var hottestC = hottestFromMonthly(monthlyTas);
var coldestC = coldestFromMonthly(monthlyTas);

// ---- classification (unchanged) ----
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

// Optional: center map roughly
Map.centerObject(ee.Image(tasImages[0]), 2);

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (coldest month)',
  true, 0.7
);

// Optional: also show the continuous coldest-month temperature
Map.addLayer(coldestC, {min:-40, max:30, palette:['#0011ff','#88ccff','#ffffcc','#ff9900','#cc0000']}, 'Coldest month (°C)', false);
