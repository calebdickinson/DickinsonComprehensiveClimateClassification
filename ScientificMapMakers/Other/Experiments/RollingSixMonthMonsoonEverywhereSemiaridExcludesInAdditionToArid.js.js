// === Aridity Map (CHELSA v2.1, 1981–2010) — Dickinson rules ===
// Global monsoon = ≥80% precip in ANY consecutive 6-month window
// Excludes arid AND Mediterranean climates

var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';
var PET_MEAN_ID = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1';

var SCALE_PR   = 0.1;
var SCALE_PET  = 0.1;
var NODATA_U16 = 65535;

// =====================
// === TEMPERATURE ====
// =====================
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

  tasImgs.push(
    ee.Image(id)
      .updateMask(ee.Image(id).neq(NODATA_U16))
      .multiply(0.1)
      .subtract(273.15)
      .rename('monthlyMean')
      .set('month', m)
  );
}
var tasMonthly = ee.ImageCollection(tasImgs);

var hottestC = tasMonthly.qualityMosaic('monthlyMean').select('monthlyMean');
var coldestC = tasMonthly
  .map(function(img){ return img.multiply(-1); })
  .qualityMosaic('monthlyMean')
  .multiply(-1);

var coldCond = hottestC.lt(15).or(coldestC.lt(-20));

// =====================
// === PRECIP =========
// =====================
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16';

  prImgs.push(
    ee.Image(pid)
      .updateMask(ee.Image(pid).neq(NODATA_U16))
      .multiply(SCALE_PR)
      .rename('pr')
      .set('month', n)
  );
}
var prMonthly = ee.ImageCollection(prImgs);

// =====================
// === PET / AI =======
// =====================
var petMeanMm = ee.Image(PET_MEAN_ID)
  .updateMask(ee.Image(PET_MEAN_ID).neq(NODATA_U16))
  .multiply(SCALE_PET);

var P_ann   = prMonthly.sum();
var PET_ann = petMeanMm.multiply(12);
var AI      = P_ann.divide(PET_ann);

// High-sun ratio (Mediterranean only)
var P_hs = prMonthly
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .sum();
var HS = P_hs.divide(P_ann);

// Ocean
var oceanMask = AI.mask().not();

// =====================
// === ARIDITY BASE ====
// =====================
var aridBase = ee.Image(6)
  .where(AI.gte(2).or(AI.lte(0.01)), 8)
  .where(AI.lt(0.075), 5)
  .where(AI.lt(0.050), 2)
  .where(AI.lt(0.025), 1)
  .rename('aridity');

// =====================
// === MEDITERRANEAN ===
// =====================
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var southMask = lat.lt(-23.43594);

var medMask = (
    northMask.and(HS.lt(0.4))
      .or(southMask.and(HS.gt(0.6)))
  )
  .and(aridBase.neq(1))
  .and(aridBase.neq(2))
  .and(aridBase.neq(8));

// ===============================
// === GLOBAL 6-MONTH MONSOON ====
// ===============================
var prList = prMonthly.sort('month').toList(12);

var sixMonthSums = ee.List.sequence(0, 11).map(function(start){
  start = ee.Number(start);

  var idx = ee.List.sequence(start, start.add(5))
    .map(function(i){ return ee.Number(i).mod(12); });

  return ee.ImageCollection(
    idx.map(function(i){ return ee.Image(prList.get(i)); })
  ).sum();
});

var P6ratio = ee.ImageCollection.fromImages(sixMonthSums)
  .max()
  .divide(P_ann);

// Global monsoon condition
var globalMonsoon = P6ratio.gte(0.8)
  .and(aridBase.neq(1))
  .and(aridBase.neq(2))
  .and(aridBase.neq(8))
  .and(medMask.not());

// =====================
// === FINAL CLASS ====
// =====================
var clim = aridBase
  .where(medMask, 3)
  .where(globalMonsoon, 4)
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// =====================
// === VISUALIZATION ===
// =====================
var codeColorMap = {
  1: "#FF0000",
  2: "#FFA500",
  3: "#FFFF00",
  4: "#FF00FF",
  5: "#00FF00",
  6: "#006600",
  7: "#0000FF",
  8: "#008888"
};

var keys = Object.keys(codeColorMap);
var codes = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });

var indices = ee.List.sequence(0, codes.length - 1);

Map.addLayer(
  clim
    .updateMask(clim.neq(8))
    .remap(codes, indices),
  { min: 0, max: codes.length - 1, palette: palette },
  'Climate (Global Monsoon Rule)',
  true, 0.7
);
