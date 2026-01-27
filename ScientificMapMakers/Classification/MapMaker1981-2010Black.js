// === CHELSA v2.1 (1981–2010) ===

// ---------- Assets & constants ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID  = ASSET_PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // u16 mean PET

var NODATA_U16 = 65535;
var SCALE_PR   = 0.1;  // CHELSA pr_u16: 0.1 → mm/month
var SCALE_PET  = 0.1;  // Should be 1 for projections and 0.1 in baseline due to unit conversion

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

// Dickinson “no-aridity due to cold” condition
var coldCond = hottestC.lt(15).or(coldestC.lt(-20));

// ---------- Monthly precipitation from CHELSA pr_u16 (0.1 → mm/month) ----------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn  = (n < 10 ? '0' + n : '' + n);
  var pid = ASSET_PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16';

  var rawPr = ee.Image(pid);
  var pr = rawPr
    .updateMask(rawPr.neq(NODATA_U16))
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
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(23.43594);
var tropic    = pixelLat.abs().lte(23.43594);
var southMask = pixelLat.lt(-23.43594);

// ---------- Base aridity classes ----------
// Start as Humid(6); special ocean-ish guard at AI<=0.01; then SH/S/Desert
var aridBase = ee.Image(6)       // 6 = Humid
  .where(AI.lte(0.01), 8)        // 8 = ("ocean-ish" placeholder; real oceans set later)
  .where(AI.lt(0.075), 5)        // 5 = Semihumid
  .where(AI.lt(0.050), 2)        // 2 = Semiarid
  .where(AI.lt(0.025), 1)        // 1 = Arid Desert
  .rename('aridity');

// ---------- HS ratio (Apr–Sep share) ----------
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---------- Rolling 6-month precipitation dominance (global) ----------
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

var clim = aridBase
  // Mediterranean
  .where(
    northMask.and(HS.lt(0.4))
      .or(southMask.and(HS.gt(0.6)))
      .and(aridBase.neq(1))
      .and(aridBase.neq(8)),
    3
  )

  // Global monsoon: ≥80% precip in ANY 6 consecutive months,
  // not Mediterranean, not Arid Desert, not ocean
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

  // Oceans, then cold override
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');
  
// ===========================
// Special rule:
// Temperate rainforest with Mediterranean percipitation seasonality ratio → reclassified as humid
// ===========================

// Driest-month precipitation (mm/month)
var P_driest = prMonthly.min();
clim = clim.where(
  clim.eq(3) // Mediterranean only
    .and(P_driest.gte(PET_ann.divide(240))),
  6          // Reclassify as Humid
);

// ===========================
// Temperature class functions
// ===========================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9)  // Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8)  // Scorching Summer
    .where(tC.gte(30).and(tC.lt(35)),  7)  // Very Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6)  // Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5)  // Warm Summer
    .where(tC.gte(15).and(tC.lt(20)),  4)  // Cool Summer
    .where(tC.gte(10).and(tC.lt(15)),  3)  // Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2)  // Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1)  // Freezing Summer
    .where(tC.lt(0),                   0); // Frigid Summer
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9)  // Hyperequatorial
    .where(tC.gte(20).and(tC.lt(30)),   8)  // Equatorial
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
  
// === Adjustable digits ===
var firstDigit = 6;   // Hundreds place
var lastDigit  = 4;   // Ones place

// === Build the color map dynamically ===
var codeColorMap = {};

codeColorMap[firstDigit * 100 + 10 + lastDigit] = "#ff0000"; // Arid ---------- ff0000
codeColorMap[firstDigit * 100 + 20 + lastDigit] = "#ff8800"; // Semiarid ------ ff8800
codeColorMap[firstDigit * 100 + 30 + lastDigit] = "#ffff00"; // Mediterranean - ffff00
codeColorMap[firstDigit * 100 + 40 + lastDigit] = "#ff00ff"; // Monsoon ------- ff00ff
codeColorMap[firstDigit * 100 + 50 + lastDigit] = "#00ff00"; // Semihumid ----- 00ff00
codeColorMap[firstDigit * 100 + 60 + lastDigit] = "#008800"; // Humid --------- 008800
codeColorMap[firstDigit * 100 + 80 + lastDigit] = "#00ffff"; // Ocean --------- 00ffff

// codeColorMap[7 * 100 + 70 + 3] = "#000000"; // Polar/Subpolar/Alpine ------- 000000

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

// =======================================================
// World thumbnail: climate + admin-0 and admin-1 borders
// =======================================================

// ---------- Non-geodesic world rectangle ----------
var world = ee.Geometry.Rectangle(
  [-180, -90, 180, 90],
  null,
  false
);

// ---------- Climate overlay ----------
var climateRGB = discrete.visualize({
  min: 0,
  max: indices.length - 1,
  palette: palette
});

// ---------- Admin-1 borders ----------
var admin1 =
  ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1');

var admin1RGB = ee.Image()
  .byte()
  .paint(admin1, 1, 1) // 1 px wide border lines
  .visualize({
    palette: ['bbbbbb']
  });

// =======================================================
// Composite (background → climate → admin-0 → admin-1)
// =======================================================

// ---------- Black background (fills transparency) ----------
var blackBG = ee.Image(1).visualize({
  palette: ['000000']
});

var composite = ee.ImageCollection([
  blackBG,
  admin1RGB,
  climateRGB
]).mosaic();

// =======================================================
// PNG thumbnail
// =======================================================

var thumbUrl = composite.getThumbURL({
  region: world,
  dimensions: '4096x2048',
  format: 'png'
});

print('World thumbnail URL:', thumbUrl);
