// === Aridity Map (CHELSA v2.1, 2011–2040) — using YOUR uploaded assets ===
// No ocean masking

var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID = PREFIX + 'CHELSA_pet_penman_mean_2011-2040'; // adjust if needed

var SCALE_PR  = 0.1;  // pr_u16: 0.1 → mm/month (set to 1.0 if already mm)
var SCALE_PET = 1;  // pet_u16 mean: 0.1 → mm/month (set to 1.0 if float)
var NODATA_U16 = 65535;

// ----- tas (°C) from your u16 monthly files -----
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2011_2040_norm';
  var tasC = ee.Image(id)
    .updateMask(ee.Image(id).neq(NODATA_U16))
    .multiply(0.1).subtract(273.15)   // 0.1 K → °C
    .rename('monthlyMean')
    .set('month', m);
  tasImgs.push(tasC);
}
var tasMonthly = ee.ImageCollection(tasImgs);

var hottestC_global = tasMonthly
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC_global = tasMonthly
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// Precompute the "no aridity" cold condition once
var coldCond = hottestC_global.lt(15).or(coldestC_global.lt(-20));

// ----- pr (mm/month) from your u16 monthly files -----
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' + nn + '_2011_2040_norm';
  var pr = ee.Image(pid)
    .updateMask(ee.Image(pid).neq(NODATA_U16))
    .multiply(SCALE_PR)
    .rename('pr')
    .set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ----- PET mean (mm/month) from your uploaded asset -----
var petRaw     = ee.Image(PET_MEAN_ID);
var petMasked  = petRaw.updateMask(petRaw.neq(NODATA_U16));
var petMeanMm  = petMasked.multiply(SCALE_PET).rename('pet_mean_mm_per_month');

// Annual sums / ratios
var P_ann   = prMonthly.sum().rename('P_ann');          // mm/year
var P_hs    = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9])).sum().rename('P_highSun');
var PET_ann = petMeanMm.multiply(12).rename('PET_ann'); // mm/year
var AI      = P_ann.divide(PET_ann).rename('AI');

// Treat masked AI (from PET mask) as ocean
var oceanMask = AI.mask().not();

// Latitude zones (unchanged)
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var tropic    = lat.abs().lte(23.43594);
var southMask = lat.lt(-23.43594);

// Base aridity classes
var aridBase = ee.Image(6)
  .where(AI.gte(1).or(AI.lte(0.01)), 8)  // ocean-ish rule
  .where(AI.lt(0.075), 5)
  .where(AI.lt(0.050), 2)
  .where(AI.lt(0.025), 1)
  .rename('aridity');

// HS ratio
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// Final class map — oceans included
var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.8)), 4)
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.4)),  3)
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),     4)
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.8)),    4)
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),  4)
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.6)), 3)
  // mark masked-AI areas (oceans) as class 8 (cyan)
  .where(oceanMask, 8)
  // ensure cold "no aridity" wins even where AI is missing
  .where(coldCond, 7)
  .rename('climateClass');

// Visualization
var codeColorMap = {
  1: "#FF0000", // D: Arid Desert
  2: "#FFA500", // S: Semiarid
  3: "#FFFF00", // M: Mediterranean
  4: "#FF00FF", // W: Monsoon
  5: "#00FF00", // G: Semihumid
  6: "#006600", // H: Humid
  7: "#0000FF", // no aridity (cold)
  8: "#008888"  // ocean
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discrete.updateMask(clim.neq(8)), // remove .updateMask(clim.neq(8)) to show ocean color
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (CHELSA, oceans included; cold wins)',
  true, 0.7
);
