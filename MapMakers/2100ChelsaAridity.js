/***** CHELSA 2100 Aridity Map using uploaded .tif assets *****/

var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets';  // <-- adjust if needed
var YEAR = 2100; //2025 or 2100

// helper: pad months to 01..12
function pad2(n){ return (n < 10 ? '0' : '') + n; }
var monthsJS = [1,2,3,4,5,6,7,8,9,10,11,12];

// force 30 arc-sec (~926.67 m)
var ARCSEC30_M = (30.0 / 3600.0) * 111320.0;

// ---- Load tas (°C) monthly ----
var tasImages = monthsJS.map(function(m){
  var id = ASSET_ROOT + '/tas_' + YEAR + '_' + pad2(m);
  var date = ee.Date.fromYMD(YEAR, m, 15);
  return ee.Image(id)
    .select(0).rename('tmeanC')
    .resample('bilinear')
    .reproject({crs: 'EPSG:4326', scale: ARCSEC30_M})
    .set('month', m)
    .set('system:time_start', date.millis());
});
var monthlyTas = ee.ImageCollection(tasImages);

// ---- Load pr (mm/day) monthly ----
var prImages = monthsJS.map(function(m){
  var id = ASSET_ROOT + '/pr_' + YEAR + '_' + pad2(m);
  var date = ee.Date.fromYMD(YEAR, m, 15);
  return ee.Image(id)
    .select(0).rename('pr')
    .resample('bilinear')
    .reproject({crs: 'EPSG:4326', scale: ARCSEC30_M})
    .set('month', m)
    .set('system:time_start', date.millis());
});
var prMonthly = ee.ImageCollection(prImages);

// ---- hottest & coldest month ----
var hottestC = monthlyTas.qualityMosaic('tmeanC')
  .select('tmeanC').rename('hottestC');
var coldestC = monthlyTas.map(function(img){
    return img.multiply(-1).copyProperties(img);
  }).qualityMosaic('tmeanC')
  .multiply(-1).select('tmeanC').rename('coldestC');

// ---- Monthly PET & Climate ----
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

function monthlyClimMaker(m){
  m = ee.Number(m);
  var tmeanC = monthlyTas.filter(ee.Filter.eq('month', m)).first()
    .select('tmeanC');
  var prM = prMonthly.filter(ee.Filter.eq('month', m)).first().select('pr');
  var days = ee.Number(daysList.get(m.subtract(1)));
  var rainM = prM.multiply(days).rename('pr');  // mm/month
  var es = tmeanC.expression('0.6108 * exp(17.27 * T / (T + 237.3))',{T:tmeanC});
  var Ra = ee.Image.constant(12 * 0.0820);
  var pet = es.multiply(Ra).multiply(0.1651).rename('pet');
  return tmeanC.addBands(rainM).addBands(pet).set('month', m);
}
var monthlyClim = ee.ImageCollection(ee.List.sequence(1,12).map(monthlyClimMaker));

// ---- Annual totals ----
var P_ann   = monthlyClim.select('pr').sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

// ---- Masks ----
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

// ---- Aridity ----
var aridBase = ee.Image(6) // H: Humid
  .where(AI.lt(0.0036),5)  // G: Semihumid
  .where(AI.lt(0.0024),2)  // S: Semiarid
  .where(AI.lt(0.0012),1)  // D: Desert
  .rename('aridity');

// ---- High-sun precip ratio ----
var P_hs = monthlyClim.filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun');
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---- Final climate classification ----
var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)),4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),3)  // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),4)
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),4)
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),4)
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)),3)
  .where(hottestC.lt(15).or(coldestC.lt(-20)),7) // no aridity (cold regions)
  .rename('climateClass');

// ---- Palette ----
var codeColorMap = {
  1: "#FF0000", // Arid Desert
  2: "#FFA500", // Semiarid
  3: "#FFFF00", // Mediterranean
  4: "#FF00FF", // Monsoon
  5: "#00FF00", // Semihumid
  6: "#006600", // Humid
  7: "#0000FF"  // Cold/no aridity
};
var keys = Object.keys(codeColorMap);
var codes = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_,i){ return i; });

var discreteLand = clim.remap(codes, indices).rename('classIndex');

// ---- Map ----
Map.centerObject(ee.Image(tasImages[0]), 3);
Map.addLayer(discreteLand,
  {min:0, max:indices.length-1, palette:palette},
  'CHELSA 2100 Aridity', true, 0.7);
