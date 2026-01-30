// ==== CHELSA v2.1 tas COLDEST MONTH climatology (2011–2040) ====
// Your assets live here (must end with '/'):
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';

// CHELSA tas_u16 is in deci-Kelvin (0.1 K) → convert to °C: v*0.1 - 273.15
var imgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2011_2040_norm';

  var raw = ee.Image(id);
  
  // Minimal: mask only NoData (65535), then convert to °C
  var tempC = raw.updateMask(raw.neq(65535)) // mask UInt16 NoData
                 .multiply(0.1)              // 0.1 K
                 .subtract(273.15)           // → °C
                 .rename('monthlyMean')
                 .set('month', m);

  imgs.push(tempC);
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

var coldZone = classifyCold(coldestC_global);

// --- Palette mapping ---
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
  'Climate (WorldClim tavg only)',
  true,
  0.7
);

// ======================================================
// World thumbnail: climate + admin-0 and admin-1 borders
// ======================================================

// ---------- Non-geodesic world rectangle ----------
var world = ee.Geometry.Rectangle(
  [-180, -90, 180, 90],
  null,
  false
);

// ---------- Climate overlay ----------
var climateRGB = discreteLand.visualize({
  min: 0,
  max: indices.length - 1,
  palette: palette
});

// ---------- Admin-0 borders ----------
var admin0Clean = ee.Image(
  'projects/ordinal-crowbar-459807-m2/assets/gaul0_georef'
);

var admin0RGB = admin0Clean
  .select(['b1', 'b2', 'b3'])            // RGB
  .updateMask(admin0Clean.select('b4'))  // alpha
  .rename(['vis-red', 'vis-green', 'vis-blue']);
  
// ---------- Admin-1 borders (CLEAN raster asset) ----------
var admin1Clean = ee.Image(
  'projects/ordinal-crowbar-459807-m2/assets/gaul1_georef'
);

var admin1RGB = ee.Image(1)
  .updateMask(admin1Clean.select('b4')) // alpha
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// ---------- Composite ----------
var composite = ee.ImageCollection([
  climateRGB,
  admin1RGB,
  admin0RGB,
]).mosaic();

// ---------- PNG thumbnail ----------
var thumbUrl = composite.getThumbURL({
  region: world,
  dimensions: '4096x2048',
  format: 'png'
});

print('World thumbnail URL:', thumbUrl);

