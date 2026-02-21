// ==== CHELSA v2.1 tas HOTTEST MONTH climatology (1981–2010) ====
// Your assets live here (must end with '/'):
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';

// CHELSA tas_u16 is in deci-Kelvin (0.1 K) → convert to °C: v*0.1 - 273.15
var imgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

  var raw = ee.Image(id);

  // Minimal: mask only NoData (65535), then convert to °C
  var tempC = raw.updateMask(raw.neq(65535))
                 .multiply(0.1)
                 .subtract(273.15)
                 .rename('monthlyMean')
                 .set('month', m);

  imgs.push(tempC);
}
var monthlyMeans = ee.ImageCollection(imgs);

///////////////////////////////////////////////////////////

// 3) Hottest & coldest month rasters from climatology
var hottestC = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyMeans
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// 4) Your classification (unchanged thresholds; now mask-aware)
function classifySummer(tC) {
  // Start with a 0 image but keep only pixels where tC is valid
  var out = ee.Image(0).updateMask(tC.mask());

  // Apply your bins
  out = out.where(tC.gte(50), 10)  // H
           .where(tC.gte(40).and(tC.lt(50)),  9)   // X
           .where(tC.gte(35).and(tC.lt(40)),  8)   // Z2
           .where(tC.gte(30).and(tC.lt(35)),  7)   // Z1
           .where(tC.gte(25).and(tC.lt(30)),  6)   // A2
           .where(tC.gte(20).and(tC.lt(25)),  5)   // A1
           .where(tC.gte(15).and(tC.lt(20)),  4)   // B2
           .where(tC.gte(10).and(tC.lt(15)),  3)   // B1
           .where(tC.gte(5).and(tC.lt(10)),   2)   // C2
           .where(tC.gte(0).and(tC.lt(5)),    1)   // C1
           .where(tC.lt(0),                   0);  // Y

  return out.rename('warmZone');
}

var warmZone = classifySummer(hottestC);

// 5) Color map & display
var codeColorMap = {
  10:"#0000FF",// Hypercaneal Summer
  9:"#000000", // Extreme Hyperthermal Summer
  8:"#550000", // Hyperthermal Summer
  7:"#C71585", // Scorching Hot Summer
  6:"#FF0000", // Very Hot Summer
  5:"#FFA500", // Hot Summer
  4:"#FFFF00", // Mild Summer
  3:"#008000", // Cold Summer
  2:"#0000FF", // Very Cold Summer
  1:"#FF10F0", // Freezing Summer
  0:"#000000"  // Frigid Summer
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = warmZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (WorldClim normals)',
  true, 0.7
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

// =======================================================================
// Continental United States thumbnail: climate + counties + state borders
// =======================================================================

// ---------- CONUS rectangle ----------
var conus = ee.Geometry.Rectangle(
  [-125, 24, -66.5, 49.5],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// ---------- County borders ----------
var countiesFC = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filterBounds(conus);

var countiesRGB = ee.Image()
  .byte()
  .paint(countiesFC, 1, 1) 
  .visualize({
    palette: ['#888888'],
    opacity: 0.5            
  });

// ---------- State borders ----------
var statesFC = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filterBounds(conus);
  
var stateMask = ee.Image()
  .byte()
  .paint(statesFC, 1)
  .selfMask();

var statesRGB = ee.Image()
  .byte()
  .paint(statesFC, 1, 1)
  .visualize({
    palette: ['#000000'],
  });
  
// ---------- Climate overlay ----------
var climateRGB = discreteLand
  .updateMask(stateMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
});

// ---------- Composite ----------

var composite = ee.ImageCollection([
  climateRGB,
  countiesRGB,
  statesRGB,
]).mosaic();

// ---------- PNG thumbnail ----------

var thumbUrl = composite.getThumbURL({
  region: conus,
  dimensions: '4096x2048',
  format: 'png'
});

print('CONUS thumbnail URL:', thumbUrl);
