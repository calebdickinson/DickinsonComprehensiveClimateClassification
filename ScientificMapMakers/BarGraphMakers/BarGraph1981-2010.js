// ====== CONFIG ======
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16   = 65535;
var SCALE_PR     = 0.1;   // CHELSA pr_u16: 0.1 → mm/month

var LAT = 39.7392;
var LON = -104.9903;

var pt  = ee.Geometry.Point([LON, LAT]);

// Month numbers 1–12
var months = ee.List.sequence(1, 12);

// ====================================
// Load monthly tasmax / tasmin (°C)
// ====================================
var tasmaxImgs = [];
var tasminImgs = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  // tasmax (K*0.1 → °C)
  var rawMax = ee.Image(ASSET_PREFIX + 'CHELSA_tasmax_' + mm + '_1981-2010_V2-1');
  var tmaxC  = rawMax
    .updateMask(rawMax.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tmaxC')
    .set('month', m);
  tasmaxImgs.push(tmaxC);

  // tasmin (K*0.1 → °C)
  var rawMin = ee.Image(ASSET_PREFIX + 'CHELSA_tasmin_' + mm + '_1981-2010_V2-1');
  var tminC  = rawMin
    .updateMask(rawMin.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tminC')
    .set('month', m);
  tasminImgs.push(tminC);
}

var tasmaxMonthly = ee.ImageCollection(tasmaxImgs);
var tasminMonthly = ee.ImageCollection(tasminImgs);

// =====================================
// Load monthly precipitation (mm/month)
// =====================================
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var rawPr = ee.Image(ASSET_PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16');
  var pr = rawPr
    .updateMask(rawPr.neq(NODATA_U16))
    .multiply(SCALE_PR)
    .rename('pr')
    .set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ====== Helpers ======
function atPoint(img, band) {
  var dict = img.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 1000,
    maxPixels: 1e9
  });
  return ee.Number(dict.get(band));
}

// °C → °F, rounded to nearest whole number
function cToF_rounded(num) {
  return num.multiply(9).divide(5).add(32).round();
}

// mm → inches, rounded to nearest tenth
function mmToIn_rounded(num) {
  return num.divide(25.4).multiply(10).round().divide(10);
}

// ====================================
// Build lists of monthly values
// ====================================

// --- Fahrenheit / inches (existing output) ---
var tmaxF = months.map(function(m) {
  var img = tasmaxMonthly.filter(ee.Filter.eq('month', m)).first();
  return cToF_rounded(atPoint(img, 'tmaxC'));
});

var tminF = months.map(function(m) {
  var img = tasminMonthly.filter(ee.Filter.eq('month', m)).first();
  return cToF_rounded(atPoint(img, 'tminC'));
});

var precipIn = months.map(function(m) {
  var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
  return mmToIn_rounded(atPoint(img, 'pr'));
});

// --- Celsius / millimeters (new output) ---
var tmaxC = months.map(function(m) {
  var img = tasmaxMonthly.filter(ee.Filter.eq('month', m)).first();
  return atPoint(img, 'tmaxC').round();
});

var tminC = months.map(function(m) {
  var img = tasminMonthly.filter(ee.Filter.eq('month', m)).first();
  return atPoint(img, 'tminC').round();
});

var precipMM = months.map(function(m) {
  var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
  return atPoint(img, 'pr').round();
});

// ====================================
// Print Fahrenheit / inches
// ====================================
var combinedF = months.map(function(m) {
  m = ee.Number(m);

  return ee.String(m).cat(': ')
    .cat(ee.Number(tmaxF.get(m.subtract(1))).format('%.0f')).cat(' ')
    .cat(ee.Number(tminF.get(m.subtract(1))).format('%.0f')).cat(' ')
    .cat(ee.Number(precipIn.get(m.subtract(1))).format('%.1f'));
});

combinedF.evaluate(function(list) {
  list.forEach(function(line) {
    print(line);
  });
});

// ====================================
// Print Celsius / millimeters
// ====================================

var combinedC = months.map(function(m) {
  m = ee.Number(m);

  return ee.String(m).cat(': ')
    .cat(ee.Number(tmaxC.get(m.subtract(1))).format('%.0f')).cat(' ')
    .cat(ee.Number(tminC.get(m.subtract(1))).format('%.0f')).cat(' ')
    .cat(ee.Number(precipMM.get(m.subtract(1))).format('%.0f'));
});

combinedC.evaluate(function(list) {
  list.forEach(function(line) {
    print(line);
  });
});

// ====================================
// Map
// ====================================
Map.addLayer(
  ee.FeatureCollection([ee.Feature(pt)]),
  {color: 'black'},
  'Selected point'
);
Map.centerObject(pt, 7);

// ====================================
// Köppen–Geiger classification (UNROUNDED, SCIENTIFIC)
// Uses CHELSA tas (monthly mean temperature)
// ====================================

var tasC_raw = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  var id = ASSET_PREFIX +
  'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

  var raw = ee.Image(id);

  var tasC = raw
    .updateMask(raw.neq(NODATA_U16))   
    .multiply(0.1)                     // 0.1 K
    .subtract(273.15)                  // → °C
    .rename('tmeanC');

  tasC_raw.push(atPoint(tasC, 'tmeanC'));
}

// Convert to ee.List
tasC_raw = ee.List(tasC_raw);


// Monthly precipitation
var precipMM_raw = months.map(function(m) {
  var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
  return atPoint(img, 'pr');
});

// -------- Temperature metrics --------
var coldestMonth   = ee.Number(tasC_raw.reduce(ee.Reducer.min()));
var warmestMonth   = ee.Number(tasC_raw.reduce(ee.Reducer.max()));
var meanAnnualTemp = ee.Number(tasC_raw.reduce(ee.Reducer.mean()));
var monthsAbove10  = ee.Number(
  tasC_raw.map(function(t){ return ee.Number(t).gte(10); })
          .reduce(ee.Reducer.sum())
);

// -------- Precipitation metrics --------
var annualPr = ee.Number(precipMM_raw.reduce(ee.Reducer.sum()));
var minPr    = ee.Number(precipMM_raw.reduce(ee.Reducer.min()));

// -------- Hemisphere-aware seasons --------
// Indices: Jan=0 ... Dec=11
var isSH = ee.Number(LAT).lt(0);
var idxAprSep = ee.List([3,4,5,6,7,8]);
var idxOctMar = ee.List([9,10,11,0,1,2]);

var summerIdx = ee.List(ee.Algorithms.If(isSH, idxOctMar, idxAprSep));
var winterIdx = ee.List(ee.Algorithms.If(isSH, idxAprSep, idxOctMar));

function pick(idx, data) {
  return ee.List(idx.map(function(i){ return ee.Number(data.get(i)); }));
}

var summerPr = pick(summerIdx, precipMM_raw);
var winterPr = pick(winterIdx, precipMM_raw);

var minSummer  = ee.Number(summerPr.reduce(ee.Reducer.min()));
var maxSummer  = ee.Number(summerPr.reduce(ee.Reducer.max()));
var minWinter  = ee.Number(winterPr.reduce(ee.Reducer.min()));
var maxWinter  = ee.Number(winterPr.reduce(ee.Reducer.max()));

var summerTotal = ee.Number(summerPr.reduce(ee.Reducer.sum()));
var winterTotal = ee.Number(winterPr.reduce(ee.Reducer.sum()));

// -------- Köppen aridity threshold --------
var aridThresh = ee.Number(
  ee.Algorithms.If(
    summerTotal.divide(annualPr).gte(0.7),
    meanAnnualTemp.multiply(20).add(280),
    ee.Algorithms.If(
      winterTotal.divide(annualPr).gte(0.7),
      meanAnnualTemp.multiply(20),
      meanAnnualTemp.multiply(20).add(140)
    )
  )
);

// ====================================
// Köppen decision tree (canonical order)
// ====================================

// ---- POLAR (E) ----
var isPolar = warmestMonth.lt(10);
var polarCode = ee.String(
  ee.Algorithms.If(warmestMonth.gt(0), 'ET', 'EF')
);

// ---- DRY (B) ----
var isDry = annualPr.lt(aridThresh);
var dryCode = ee.String(
  ee.Algorithms.If(
    annualPr.lt(aridThresh.divide(2)),
    ee.String('BW').cat(ee.Algorithms.If(meanAnnualTemp.gte(18),'h','k')),
    ee.String('BS').cat(ee.Algorithms.If(meanAnnualTemp.gte(18),'h','k'))
  )
);

// ---- TROPICAL (A) ----
var isTropical = coldestMonth.gte(18);

var tropicalCode = ee.String(
  ee.Algorithms.If(
    minPr.gte(60),
    'Af',
    ee.Algorithms.If(
      minPr.gte(ee.Number(100).subtract(annualPr.divide(25))),
      'Am',
      ee.Algorithms.If(
        ee.Number(
          summerPr.map(function(p){ return ee.Number(p).eq(minPr); })
                  .reduce(ee.Reducer.anyNonZero())
        ).eq(1),
        'As','Aw'
      )
    )
  )
);

// ---- TEMPERATE (C) / CONTINENTAL (D) ----
// 0 °C boundary
var isC = coldestMonth.gt(0).and(warmestMonth.gte(10));
var isD = coldestMonth.lte(0).and(warmestMonth.gte(10));

var cdSecond = ee.String(
  ee.Algorithms.If(
    minSummer.lt(40).and(minSummer.lt(maxWinter.divide(3))),
    's',
    ee.Algorithms.If(
      minWinter.lt(maxSummer.divide(10)),
      'w',
      'f'
    )
  )
);

var cThird = ee.String(
  ee.Algorithms.If(
    warmestMonth.gte(22),'a',
    ee.Algorithms.If(monthsAbove10.gte(4),'b','c')
  )
);

var dThird = ee.String(
  ee.Algorithms.If(
    coldestMonth.lte(-38),'d',
    ee.Algorithms.If(
      warmestMonth.gte(22),'a',
      ee.Algorithms.If(monthsAbove10.gte(4),'b','c')
    )
  )
);

var cCode = ee.String('C').cat(cdSecond).cat(cThird);
var dCode = ee.String('D').cat(cdSecond).cat(dThird);

// ---- FINAL Köppen ----
var koppen = ee.String(
  ee.Algorithms.If(
    isPolar, polarCode,
    ee.Algorithms.If(
      isDry, dryCode,
      ee.Algorithms.If(
        isTropical, tropicalCode,
        ee.Algorithms.If(isC, cCode, dCode)
      )
    )
  )
);

// ---- PRINT RESULT ----
koppen.evaluate(function(k){
  print('Köppen climate:', k);
});

// ====================================
// AI (P / PET) — numeric printout (POINT-BASED)
// ====================================

var PET_MEAN_ID = ASSET_PREFIX + 'CHELSA_pet_penman_mean_2071-2100';
var SCALE_PET   = 0.1;  // projections = 1 (baseline would be 0.1)

// PET mean image (mm/month), masked
var petMeanMmImg = ee.Image(PET_MEAN_ID)
  .updateMask(ee.Image(PET_MEAN_ID).neq(NODATA_U16))
  .multiply(SCALE_PET)
  .rename('pet_mm_month');

// Sample PET mean at the point (mm/month)
var petMeanAtPoint = atPoint(petMeanMmImg, 'pet_mm_month');

// Annual PET (mm/year)
var petAnnAtPoint = petMeanAtPoint.multiply(12);

// AI = P / PET (dimensionless)
var aiAtPoint = annualPr.divide(petAnnAtPoint);

// Print (rounded for display only)
print('Annual precipitation (mm):', annualPr.round());
print('Annual PET (mm):', petAnnAtPoint.round());
print('Aridity Index (P/PET):', aiAtPoint.multiply(1000).round().divide(1000));

