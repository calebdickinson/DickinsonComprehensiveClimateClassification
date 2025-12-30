// === Aridity Map (CHELSA v2.1, 1981–2010) — Dickinson rules ===
// Tropical monsoon = ≥80% precip in ANY consecutive 6-month window

var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';
var PET_MEAN_ID = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1';

var SCALE_PR   = 0.1;   // pr_u16 → mm/month
var SCALE_PET  = 0.1;   // pet_u16 → mm/month
var NODATA_U16 = 65535;

// =====================
// === TEMPERATURE ====
// =====================
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

  var tasC = ee.Image(id)
    .updateMask(ee.Image(id).neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
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
  .map(function (img) {
    return img.multiply(-1).copyProperties(img);
  })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// Cold "no aridity" condition
var coldCond = hottestC_global.lt(15).or(coldestC_global.lt(-20));

// =====================
// === PRECIP =========
// =====================
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

// =====================
// === PET & AI ========
// =====================
var petRaw    = ee.Image(PET_MEAN_ID);
var petMasked = petRaw.updateMask(petRaw.neq(NODATA_U16));
var petMeanMm = petMasked.multiply(SCALE_PET).rename('pet_mean_mm_per_month');

var P_ann   = prMonthly.sum().rename('P_ann');
var PET_ann = petMeanMm.multiply(12).rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

// HS ratio (used ONLY outside tropics)
var P_hs = prMonthly
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .sum()
  .rename('P_highSun');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

// Ocean mask
var oceanMask = AI.mask().not();

// =====================
// === LATITUDE ========
// =====================
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var tropic    = lat.abs().lte(23.43594);
var southMask = lat.lt(-23.43594);

// =====================
// === ARIDITY BASE ====
// =====================
var aridBase = ee.Image(6)        // Humid
  .where(AI.gte(2).or(AI.lte(0.01)), 8) // ocean-ish
  .where(AI.lt(0.075), 5)         // Semihumid
  .where(AI.lt(0.050), 2)         // Semiarid
  .where(AI.lt(0.025), 1)         // Desert
  .rename('aridity');

// =======================================
// === ROLLING 6-MONTH MONSOON (TROPICS) ==
// =======================================
var prList = prMonthly.sort('month').toList(12);

var sixMonthSums = ee.List.sequence(0, 11).map(function(start) {
  start = ee.Number(start);

  var idx = ee.List.sequence(start, start.add(5))
    .map(function(i) {
      return ee.Number(i).mod(12);
    });

  var imgs = idx.map(function(i) {
    return ee.Image(prList.get(i));
  });

  return ee.ImageCollection(imgs).sum();
});

var P6max = ee.ImageCollection.fromImages(sixMonthSums)
  .max()
  .rename('P6max');

var P6ratio = P6max.divide(P_ann).rename('P6ratio');

var tropMonsoon = tropic
  .and(aridBase.neq(1))
  .and(aridBase.neq(8))
  .and(P6ratio.gte(0.8));

// =====================
// === FINAL CLASS ====
// =====================
var clim = aridBase
  // Northern Hemisphere
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gt(0.8)), 4)
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.4)), 3)

  // Tropics — Dickinson rule
  .where(tropMonsoon, 4)

  // Southern Hemisphere
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)), 4)
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gt(0.6)), 3)

  // Oceans, then cold override
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// =====================
// === VISUALIZATION ===
// =====================
var codeColorMap = {
  1: "#FF0000", // Arid Desert
  2: "#FFA500", // Semiarid
  3: "#FFFF00", // Mediterranean
  4: "#FF00FF", // Monsoon
  5: "#00FF00", // Semihumid
  6: "#006600", // Humid
  7: "#0000FF", // Cold (no aridity)
  8: "#008888"  // Ocean
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discrete.updateMask(clim.neq(8)),
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (CHELSA v2.1, Dickinson Monsoon)',
  true,
  0.7
);
