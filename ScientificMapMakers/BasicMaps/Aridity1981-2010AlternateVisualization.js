// === Aridity Map (CHELSA v2.1, 1981–2010)

var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1';

var SCALE_PR  = 0.1;   // pr_u16 → mm/month
var SCALE_PET = 0.1;   // pet_u16 mean → mm/month
var NODATA_U16 = 65535;

// =====================================================
// TEMPERATURE (°C)
// =====================================================
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

  var tasC = ee.Image(id)
    .updateMask(ee.Image(id).neq(NODATA_U16))
    .multiply(0.1).subtract(273.15)
    .rename('monthlyMean')
    .set('month', m);

  tasImgs.push(tasC);
}

var tasMonthly = ee.ImageCollection(tasImgs);

var hottestC_global = tasMonthly
  .qualityMosaic('monthlyMean')
  .rename('hottestC');

var coldestC_global = tasMonthly
  .map(function(img){ return img.multiply(-1); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .rename('coldestC');

// No-aridity (cold) condition
var coldCond = hottestC_global.lt(15).or(coldestC_global.lt(-20));

// =====================================================
// PRECIPITATION (mm/month)
// =====================================================
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

// =====================================================
// PET (mm/month)
// =====================================================
var petRaw    = ee.Image(PET_MEAN_ID);
var petMasked = petRaw.updateMask(petRaw.neq(NODATA_U16));
var petMeanMm = petMasked.multiply(SCALE_PET).rename('pet_mm');

// =====================================================
// ANNUAL TOTALS & RATIOS
// =====================================================
var P_ann   = prMonthly.sum().rename('P_ann');
var P_hs    = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9])).sum();
var PET_ann = petMeanMm.multiply(12).rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

// Ocean from PET mask
var oceanMask = AI.mask().not();

// =====================================================
// LATITUDE ZONES
// =====================================================
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var southMask = lat.lt(-23.43594);

// =====================================================
// BASE ARIDITY CLASSES
// =====================================================
var aridBase = ee.Image(6)       // 6 = Humid
  .where(AI.lte(0.01), 8)        // ocean-ish guard
  .where(AI.lt(0.075), 5)        // Semihumid
  .where(AI.lt(0.050), 2)        // Semiarid
  .where(AI.lt(0.025), 1)        // Arid desert
  .rename('aridity');

// =====================================================
// SEASONALITY METRICS
// =====================================================
var HS = P_hs.divide(P_ann).rename('HS');

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
  .divide(P_ann)
  .rename('P6ratio');

// =====================================================
// FINAL CLIMATE CLASS
// =====================================================
var clim = aridBase

  // Mediterranean
  .where(
    northMask.and(HS.lt(0.4))
      .or(southMask.and(HS.gt(0.6)))
      .and(aridBase.neq(1))
      .and(aridBase.neq(8)),
    3
  )

  // Global monsoon
  .where(
    P6ratio.gte(0.8)
      .and(aridBase.neq(1))
      .and(aridBase.neq(8))
      .and(
        northMask.and(HS.lt(0.4))
          .or(southMask.and(HS.gt(0.6)))
          .not()
      ),
    4
  )

  // Oceans and cold override
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// =====================================================
// SPECIAL OVERRIDE: Mediterranean rainforest → humid
// =====================================================
var P_driest = prMonthly.min();

clim = clim.where(
  clim.eq(3)
    .and(P_driest.gte(PET_ann.divide(240))),
  6
);

// =====================================================
// VISIBILITY MASK (KEY PART)
// =====================================================
var allowedMask = clim.eq(1)
  .or(clim.eq(2))
  .or(clim.eq(3))
  .or(clim.eq(4))
  .or(clim.eq(5))
  .or(clim.eq(6));

// =====================================================
// VISUALIZATION
// =====================================================
var codeColorMap = {
  1: "#FF0000", // Arid desert
  2: "#FFA500", // Semiarid
  3: "#FFFF00", // Mediterranean
  4: "#FF00FF", // Monsoon
  5: "#00FF00", // Semihumid
  6: "#006600", // Humid
  7: "#0000FF", // cold (hidden)
  8: "#008888"  // ocean (hidden)
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discrete.updateMask(allowedMask),
  { min: 0, max: indices.length - 1, palette: palette },
  'Aridity & seasonality climates only (CHELSA 1981–2010)',
  true,
  0.8
);
