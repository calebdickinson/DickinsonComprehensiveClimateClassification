// === CHELSA v2.1 (1981–2010) — Aridity via CHELSA methods, not WorldClim ===

// ---------- Assets & constants ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID  = ASSET_PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // u16 mean PET

var NODATA_U16 = 65535;
var SCALE_PR   = 0.1;  // CHELSA pr_u16: 0.1 → mm/month
var SCALE_PET  = 0.1;  // CHELSA pet_u16 mean: 0.1 → mm/month

// ---------- Months helper ----------
var months = ee.List.sequence(1, 12);

// ---------- Monthly mean temperature (°C) from CHELSA tas_u16 (0.1 K) ----------
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

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

// Treat masked PET/AI as ocean
var oceanMask = AI.mask().not();   // ocean = true where AI is masked (PET missing)
var land = oceanMask.not();

// ---------- Latitude zones (±23.43594°) ----------
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var tropic    = lat.abs().lte(23.43594);
var southMask = lat.lt(-23.43594);

// ---------- Base aridity classes (your thresholds) ----------
// NOTE: removed the AI <= 0.01 "ocean-ish" rule; oceans are handled by oceanMask.
var aridBase = ee.Image(6)       // start as Humid (6)
  .where(AI.lt(0.075), 5)        // Semihumid
  .where(AI.lt(0.050), 2)        // Semiarid
  .where(AI.lt(0.025), 1)        // Arid Desert
  .rename('aridity');

// ---------- HS ratio (Apr–Sep share) ----------
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---------- Final class map — oceans included, cold wins ----------
var clim = aridBase
  // Explicit ocean assignment
  .where(oceanMask, 8)

  // Use land flag (not aridBase != 8) to guard seasonal classes on land only
  .where(northMask.and(land).and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(land).and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic   .and(land).and(aridBase.neq(1)).and(HS.lt(0.2)),  4) // Monsoon
  .where(tropic   .and(land).and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(southMask.and(land).and(aridBase.neq(1)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(land).and(aridBase.neq(1)).and(HS.gte(0.6)), 3) // Mediterranean

  // Split the cold rule by the true ocean/land flags
  .where(coldCond.and(oceanMask), 7)  // cold over ocean → 7
  .where(coldCond.and(land),      9)  // cold over land  → 9

  .rename('climateClass');

// ===========================
// Temperature class functions
// ===========================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9)  // Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8)  // Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7)  // Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6)  // Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5)  // Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4)  // Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3)  // Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2)  // Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1)  // Freezing Summer
    .where(tC.lt(0),                   0); // Frigid Summer
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9)  // Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),   8)  // Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7)  // Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6)  // Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5)  // Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4)  // Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3)  // Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2)  // Arctic
    .where(tC.lt(-40),                  1); // Superarctic
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

var codeColorMap = {
  //372: "#ff99cc", // F-C2 
  //373: "#ff66cc", // F-B1
  //364: "#ff00cc", // FHB2
  
  //472: "#8888FF", // E-C2
  //493: "#0000FF", // E-B1
  //464: "#002200", // EHB2
            //454: "#ff99cc", // EGB2
  //465: "#00aa88", // EHA1
            //455: "#0000ff", // EGA1
  
  //593: "#ff0000", // D-B1
  //564: "#004400", // DHB2
            //554: "#00ffcc", // DGB2
  565: "#008800", // DHA1
            555: "#00ff00", // DGA1
  //556: "#88aa88",
  556: "#ff0000", // DGA2
  //557: "#444444",
  566: "#006622", // DHA2
  //655: "#00cccc",
  //664: "#00ffff",
  //665: "#008888",
  //656: "#888888",
  666: "#004444", // CHA2
  //657: "#000000",
  //757: "#000088",
  
  /*424: "#cc6600",
  425: "#ff9933",
  525: "#ff6600",
  526: "#FFCC66",
  527: "#CC6600",
  626: "#FFCC00",
  627: "#FF8800",
  628: "#884400",
  
  517: "#ff0000",
  616: "#ff4444",
  617: "#cc0000",
  618: "#880000",
  
  444: "#880088",
  445: "#ff00ff",
  544: "#000000",
  545: "#cc00ff",
  546: "#660066"*/
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

var STATE_NAME = 'Illinois';  // <- change me

var states = ee.FeatureCollection('TIGER/2018/States');
var aoi = states.filter(ee.Filter.eq('NAME', STATE_NAME)).geometry();

var discreteAOI = discrete.clip(aoi);

Map.addLayer(
  discreteAOI,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (' + STATE_NAME + ')',
  true, 0.7
);

var visImg = discreteAOI.visualize({min: 0, max: indices.length - 1, palette: palette});
print(ui.Thumbnail(visImg, {region: aoi.bounds(1), dimensions: 3000, format: 'png'}));
