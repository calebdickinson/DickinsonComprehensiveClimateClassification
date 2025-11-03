// === Aridity Map (CHELSA v2.1, 1981–2010) — using YOUR uploaded assets ===
// Mask oceans by removing pixels where AI > 100

var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // adjust if needed

var SCALE_PR  = 0.1;  // pr_u16: 0.1 → mm/month (set to 1.0 if already mm)
var SCALE_PET = 0.1;  // pet_u16 mean: 0.1 → mm/month (set to 1.0 if float)
var NODATA_U16 = 65535;

// ----- tas (°C) from your u16 monthly files -----
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';
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

// ----- pr (mm/month) from your u16 monthly files -----
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16';
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

// Latitude zones (unchanged)
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var tropic    = lat.abs().lte(23.43594);
var southMask = lat.lt(-23.43594);

// Base aridity classes (your current thresholds)
var aridBase = ee.Image(6)
  .where(AI.lt(0.075), 5)
  .where(AI.lt(0.050), 2)
  .where(AI.lt(0.025), 1)
  .rename('aridity');

// HS ratio
var HS = P_hs.divide(P_ann).rename('HS_ratio');

var clim = aridBase
  .rename('climateClass');

// ---- Ocean-like mask via extreme AI (> 100) ----
var keepMask = AI.lte(100);           // keep reasonable AI; drop absurdly wet
var climMasked = clim.updateMask(keepMask);

// Visualization
var codeColorMap = {
  1: "#FF0000", // D: Arid Desert
  2: "#FFA500", // S: Semiarid
  5: "#00FF00", // G: Semihumid
  6: "#006600", // H: Humid
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = climMasked.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discrete,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (CHELSA, oceans masked by AI>100)',
  true, 0.7
);
