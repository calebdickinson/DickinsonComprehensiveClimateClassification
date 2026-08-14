// ==== CHELSA Last Glacial Maximum COLDEST MONTH climatology ====
// Your assets live here (must end with '/'):
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';
// CHELSA tas_u16 is in deci-Kelvin (0.1 K) → convert to °C: v*0.1 - 273.15

var imgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"

  var minId = ASSET_PREFIX + 'CHELSA_TraCE21k_tasmin_' + mm + '_-200_V1-0';
  var maxId = ASSET_PREFIX + 'CHELSA_TraCE21k_tasmax_' + mm + '_-200_V1-0';

  var rawMin = ee.Image(minId);
  var rawMax = ee.Image(maxId);

  // Mask NoData (65535) on each band separately, then convert to °C
  var tminC = rawMin.updateMask(rawMin.neq(65535))
                     .multiply(0.1)
                     .subtract(273.15);
  var tmaxC = rawMax.updateMask(rawMax.neq(65535))
                     .multiply(0.1)
                     .subtract(273.15);

  // Average tasmin and tasmax to estimate tas for this month
  var tasC = tminC.add(tmaxC)
                   .divide(2)
                   .rename('monthlyMean')
                   .set('month', m);

  imgs.push(tasC);
}
var monthlyMeans = ee.ImageCollection(imgs);

///////////////////////////////////////////////////////////
// Hottest-month: pick the image with highest monthlyMean at each pixel
var hottestC_global = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

// Coldest-month: invert, mosaic, then invert back
var coldestC_global = monthlyMeans
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(50).and(tC.lt(60)),   11) // H: Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   10) // X: Uninhabitable
    .where(tC.gte(30).and(tC.lt(40)),    9) // Z: Hyperequatorial
    .where(tC.gte(20).and(tC.lt(30)),    8) // A: Equatorial
    .where(tC.gte(10).and(tC.lt(20)),    7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),     6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),    5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)),  4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)),  3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)),  2) // G: Arctic
    .where(tC.lt(-40),                   1) // Y: Superarctic
    .rename('coldZone');
}
var coldZone = classifyCold(coldestC_global);

// --- Palette mapping ---
var codeColorMap = {
  11: "#000000", // H: Hypercaneal
  10: "#000000", // X: Uninhabitable
   9: "#00FFFF", // Z: Hyperequatorial
   8: "#C71585", // A: Equatorial
   7: "#FF0000", // B: Tropical
   6: "#FFA500", // C: Subtropical
   5: "#448800", // D: Temperate
   4: "#004400", // E: Continental
   3: "#0000FF", // F: Subarctic
   2: "#FF10F0", // G: Arctic
   1: "#000000"  // Y: Superarctic
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });
var discreteLand = coldZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discreteLand,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (tasmin/tasmax averaged to tas)',
  true,
  0.7
);
// Paste extensions here