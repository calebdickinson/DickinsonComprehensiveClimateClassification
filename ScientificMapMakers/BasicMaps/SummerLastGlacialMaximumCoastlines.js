// ==== CHELSA Last Glacial Maximum HOTTEST MONTH climatology ====
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

// 3) Hottest month rasters from climatology
var hottestC = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

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
  9:"#00FFFF", // Extreme Hyperthermal Summer
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

// ---------- Bedrock depth mask (exclude bedrock > 125 m below sea level) ----------
var bedrock = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
var bedrockMask = bedrock.gte(-125);

warmZone = warmZone.updateMask(bedrockMask);

var discreteLand = warmZone.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (WorldClim normals)',
  true, 0.7
);

// Paste Extensions here