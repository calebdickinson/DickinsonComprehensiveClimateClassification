// === Aridity Map (CHELSA v2.1, 2011–2040)

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

// Treat masked AI (from PET mask) as ocean
var oceanMask = AI.mask().not();

var aridBase = ee.Image(1)
  .where(AI.lt(0.100), 2)
  .where(AI.lt(0.090), 3)
  .where(AI.lt(0.080), 4)
  .where(AI.lt(0.070), 5)
  .where(AI.lt(0.060), 6)
  .where(AI.lt(0.050), 7)
  .where(AI.lt(0.040), 8)
  .where(AI.lt(0.030), 9)
  .where(AI.lt(0.020), 10)
  .where(AI.lt(0.010), 11)
  .where(AI.lt(0.005), 12)
  .rename('aridity');

var clim = aridBase
  // Oceans, then cold override (unchanged)
  .where(oceanMask, 0)
  .rename('climateClass');

// Visualization
var codeColorMap = {
  1:  "#004444",
  2:  "#008844",
  3:  "#00AA66",
  4:  "#00FF88",
  5:  "#00DD00",
  6:  "#AAFF00",
  7:  "#FFFf00",
  8:  "#FFDD00",
  9:  "#FF8800",
 10:  "#FF0000",
 11:  "#880000",
 12:  "#440000"
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discreteLand.updateMask(clim.neq(0)), // remove .updateMask(clim.neq(0)) to show ocean color
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (CHELSA, oceans included; cold wins)',
  true, 0.7
);

// Paste extensions here