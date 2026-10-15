// === CHELSA TraCE21k Last Glacial Maximum (20,000 BP) — Köppen Classification ===
// Adapted from the CHELSA UKESM1 SSP5-8.5 Köppen script, driven by LGM tasmax/tasmin/pr.

// ---------- Assets & constants ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16    = 65535;

// NOTE ON UNITS: the LGM 'pr' asset here is carried forward unscaled, exactly as in
// the original Dickinson-style LGM script (no ×0.1 factor was applied there). If the
// CHELSA_TraCE21k pr_u16 assets actually use the same 0.1 mm scaling as the modern
// CHELSA V2-1 assets, uncomment SCALE_PR below and apply it to prMonthly.
// var SCALE_PR = 0.1;

// ---------- Monthly tasmax / tasmin / tmean (°C) ----------
var tasmaxImgs = [];
var tasminImgs = [];
var tasImgs    = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"

  var rawMax = ee.Image(ASSET_PREFIX + 'CHELSA_TraCE21k_tasmax_' + mm + '_-200_V1-0');
  var tmaxC  = rawMax
    .updateMask(rawMax.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tmaxC');

  var rawMin = ee.Image(ASSET_PREFIX + 'CHELSA_TraCE21k_tasmin_' + mm + '_-200_V1-0');
  var tminC  = rawMin
    .updateMask(rawMin.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tminC');

  tasmaxImgs.push(tmaxC.set('month', m));
  tasminImgs.push(tminC.set('month', m));

  // estimated monthly mean = average of tasmax/tasmin
  var tempC = tmaxC.add(tminC).divide(2)
    .rename('tmeanC')
    .set('month', m);

  tasImgs.push(tempC);
}

var monthlyTemp = ee.ImageCollection(tasImgs);

// ---------- Monthly precipitation (mm month⁻¹) ----------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn  = (n < 10 ? '0' + n : '' + n);
  var rawP = ee.Image(ASSET_PREFIX + 'CHELSA_TraCE21k_pr_' + nn + '_-200_V1-0');

  var pr = rawP
    .updateMask(rawP.neq(NODATA_U16))
    // .multiply(SCALE_PR)   // <- uncomment if this asset needs the 0.1 scale factor
    .rename('pr')
    .set('month', n);

  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ---------- Temperature statistics ----------
var hottestC = monthlyTemp
  .qualityMosaic('tmeanC').select('tmeanC').rename('hottestC');

var coldestC = monthlyTemp
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('tmeanC').multiply(-1).select('tmeanC').rename('coldestC');

var meanAnnualTemp = monthlyTemp.mean().rename('T_ann');

var monthsAbove10 = monthlyTemp
  .map(function(img){ return img.gte(10).rename('a'); })
  .sum().rename('M10');

// ---------- Precipitation statistics ----------
var P_ann = prMonthly.sum().rename('P_ann');
var minPr  = prMonthly.min().rename('minPr');

// Hemisphere-aware summer/winter halves
// NH: summer = Apr–Sep; SH: summer = Oct–Mar
var pixelLat = ee.Image.pixelLonLat().select('latitude');

var prNhS = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9]));
var prNhW = prMonthly.filter(ee.Filter.inList('month', [10,11,12,1,2,3]));

var minNhS = prNhS.min(), maxNhS = prNhS.max();
var minNhW = prNhW.min(), maxNhW = prNhW.max();

var minSum = minNhS.where(pixelLat.lt(0), minNhW);
var maxSum = maxNhS.where(pixelLat.lt(0), maxNhW);
var minWin = minNhW.where(pixelLat.lt(0), minNhS);
var maxWin = maxNhW.where(pixelLat.lt(0), maxNhS);

var P_sumH = prNhS.sum().where(pixelLat.lt(0), prNhW.sum());

// ---------- B aridity threshold (mm yr⁻¹) ----------
// thresh = 20*(T + r), r ∈ {0, 7, 14} for winter-wet / mixed / summer-wet
var sumFrac    = P_sumH.divide(P_ann);
var aridThresh = meanAnnualTemp.add(7).multiply(20)                       // mixed
  .where(sumFrac.gte(0.7), meanAnnualTemp.add(14).multiply(20))  // summer-wet
  .where(sumFrac.lte(0.3), meanAnnualTemp.multiply(20));          // winter-wet

// ═══════════════════════════════════════════════════════════════════
//  Köppen decision flags (canonical order: E → B → A → C/D)
// ═══════════════════════════════════════════════════════════════════

// ── E ────────────────────────────────────────────────────────────
var isPolar = hottestC.lt(10);

// ── B ────────────────────────────────────────────────────────────
var isDry  = P_ann.lt(aridThresh).and(isPolar.not());
var isBW   = isDry.and(P_ann.lt(aridThresh.divide(2)));
var isBS   = isDry.and(P_ann.gte(aridThresh.divide(2)));
var isHotB = meanAnnualTemp.gte(18);   // h / k boundary

// ── A ────────────────────────────────────────────────────────────
var isTrop  = coldestC.gte(18).and(isDry.not()).and(isPolar.not());
var isAf    = isTrop.and(minPr.gte(60));
var amT     = ee.Image(100).subtract(P_ann.divide(25));
var isAm    = isTrop.and(minPr.lt(60)).and(minPr.gte(amT));
var isTropD = isTrop.and(minPr.lt(60)).and(minPr.lt(amT));
// As = driest month falls in warm half; Aw = driest month in cool half
var isAs    = isTropD.and(minSum.lte(minWin));
var isAw    = isTropD.and(minSum.gt(minWin));

// ── C / D ────────────────────────────────────────────────────────
var other = isPolar.not().and(isDry.not()).and(isTrop.not());
var isC   = other.and(coldestC.gt(0));
var isD   = other.and(coldestC.lte(0)).and(hottestC.gte(10));

// Second letter (precipitation seasonality)
var isS = minSum.lt(40).and(minSum.lt(maxWin.divide(3)));   // dry summer
var isW = minWin.lt(maxSum.divide(10)).and(isS.not());       // dry winter
// 'f' = not isS and not isW

// Third letter
var isHotSum = hottestC.gte(22);                              // → a
var isWrmSum = hottestC.lt(22).and(monthsAbove10.gte(4));     // → b
// → c : neither a nor b
var isVCold  = coldestC.lte(-38);                             // → d (D only)

// ═══════════════════════════════════════════════════════════════════
//  Numeric code table
//   0  ocean/nodata      1 EF    2 ET
//   3 BWh  4 BWk   5 BSh  6 BSk
//   7 Af   8 Am    9 As  10 Aw
//  11 Csa 12 Csb 13 Csc  14 Cwa 15 Cwb 16 Cwc  17 Cfa 18 Cfb 19 Cfc
//  20 Dsa 21 Dsb 22 Dsc 23 Dsd  24 Dwa 25 Dwb 26 Dwc 27 Dwd
//  28 Dfa 29 Dfb 30 Dfc 31 Dfd
// ═══════════════════════════════════════════════════════════════════
var koppen = ee.Image(0)

  // ── Polar ─────────────────────────────────────────────────────
  .where(isPolar.and(hottestC.gt(0)),  2)    // ET
  .where(isPolar.and(hottestC.lte(0)), 1)    // EF

  // ── Dry ───────────────────────────────────────────────────────
  .where(isBW.and(isHotB),            3)    // BWh
  .where(isBW.and(isHotB.not()),      4)    // BWk
  .where(isBS.and(isHotB),            5)    // BSh
  .where(isBS.and(isHotB.not()),      6)    // BSk

  // ── Tropical ──────────────────────────────────────────────────
  .where(isAf,                         7)    // Af
  .where(isAm,                         8)    // Am
  .where(isAs,                         9)    // As
  .where(isAw,                        10)    // Aw

  // ── Temperate – dry summer ────────────────────────────────────
  .where(isC.and(isS).and(isHotSum),                                         11)  // Csa
  .where(isC.and(isS).and(isWrmSum),                                         12)  // Csb
  .where(isC.and(isS).and(isHotSum.not()).and(isWrmSum.not()),                13)  // Csc
  // ── Temperate – dry winter ────────────────────────────────────
  .where(isC.and(isW).and(isHotSum),                                         14)  // Cwa
  .where(isC.and(isW).and(isWrmSum),                                         15)  // Cwb
  .where(isC.and(isW).and(isHotSum.not()).and(isWrmSum.not()),                16)  // Cwc
  // ── Temperate – no dry season ─────────────────────────────────
  .where(isC.and(isS.not()).and(isW.not()).and(isHotSum),                     17)  // Cfa
  .where(isC.and(isS.not()).and(isW.not()).and(isWrmSum),                     18)  // Cfb
  .where(isC.and(isS.not()).and(isW.not()).and(isHotSum.not()).and(isWrmSum.not()), 19)  // Cfc

  // ── Continental – dry summer ──────────────────────────────────
  .where(isD.and(isS).and(isVCold),                                          23)  // Dsd
  .where(isD.and(isS).and(isVCold.not()).and(isHotSum),                      20)  // Dsa
  .where(isD.and(isS).and(isVCold.not()).and(isWrmSum),                      21)  // Dsb
  .where(isD.and(isS).and(isVCold.not()).and(isHotSum.not()).and(isWrmSum.not()), 22)  // Dsc
  // ── Continental – dry winter ──────────────────────────────────
  .where(isD.and(isW).and(isVCold),                                          27)  // Dwd
  .where(isD.and(isW).and(isVCold.not()).and(isHotSum),                      24)  // Dwa
  .where(isD.and(isW).and(isVCold.not()).and(isWrmSum),                      25)  // Dwb
  .where(isD.and(isW).and(isVCold.not()).and(isHotSum.not()).and(isWrmSum.not()), 26)  // Dwc
  // ── Continental – no dry season ───────────────────────────────
  .where(isD.and(isS.not()).and(isW.not()).and(isVCold),                      31)  // Dfd
  .where(isD.and(isS.not()).and(isW.not()).and(isVCold.not()).and(isHotSum),   28)  // Dfa
  .where(isD.and(isS.not()).and(isW.not()).and(isVCold.not()).and(isWrmSum),   29)  // Dfb
  .where(isD.and(isS.not()).and(isW.not()).and(isVCold.not()).and(isHotSum.not()).and(isWrmSum.not()), 30)  // Dfc

  .rename('koppen')
  .updateMask(hottestC.mask().and(P_ann.mask()));   // mask oceans / nodata

// ---------- LGM land mask: exclude bedrock > 125 m below modern sea level ----------
// Keeps areas of continental shelf exposed by lower LGM sea level, drops deep ocean.
var bedrock     = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
var bedrockMask = bedrock.gte(-125);

koppen = koppen.updateMask(bedrockMask);

// ═══════════════════════════════════════════════════════════════════
//  Visualization — Wikipedia-standard hex colours
// ═══════════════════════════════════════════════════════════════════
var koppenPalette = [
  'FFFFFF',  //  0 ocean
  '666666',  //  1 EF
  'B2B2B2',  //  2 ET
  'FF0000',  //  3 BWh
  'FF9696',  //  4 BWk
  'F5A500',  //  5 BSh
  'FFDC64',  //  6 BSk
  '0000FF',  //  7 Af
  '0078FF',  //  8 Am
  '46AAFA',  //  9 As   (no distinct Wikipedia color; using Aw)
  '46AAFA',  // 10 Aw
  'FFFF00',  // 11 Csa
  'C8C800',  // 12 Csb
  '969600',  // 13 Csc
  '96FF96',  // 14 Cwa
  '64C864',  // 15 Cwb
  '329632',  // 16 Cwc
  'C8FF50',  // 17 Cfa
  '64FF50',  // 18 Cfb
  '32C800',  // 19 Cfc
  'FF00FF',  // 20 Dsa
  'C800C8',  // 21 Dsb
  '963296',  // 22 Dsc
  '966496',  // 23 Dsd
  'AAAFFF',  // 24 Dwa
  '5A78DC',  // 25 Dwb
  '4B50B4',  // 26 Dwc
  '320087',  // 27 Dwd
  '00FFFF',  // 28 Dfa
  '37C8FF',  // 29 Dfb
  '007D7D',  // 30 Dfc
  '00465F'   // 31 Dfd
];

Map.addLayer(
  koppen,
  { min: 0, max: 31, palette: koppenPalette },
  'Köppen (LGM 20,000 BP, TraCE21k)',
  true,
  0.8
);

// ═══════════════════════════════════════════════════════════════════
//  UI — click panel
// ═══════════════════════════════════════════════════════════════════
var koppenLabels = [
  '',    'EF',  'ET',
  'BWh', 'BWk', 'BSh', 'BSk',
  'Af',  'Am',  'As',  'Aw',
  'Csa', 'Csb', 'Csc',
  'Cwa', 'Cwb', 'Cwc',
  'Cfa', 'Cfb', 'Cfc',
  'Dsa', 'Dsb', 'Dsc', 'Dsd',
  'Dwa', 'Dwb', 'Dwc', 'Dwd',
  'Dfa', 'Dfb', 'Dfc', 'Dfd'
];

var panel = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '5px',
    backgroundColor: 'rgba(255,255,255,0.85)'
  }
});
panel.add(ui.Label('Click map for Köppen type (LGM):', {
  fontWeight: 'bold', fontSize: '14px'
}));
var resultLbl = ui.Label({
  value: '',
  style: {
    fontWeight: 'bold',
    fontSize:   '30px',
    textAlign:  'center',
    stretch:    'horizontal',
    margin:     '8px 0 0 0'
  }
});
panel.add(resultLbl);
ui.root.add(panel);

Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  koppen
    .reduceRegion({ reducer: ee.Reducer.first(), geometry: pt, scale: 500 })
    .get('koppen')
    .evaluate(function(code) {
      resultLbl.setValue(code === null ? '(ocean / nodata / ice)' : (koppenLabels[code] || ''));
    });
});

// ======================================================
// World thumbnail: climate + admin-0 and admin-1 borders
// ======================================================

// ---------- Non-geodesic world rectangle ----------
var world = ee.Geometry.Rectangle(
  [-180, -90, 180, 90],
  null,
  false
);

// ---------- Climate overlay ----------
// (koppen is already masked to land/valid pixels above, so no extra ocean mask needed)
var climateRGB = koppen.visualize({
  min: 0,
  max: 31,
  palette: koppenPalette
});

// ---------- Admin-0 borders ----------
var admin0Clean = ee.Image(
  'projects/ordinal-crowbar-459807-m2/assets/gaul0_georef'
);

var admin0RGB = admin0Clean
  .select(['b1', 'b2', 'b3'])            // RGB
  .updateMask(admin0Clean.select('b4'))  // alpha
  .rename(['vis-red', 'vis-green', 'vis-blue']);

// ---------- Admin-1 borders (CLEAN raster asset) ----------
var admin1Clean = ee.Image(
  'projects/ordinal-crowbar-459807-m2/assets/gaul1_georef'
);

var admin1RGB = ee.Image(1)
  .updateMask(admin1Clean.select('b4')) // alpha
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// ---------- Composite ----------
var composite = ee.ImageCollection([
  climateRGB,
  admin1RGB,
  admin0RGB
]).mosaic();

// ---------- PNG thumbnail ----------
var thumbUrl = composite.getThumbURL({
  region: world,
  dimensions: '4096x2048',
  format: 'png'
});

print('World thumbnail URL:', thumbUrl);

