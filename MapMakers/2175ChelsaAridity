/***** CHELSA “2175 projection” from (2100 − 2025) doubled *****/

var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets';   // <-- adjust if needed

// Helper: "01".."12"
function pad2(n){ return (n < 10 ? '0' : '') + n; }
var monthsJS = [1,2,3,4,5,6,7,8,9,10,11,12];

// Force 30 arc-sec (~926.67 m display)
var ARCSEC30_M = (30.0 / 3600.0) * 111320.0;

// ---- Load a year of CHELSA monthlies (tas °C & pr mm/day) ----
function loadYear(year){
  var tasImgs = monthsJS.map(function(m){
    var id = ASSET_ROOT + '/tas_' + year + '_' + pad2(m);
    var date = ee.Date.fromYMD(year, m, 15);
    return ee.Image(id)
      .select(0).rename('tmeanC')                  // already °C from your prepped tifs
      .resample('bilinear')
      .reproject({crs:'EPSG:4326', scale: ARCSEC30_M})
      .set('month', m)
      .set('system:time_start', date.millis());
  });
  var prImgs = monthsJS.map(function(m){
    var id = ASSET_ROOT + '/pr_' + year + '_' + pad2(m);
    var date = ee.Date.fromYMD(year, m, 15);
    return ee.Image(id)
      .select(0).rename('pr')                      // mm/day (as exported)
      .resample('bilinear')
      .reproject({crs:'EPSG:4326', scale: ARCSEC30_M})
      .set('month', m)
      .set('system:time_start', date.millis());
  });
  return {
    tas: ee.ImageCollection(tasImgs),
    pr : ee.ImageCollection(prImgs)
  };
}

// Build 2025 & 2100 collections
var Y25 = loadYear(2025);
var Y00 = loadYear(2100);

// Days / month
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

// ---- Make a monthly climate pack from tas & pr (any year) ----
function monthlyClimFrom(tasIC, prIC){
  return ee.ImageCollection(ee.List.sequence(1,12).map(function(m){
    m = ee.Number(m);
    var tmeanC = tasIC.filter(ee.Filter.eq('month', m)).first().select('tmeanC');
    var prDay  = prIC .filter(ee.Filter.eq('month', m)).first().select('pr');  // mm/day
    var days   = ee.Number(daysList.get(m.subtract(1)));
    var prMon  = prDay.multiply(days).rename('pr');                             // mm/month

    // Very simple PET from temperature (like your other scripts)
    var es = tmeanC.expression('0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC});
    var Ra = ee.Image.constant(12 * 0.0820);
    var pet = es.multiply(Ra).multiply(0.1651).rename('pet');

    return tmeanC.addBands(prMon).addBands(pet).set('month', m);
  }));
}

// Build 2025 & 2100 climate packs
var clim2025 = monthlyClimFrom(Y25.tas, Y25.pr);
var clim2100 = monthlyClimFrom(Y00.tas, Y00.pr);

// Convenience getters
function monthlyBand(ic, band, m){
  return ic.filter(ee.Filter.eq('month', ee.Number(m))).first().select(band);
}

// ---- Project 2175 as 2100 + (2100 − 2025) for each month ----
var clim2175 = ee.ImageCollection(ee.List.sequence(1,12).map(function(m){
  var t25 = monthlyBand(clim2025, 'tmeanC', m);
  var p25 = monthlyBand(clim2025, 'pr',     m);     // mm/month
  var t00 = monthlyBand(clim2100, 'tmeanC', m);
  var p00 = monthlyBand(clim2100, 'pr',     m);

  // Δ = 2100 − 2025
  var dT = t00.subtract(t25);
  var dP = p00.subtract(p25);

  // 2175 = 2100 + Δ  (== 2025 + 2Δ)
  var t175 = t00.add(dT)                        .rename('tmeanC');
  var p175 = p00.add(dP).max(0)                 .rename('pr');      // clamp negatives to 0

  // Recompute PET from projected temp
  var es175 = t175.expression('0.6108 * exp(17.27 * T / (T + 237.3))', {T: t175});
  var Ra    = ee.Image.constant(12 * 0.0820);
  var pet175= es175.multiply(Ra).multiply(0.1651).rename('pet');

  return t175.addBands(p175).addBands(pet175).set('month', m);
}));

// ---- Hottest / coldest months from projected 2175 temps ----
var tas2175 = clim2175.select('tmeanC');
var hottestC = tas2175.qualityMosaic('tmeanC').select('tmeanC').rename('hottestC');
var coldestC = tas2175.map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('tmeanC').multiply(-1).select('tmeanC').rename('coldestC');

// ---- Annuals & masks ----
var P_ann   = clim2175.select('pr' ).sum().rename('P_ann');
var PET_ann = clim2175.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

var pixelLat  = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

var validMask = P_ann.mask()
  .and(PET_ann.mask())
  .and(hottestC.mask())
  .and(coldestC.mask());

// ---- Aridity + seasonal ratio (from projected months) ----
var aridBase = ee.Image(6) // H: Humid
  .updateMask(validMask)
  .where(AI.lt(0.0036), 5) // Semihumid
  .where(AI.lt(0.0024), 2) // Semiarid
  .where(AI.lt(0.0012), 1) // Arid Desert
  .rename('aridity');

var P_hs = clim2175
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun')
  .updateMask(P_ann.mask());

var HS = P_hs.divide(P_ann).rename('HS_ratio').updateMask(P_ann.mask());

// ---- Final climate class (same rules you used) ----
var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic   .and(aridBase.neq(1)).and(HS.lt(0.2)),  4)
  .where(tropic   .and(aridBase.neq(1)).and(HS.gte(0.8)), 4)
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4)
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3)
  .where(hottestC.lt(15).or(coldestC.lt(-20)), 7)           // cold regions: no aridity class
  .updateMask(validMask)
  .rename('climateClass');

// ---- Palette & rendering ----
var codeColorMap = {
  1: "#FF0000", // Arid Desert
  2: "#FFA500", // Semiarid
  3: "#FFFF00", // Mediterranean
  4: "#FF00FF", // Monsoon
  5: "#00FF00", // Semihumid
  6: "#006600", // Humid
  7: "#0000FF"  // Cold/no aridity
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = clim.remap(codes, indices).rename('classIndex');

// ---- Map ----
Map.centerObject(ee.Image(ASSET_ROOT + '/tas_2100_01'), 3); // any footprint is fine
Map.addLayer(discreteLand,
  {min: 0, max: indices.length - 1, palette: palette},
  'CHELSA 2175 (linear 2100−2025 projection)', true, 0.7);

// (Optional) also visualize hottest/coldest °C
Map.addLayer(hottestC, {min:-10, max:40, palette:['#0011ff','#88ccff','#ffffcc','#ff9900','#cc0000']}, '2175 hottest (°C)', false);
Map.addLayer(coldestC, {min:-50, max:20, palette:['#0011ff','#88ccff','#ffffcc','#ff9900','#cc0000']}, '2175 coldest (°C)', false);
