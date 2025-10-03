/***** CHELSA 2250 Summer Map (2100 + 2*(2100−2025)) *****/

var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets'; // <- change if needed

// helper: "01".."12"
function pad2(n){ return (n < 10 ? '0' : '') + n; }
var monthsJS = [1,2,3,4,5,6,7,8,9,10,11,12];

// force ~30 arc-seconds (≈ 0.0083333° ≈ 926.67 m at equator)
var ARCSEC30_M = (30.0 / 3600.0) * 111320.0;

// ---- Loader for a single month's tas (°C already) ----
function loadTas(year, m){
  var id = ASSET_ROOT + '/tas_' + year + '_' + pad2(m);
  var date = ee.Date.fromYMD(year, m, 15);
  return ee.Image(id)
    .select(0).rename('tasC')
    .resample('bilinear')
    .reproject({crs: 'EPSG:4326', scale: ARCSEC30_M})
    .set('month', m)
    .set('system:time_start', date.millis());
}

// ---- Build 2025, 2100, and 2250-projected tas collections ----
var tas2025 = ee.ImageCollection(monthsJS.map(function(m){ return loadTas(2025, m); }));
var tas2100 = ee.ImageCollection(monthsJS.map(function(m){ return loadTas(2100, m); }));

// 2250 = 2025 + 3Δ = 2100 + 2Δ
var tas2250 = ee.ImageCollection(ee.List.sequence(1,12).map(function(m){
  m = ee.Number(m);
  var t25 = tas2025.filter(ee.Filter.eq('month', m)).first().select('tasC');
  var t00 = tas2100.filter(ee.Filter.eq('month', m)).first().select('tasC');
  var dT  = t00.subtract(t25);
  var t50 = t00.add(dT.multiply(2)).rename('tasC'); // triple the 2025→2100 change
  return t50.set('month', m);
}));

// ---- Hottest & coldest month from projected 2250 temps ----
var hottestC = tas2250.qualityMosaic('tasC')
  .select('tasC').rename('hottestC');

var coldestC = tas2250.map(function(img){
    return img.multiply(-1).copyProperties(img);
  })
  .qualityMosaic('tasC')
  .multiply(-1)
  .select('tasC').rename('coldestC');

// ---- Summer classification by hottest-month temperature ----
function classifySummer(tC) {
  return ee.Image(0)
    .where(tC.gte(50).and(tC.lt(100)), 10)  // Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   9)  // X1: Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),   8)  // Z2: Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),   7)  // Z1: Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),   6)  // A2: Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),   5)  // A1: Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),   4)  // B2: Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),   3)  // B1: Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),    2)  // C2: Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),     1)  // C1: Freezing Summer
    .where(tC.lt(0),                    0)  // Y: Frigid Summer
    .rename('warmZone')
    .updateMask(tC.mask());
}

var warmZone = classifySummer(hottestC);

// ---- Palette & render ----
var codeColorMap = {
  10:"#0000FF", // Hypercaneal
  9:"#000000",  // X1: Extreme Hyperthermal Summer
  8:"#550000",  // Z2: Hyperthermal Summer
  7:"#C71585",  // Z1: Scorching Hot Summer
  6:"#FF0000",  // A2: Very Hot Summer 
  5:"#FFA500",  // A1: Hot Summer
  4:"#FFFF00",  // B2: Mild Summer
  3:"#008000",  // B1: Cold Summer
  2:"#0000FF",  // C2: Very Cold Summer
  1:"#FF10F0",  // C1: Freezing Summer
  0:"#000000"   // Y: Frigid Summer
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = warmZone.remap(codes, indices).rename('classIndex');

// Center roughly on an existing asset footprint (optional)
Map.centerObject(ee.Image(ASSET_ROOT + '/tas_2100_01'), 3);

Map.addLayer(
  discrete,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (CHELSA 2250 summer: 2025 + 3×Δ)',
  true, 0.7
);

// (Optional diagnostic layer)
// Map.addLayer(hottestC, {min:0, max:60, palette:['#0011ff','#88ccff','#ffffcc','#ff9900','#cc0000']}, '2250 hottest month (°C)', false);
