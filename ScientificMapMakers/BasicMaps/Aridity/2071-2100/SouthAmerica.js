// === Aridity Map (CHELSA v2.1, 2071–2100)

var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID = PREFIX + 'CHELSA_pet_penman_mean_2071-2100'; // adjust if needed

var SCALE_PR  = 0.1;  // pr_u16: 0.1 → mm/month (set to 1.0 if already mm)
var SCALE_PET = 1;  // pet_u16 mean: 0.1 → mm/month (set to 1.0 if float)
var NODATA_U16 = 65535;

// ----- tas (°C) from your u16 monthly files -----
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2071_2100_norm';
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
  var pid = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' + nn + '_2071_2100_norm';
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

// ---------- Latitude zones (±23.43594°) ----------
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(23.43594);
var tropic    = pixelLat.abs().lte(23.43594);
var southMask = pixelLat.lt(-23.43594);

// ---------- Base aridity classes (your thresholds from the “good” code) ----------
// Start as Humid(6); special ocean-ish guard at AI<=0.01; then SH/S/Desert
var aridBase = ee.Image(6)       // 6 = Humid
  .where(AI.lte(0.01), 8)        // 8 = (we'll keep as "ocean-ish" placeholder; real oceans set later)
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

// ---------- Final climate class: Med first, then global monsoon, then oceans, then cold ----------
var clim = aridBase
  // Mediterranean (unchanged logic)
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

  // Oceans, then cold override (unchanged)
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// ===========================
// Special rule:
// Temperate rainforest with Mediterranean percipitation seasonality ratio → reclassified as humid
// ===========================

// Driest-month precipitation (mm/month)
var P_driest = prMonthly.min();

// Apply override AFTER Mediterranean logic
clim = clim.where(
  clim.eq(3) // Mediterranean only
    .and(P_driest.gte(PET_ann.divide(240))),
  6          // Reclassify as Humid
);

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

var discreteLand = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discreteLand.updateMask(clim.neq(8)), // remove .updateMask(clim.neq(8)) to show ocean color
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (CHELSA, oceans included; cold wins)',
  true, 0.7
);

// =======================================================================
// South America thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) Tall South America bounding box
var southAmericaFull = ee.Geometry.Rectangle(
  [-82, -56, -34, 13],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Country names exactly as in your GAUL list
var southAmericaCountriesFull = [
  'Argentina',
  'Bolivia',
  'Brazil',
  'Chile',
  'Colombia',
  'Ecuador',
  'Guyana',
  'Paraguay',
  'Peru',
  'Suriname',
  'Uruguay',
  'Venezuela',
  'French Guiana',
  'Falkland Islands (Malvinas)'
];

// 3) Admin-0 (full GAUL)
var admin0SA_Full = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', southAmericaCountriesFull));

// 4) Admin-1 (full GAUL states)
var admin1SA_Full = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', southAmericaCountriesFull))
  .filterBounds(southAmericaFull);

// 5) Land mask (clip climate strictly to SA land)
var saMask_Full = ee.Image()
  .byte()
  .paint(admin0SA_Full, 1)
  .selfMask();

// 6) Climate overlay clipped to SA land
var climateRGB_SA_Full = discreteLand
  .updateMask(saMask_Full)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_SA_Full = ee.Image()
  .byte()
  .paint(admin1SA_Full, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_SA_Full = ee.Image()
  .byte()
  .paint(admin0SA_Full, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite layers
var compositeSA_Full = ee.ImageCollection([
  climateRGB_SA_Full,
  admin1RGB_SA_Full,
  admin0RGB_SA_Full
]).mosaic();

// 10) High-resolution tall thumbnail (safe size)
var thumbUrlSA_Full = compositeSA_Full.getThumbURL({
  region: southAmericaFull,
  dimensions: '2048x3072',
  format: 'png'
});

print('South America FULL GAUL thumbnail URL:', thumbUrlSA_Full);

// (Optional) Add to Map for quick preview
Map.addLayer(compositeSA_Full, {}, 'South America (FULL GAUL)', true);
Map.centerObject(southAmericaFull, 3);
