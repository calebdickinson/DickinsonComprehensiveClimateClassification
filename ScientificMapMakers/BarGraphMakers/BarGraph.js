// ====== CONFIG ======
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16   = 65535;
var SCALE_PR     = 0.1;   // CHELSA pr_u16: 0.1 → mm/month

// Point you care about:
var LAT = 36.1699;      // example: Las Vegas
var LON = -115.1398;
var pt  = ee.Geometry.Point([LON, LAT]);

// Month numbers 1–12
var months = ee.List.sequence(1, 12);

// ====================================
// Load monthly tasmax / tasmin (°C)
// ====================================
var tasmaxImgs = [];
var tasminImgs = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  // tasmax (K*0.1 → °C)
  var rawMax = ee.Image(ASSET_PREFIX + 'CHELSA_tasmax_' + mm + '_1981-2010_V2-1');
  var tmaxC  = rawMax
    .updateMask(rawMax.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tmaxC')
    .set('month', m);
  tasmaxImgs.push(tmaxC);

  // tasmin (K*0.1 → °C)
  var rawMin = ee.Image(ASSET_PREFIX + 'CHELSA_tasmin_' + mm + '_1981-2010_V2-1');
  var tminC  = rawMin
    .updateMask(rawMin.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tminC')
    .set('month', m);
  tasminImgs.push(tminC);
}

var tasmaxMonthly = ee.ImageCollection(tasmaxImgs);
var tasminMonthly = ee.ImageCollection(tasminImgs);

// =====================================
// Load monthly precipitation (mm/month)
// =====================================
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var rawPr = ee.Image(ASSET_PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16');
  var pr = rawPr
    .updateMask(rawPr.neq(NODATA_U16))
    .multiply(SCALE_PR)
    .rename('pr')
    .set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ====== Helpers ======
function atPoint(img, band) {
  var dict = img.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 1000,
    maxPixels: 1e9
  });
  return ee.Number(dict.get(band));
}

// °C → °F, rounded to nearest whole number
function cToF_rounded(num) {
  return num.multiply(9).divide(5).add(32).round();
}

// mm → inches, rounded to nearest tenth
function mmToIn_rounded(num) {
  return num.divide(25.4).multiply(10).round().divide(10);
}

// ====================================
// Build lists of monthly values
// ====================================
var tmaxF = months.map(function(m) {
  m = ee.Number(m);
  var img = tasmaxMonthly.filter(ee.Filter.eq('month', m)).first();
  var valC = atPoint(img, 'tmaxC');
  return cToF_rounded(valC);
});

var tminF = months.map(function(m) {
  m = ee.Number(m);
  var img = tasminMonthly.filter(ee.Filter.eq('month', m)).first();
  var valC = atPoint(img, 'tminC');
  return cToF_rounded(valC);
});

var precipIn = months.map(function(m) {
  m = ee.Number(m);
  var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
  var valMM = atPoint(img, 'pr');
  return mmToIn_rounded(valMM);
});

// ====================================
// Print combined monthly rows ONLY
// Format: "1: high low precip"
// ====================================
var combined = ee.List.sequence(1, 12).map(function(m) {
  m = ee.Number(m);

  var hi = ee.Number(tmaxF.get(m.subtract(1)));
  var lo = ee.Number(tminF.get(m.subtract(1)));
  var pr = ee.Number(precipIn.get(m.subtract(1)));

  // convert to strings with desired decimals
  var hiS = hi.format('%.0f');   // whole °F
  var loS = lo.format('%.0f');   // whole °F
  var prS = pr.format('%.1f');   // one decimal

  return ee.String(m).cat(': ')
    .cat(hiS).cat(' ')
    .cat(loS).cat(' ')
    .cat(prS);
});

// Evaluate and print each line
combined.evaluate(function(list) {
  list.forEach(function(line) {
    print(line);
  });
});
