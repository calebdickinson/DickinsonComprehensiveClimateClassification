// === CHELSA v2.1 (1981–2010) — Aridity via CHELSA methods, not WorldClim ===

// ---------- Assets & constants ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID  = ASSET_PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // u16 mean PET

var NODATA_U16 = 65535;
var SCALE_PR   = 0.1;  // CHELSA pr_u16: 0.1 → mm/month
var SCALE_PET  = 1;  // Should be 1 for projections and 0.1 in baseline do to unit conversion

// ---------- Months helper ----------
var months = ee.List.sequence(1, 12);

// ---------- Monthly mean temperature (°C) from CHELSA tas_u16 (0.1 K) ----------
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2071_2100_norm';

  var raw = ee.Image(id);
  var tempC = raw
    .updateMask(raw.neq(NODATA_U16)) // mask UInt16 NoData
    .multiply(0.1)                   // 0.1 K
    .subtract(273.15)                // → °C
    .rename('monthlyMean')
    .set('month', m);

  tasImgs.push(tempC);
}
var monthlyMeans = ee.ImageCollection(tasImgs);

// ---------- Hottest & coldest (°C) ----------
var hottestC = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyMeans
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// Precompute the "no aridity" cold condition once (same thresholds as your CHELSA code)
var coldCond = hottestC.lt(15).or(coldestC.lt(-20));

// ---------- Monthly precipitation from CHELSA pr_u16 (0.1 → mm/month) ----------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = ASSET_PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16';
  var pr = ee.Image(pid)
    .updateMask(ee.Image(pid).neq(NODATA_U16))
    .multiply(SCALE_PR)   // → mm/month
    .rename('pr')
    .set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ---------- PET mean (mm/month) from CHELSA uploaded asset ----------
var petRaw    = ee.Image(PET_MEAN_ID);
var petMasked = petRaw.updateMask(petRaw.neq(NODATA_U16));
var petMeanMm = petMasked.multiply(SCALE_PET).rename('pet_mean_mm_per_month');

// ---------- Annual sums / ratios (CHELSA method) ----------
var P_ann   = prMonthly.sum().rename('P_ann');                  // mm/year
var P_hs    = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
                       .sum().rename('P_highSun');              // Apr–Sep total
var PET_ann = petMeanMm.multiply(12).rename('PET_ann');         // mm/year
var AI      = P_ann.divide(PET_ann).rename('AI');               // UNEP-style ratio

// Treat masked AI (from PET mask) as ocean
var oceanMask = AI.mask().not();

// ---------- Latitude zones (±23.43594°) ----------
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var tropic    = lat.abs().lte(23.43594);
var southMask = lat.lt(-23.43594);

// ---------- Base aridity classes (your thresholds) ----------
var aridBase = ee.Image(6)       // start as Humid (6)
  .where(AI.lte(0.01), 8)        // ocean-ish rule
  .where(AI.lt(0.075), 5)        // Semihumid
  .where(AI.lt(0.050), 2)        // Semiarid
  .where(AI.lt(0.025), 1)        // Arid Desert
  .rename('aridity');

// ---------- HS ratio (Apr–Sep share) ----------
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---------- Final class map — oceans included, cold wins ----------
var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gt(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gt(0.8)),    4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gt(0.6)), 3) // Mediterranean
  // mark masked-AI areas (oceans) as class 8 (cyan)
  .where(oceanMask, 8)
  // ensure cold "no aridity" wins even where AI is missing
  .where(coldCond, 7)
  .rename('climateClass');

// ===========================
// Temperature class functions
// ===========================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9)  // X -- Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8)  // Z2 - Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7)  // Z1 - Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6)  // A2 - Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5)  // A1 - Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4)  // B2 - Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3)  // B1 - Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2)  // C2 - Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1)  // C1 - Freezing Summer
    .where(tC.lt(0),                   0); // Y -- Frigid Summer
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9)  // Z - Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),   8)  // A - Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7)  // B - Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6)  // C - Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5)  // D - Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4)  // E - Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3)  // F - Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2)  // G - Arctic
    .where(tC.lt(-40),                  1); // Y - Superarctic
}

// =======================================
// Combine: cold*100 + climate*10 + summer
// =======================================
var summerClass = classifySummer(hottestC);
var coldClass   = classifyCold(coldestC);

var combined = coldClass
  .multiply(100)
  .add(clim.multiply(10))
  .add(summerClass)
  .rename('combined');
  
// === Adjustable digits ===
var firstDigit = 7;   // Hundreds place
var lastDigit  = 3;   // Ones place

// === Build the color map dynamically ===
var codeColorMap = {};

//codeColorMap[firstDigit * 100 + 10 + lastDigit] = "#ff0000"; //arid desert
//codeColorMap[firstDigit * 100 + 20 + lastDigit] = "#ff8800"; //semiarid
//codeColorMap[firstDigit * 100 + 30 + lastDigit] = "#ffff00"; //monsoon
//codeColorMap[firstDigit * 100 + 40 + lastDigit] = "#ff00ff"; //mediterranean
//codeColorMap[firstDigit * 100 + 50 + lastDigit] = "#00ff00"; //semihumid
//codeColorMap[firstDigit * 100 + 60 + lastDigit] = "#008800"; //humid
//codeColorMap[firstDigit * 100 + 80 + lastDigit] = "#00ffff";

codeColorMap[firstDigit * 100 + 70 + lastDigit] = "#000000";
codeColorMap[firstDigit * 100 + 90 + lastDigit] = "#000000";

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discrete,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (CHELSA inputs & method)',
  true, 0.7
);
