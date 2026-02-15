// ====== CONFIG ======
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16   = 65535;
var SCALE_PR     = 0.1;
var NORMAL_PERIOD = '2041-2070';

var LAT = -53.0333;
var LON = 73.4000;

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
  var rawMax = ee.Image(ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' + mm + '_2041_2070_norm');
  var tmaxC  = rawMax
    .updateMask(rawMax.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tmaxC')
    .set('month', m);
  tasmaxImgs.push(tmaxC);

  // tasmin (K*0.1 → °C)
  var rawMin = ee.Image(ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' + mm + '_2041_2070_norm');
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
  var rawPr = ee.Image(ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' + nn + '_2041_2070_norm');
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
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' +
    mm +
    '_2041_2070_norm';

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

// ====================================
// Köppen bordering climates
// ====================================

// Empty bucket to put bordering climates into if they exist
var bordering = ee.List([]);
// tolerances for bordering climates
var EPS_TEMP = 0.5;  // °C
var EPS_PR   = 5;    // mm (monthly)
var EPS_PY   = 25;   // mm/year (annual)

var nearFreezeLine = warmestMonth.gte(-0.5)
  .and(warmestMonth.lt(0.5));

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    nearFreezeLine,
    ee.Algorithms.If(
      koppen.equals('ET'),
      ['EF'],
      ['ET']
    ),
    []
  ))
);

var nearET = warmestMonth.gte(10)
  .and(warmestMonth.lt(10.5));

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(nearET, ['ET'], []))
);

// Only run if current climate is B
var isB = ee.String(koppen.slice(0,1)).compareTo('B').eq(0);

// ---- Desert vs Steppe ----
var nearBW_BS = annualPr.subtract(aridThresh.divide(2)).abs().lt(EPS_PY);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isB.and(nearBW_BS),
    ee.Algorithms.If(
      koppen.slice(0,2).equals('BW'),
      [ee.String('BS').cat(koppen.slice(2))],
      [ee.String('BW').cat(koppen.slice(2))]
    ),
    []
  ))
);

// ---- Hot vs Cold ----
var nearHotCold = meanAnnualTemp.subtract(18).abs().lt(EPS_TEMP);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isB.and(nearHotCold),
    ee.Algorithms.If(
      koppen.slice(2).equals('h'),
      [koppen.slice(0,2).cat('k')],
      [koppen.slice(0,2).cat('h')]
    ),
    []
  ))
);

// ------------------------------------
// Tropical bordering (Af / Am / Aw / As)
// ------------------------------------

var EPS_TROP = 5;   // mm tolerance

var isA = ee.String(koppen.slice(0,1)).compareTo('A').eq(0);

var monsoonLimit = ee.Number(100).subtract(annualPr.divide(25));

// ---- Near rainforest boundary (60 mm) ----
var nearAf = minPr.subtract(60).abs().lt(EPS_TROP);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isA.and(nearAf),
    ee.Algorithms.If(
      ee.String(koppen).compareTo('Af').eq(0),
      ['Am'],
      ['Af']
    ),
    []
  ))
);


// ---- Near monsoon boundary ----
var nearMonsoon = minPr.subtract(monsoonLimit).abs().lt(EPS_TROP);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isA.and(nearMonsoon),
    ee.Algorithms.If(
      ee.String(koppen).compareTo('Am').eq(0),
      // could fall to Aw or As depending on your season logic
      ee.Algorithms.If(
        ee.Number(
          summerPr.map(function(p){ return ee.Number(p).eq(minPr); })
                  .reduce(ee.Reducer.anyNonZero())
        ).eq(1),
        ['As'],
        ['Aw']
      ),
      ['Am']
    ),
    []
  ))
);

// ------------------------------------
// C ↔ D boundary
// ------------------------------------

var nearCD = coldestMonth.abs().lt(EPS_TEMP);

var isCD = ee.String(koppen.slice(0,1)).compareTo('C').eq(0)
  .or(ee.String(koppen.slice(0,1)).compareTo('D').eq(0));

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isCD.and(nearCD),
    [ee.String(
      ee.Algorithms.If(
        ee.String(koppen.slice(0,1)).compareTo('C').eq(0),
        'D',
        'C'
      )
    ).cat(koppen.slice(1))],
    []
  ))
);

// ------------------------------------
// s ↔ f
// ------------------------------------

var near_s = minSummer.subtract(maxWinter.divide(3)).abs().lt(EPS_PR);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isCD.and(near_s),
    ee.Algorithms.If(
      koppen.slice(1,2).compareTo('s').eq(0),
      [koppen.slice(0,1).cat('f').cat(koppen.slice(2))],
      [koppen.slice(0,1).cat('s').cat(koppen.slice(2))]
    ),
    []
  ))
);

// ------------------------------------
// w ↔ f
// ------------------------------------

var near_w = minWinter.subtract(maxSummer.divide(10)).abs().lt(EPS_PR);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isCD.and(near_w),
    ee.Algorithms.If(
      koppen.slice(1,2).compareTo('w').eq(0),
      [koppen.slice(0,1).cat('f').cat(koppen.slice(2))],
      [koppen.slice(0,1).cat('w').cat(koppen.slice(2))]
    ),
    []
  ))
);

// ------------------------------------
// a ↔ b
// ------------------------------------

var near_ab = warmestMonth.subtract(22).abs().lt(EPS_TEMP);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isCD.and(near_ab),
    ee.Algorithms.If(
      koppen.slice(2).compareTo('a').eq(0),
      [koppen.slice(0,2).cat('b')],
      [koppen.slice(0,2).cat('a')]
    ),
    []
  ))
);

// ------------------------------------
// b ↔ c
// ------------------------------------

var near_bc = monthsAbove10.subtract(4).abs().lt(1);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isCD.and(near_bc),
    ee.Algorithms.If(
      koppen.slice(2).compareTo('b').eq(0),
      [koppen.slice(0,2).cat('c')],
      [koppen.slice(0,2).cat('b')]
    ),
    []
  ))
);

// ------------------------------------
// c ↔ d  (continental extreme)
// ------------------------------------

var near_cd_extreme = coldestMonth.add(38).abs().lt(EPS_TEMP);

bordering = bordering.cat(
  ee.List(ee.Algorithms.If(
    isCD.and(near_cd_extreme),
    ee.Algorithms.If(
      koppen.slice(2).compareTo('d').eq(0),
      [koppen.slice(0,2).cat('c')],
      [koppen.slice(0,2).cat('d')]
    ),
    []
  ))
);

// ------------------------------------
// Finalize bordering list
// ------------------------------------

// remove duplicates
bordering = bordering.distinct();

// remove the actual climate itself
bordering = bordering.removeAll(ee.List([koppen]));

// convert list → printable string
var koppenBorderingStr = ee.String(
  ee.Algorithms.If(
    bordering.length().gt(0),
    bordering.join(' '),
    'none'
  )
);

// ====================================
// Hottest and coldest month means
// ====================================

var tasMonthlyImgs = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  var tas = ee.Image(
      ASSET_PREFIX +
      'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' +
      mm + '_2041_2070_norm'
    )
    .updateMask(ee.Image(
      ASSET_PREFIX +
      'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' +
      mm + '_2041_2070_norm'
    ).neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .rename('tmeanC');

  tasMonthlyImgs.push(tas);
}

var tasMonthlyIC = ee.ImageCollection(tasMonthlyImgs);

var warmestMonth = tasMonthlyIC.max().reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: pt,
  scale: 1000,
  maxPixels: 1e9
}).getNumber('tmeanC');

var coldestMonth = tasMonthlyIC.min().reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: pt,
  scale: 1000,
  maxPixels: 1e9
}).getNumber('tmeanC');

var annualMean = tasMonthlyIC.mean().reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: pt,
  scale: 1000,
  maxPixels: 1e9
}).getNumber('tmeanC');

// ====================================
// Dickinson climate code (POINT)
// ====================================

// ---------- Cold letter ----------
var coldLetter = ee.String(
  ee.Algorithms.If(coldestMonth.gte(40), 'X',
  ee.Algorithms.If(coldestMonth.gte(30), 'Z',
  ee.Algorithms.If(coldestMonth.gte(20), 'A',
  ee.Algorithms.If(coldestMonth.gte(10), 'B',
  ee.Algorithms.If(coldestMonth.gte(0),  'C',
  ee.Algorithms.If(coldestMonth.gte(-10),'D',
  ee.Algorithms.If(coldestMonth.gte(-20),'E',
  ee.Algorithms.If(coldestMonth.gte(-30),'F',
  ee.Algorithms.If(coldestMonth.gte(-40),'G','Y')))))))))
);

// ---------- Summer letter ----------
var summerLetter = ee.String(
  ee.Algorithms.If(warmestMonth.gte(50), 'H',
  ee.Algorithms.If(warmestMonth.gte(40), 'X',
  ee.Algorithms.If(warmestMonth.gte(35), 'z2',
  ee.Algorithms.If(warmestMonth.gte(30), 'z1',
  ee.Algorithms.If(warmestMonth.gte(25), 'a2',
  ee.Algorithms.If(warmestMonth.gte(20), 'a1',
  ee.Algorithms.If(warmestMonth.gte(15), 'b2',
  ee.Algorithms.If(warmestMonth.gte(10), 'b1',
  ee.Algorithms.If(warmestMonth.gte(5),  'c2',
  ee.Algorithms.If(warmestMonth.gte(0),  'c1','Y'))))))))))
);

// ---------- Aridity letter ----------
// ---- Cold rule ----
var coldCond = warmestMonth.lt(15).or(coldestMonth.lt(-20));

// ---- Hemisphere logic ----
var isNorth = ee.Number(LAT).gt(23.43594);
var isSouth = ee.Number(LAT).lt(-23.43594);
var inTropics = ee.Number(LAT).abs().lte(23.43594);

// ---- High sun precipitation (Apr–Sep NH) ----
var P_hs = ee.Number(summerTotal);
var HS   = P_hs.divide(annualPr);

// ---- Rolling 6-month dominance (ANY window) ----
var prList = ee.List(precipMM_raw);

var P6ratio = ee.Number(
  ee.List.sequence(0,11).map(function(start){
    start = ee.Number(start);
    var idx = ee.List.sequence(start, start.add(5))
      .map(function(i){ return ee.Number(i).mod(12); });

    return ee.Number(
      idx.map(function(i){ return ee.Number(prList.get(i)); })
         .reduce(ee.Reducer.sum())
    );
  }).reduce(ee.Reducer.max())
).divide(annualPr);

// ---------- Final code ----------
var dickinsonCode = coldLetter.cat(summerLetter);

// ====================================
// Dickinson bordering climates
// ====================================

// Bucket
var dBordering = ee.List([]);

// Tolerances
var EPS_D_TEMP  = 0.5;   // °C near a temperature boundary
var EPS_AI      = 0.01;  // AI near boundary
var EPS_RATIO   = 0.02;  // HS or P6ratio near boundary
var EPS_MM      = 5;     // mm for rainforest cancel boundary (P_driest vs PET/240)

// Helper to append list if condition true
function addBorder(cond, listOrEmpty) {
  return ee.List(ee.Algorithms.If(cond, listOrEmpty, ee.List([])));
}

// Current final code (for removeAll later)
var dickinsonNow = dickinsonCode;

// --------------------
// 1) Cold-letter borders
// --------------------
var nearCold40  = coldestMonth.subtract(40).abs().lt(EPS_D_TEMP);
var nearCold30  = coldestMonth.subtract(30).abs().lt(EPS_D_TEMP);
var nearCold20  = coldestMonth.subtract(20).abs().lt(EPS_D_TEMP);
var nearCold10  = coldestMonth.subtract(10).abs().lt(EPS_D_TEMP);
var nearCold0   = coldestMonth.subtract(0).abs().lt(EPS_D_TEMP);
var nearColdM10 = coldestMonth.add(10).abs().lt(EPS_D_TEMP);
var nearColdM20 = coldestMonth.add(20).abs().lt(EPS_D_TEMP);
var nearColdM30 = coldestMonth.add(30).abs().lt(EPS_D_TEMP);
var nearColdM40 = coldestMonth.add(40).abs().lt(EPS_D_TEMP);

function swapCold(newCold) {
  return ee.List([ ee.String(newCold).cat(summerLetter) ]);
}

dBordering = dBordering
  .cat(addBorder(nearCold40,  swapCold('Z')))
  .cat(addBorder(nearCold30,  swapCold('A')))
  .cat(addBorder(nearCold20,  swapCold('B')))
  .cat(addBorder(nearCold10,  swapCold('C')))
  .cat(addBorder(nearCold0,   swapCold('D')))
  .cat(addBorder(nearColdM10, swapCold('E')))
  .cat(addBorder(nearColdM20, swapCold('F')))
  .cat(addBorder(nearColdM30, swapCold('G')))
  .cat(addBorder(nearColdM40, swapCold('Y')));

// Also allow the opposite direction at each boundary depending where you are
// (This adds both neighbors when you're near a boundary)
dBordering = dBordering
  .cat(addBorder(nearCold40,  swapCold('X')))
  .cat(addBorder(nearCold30,  swapCold('Z')))
  .cat(addBorder(nearCold20,  swapCold('A')))
  .cat(addBorder(nearCold10,  swapCold('B')))
  .cat(addBorder(nearCold0,   swapCold('C')))
  .cat(addBorder(nearColdM10, swapCold('D')))
  .cat(addBorder(nearColdM20, swapCold('E')))
  .cat(addBorder(nearColdM30, swapCold('F')))
  .cat(addBorder(nearColdM40, swapCold('G')));

// --------------------
// 2) Summer-letter borders
// --------------------
var nearWarm50 = warmestMonth.subtract(50).abs().lt(EPS_D_TEMP);
var nearWarm40 = warmestMonth.subtract(40).abs().lt(EPS_D_TEMP);
var nearWarm35 = warmestMonth.subtract(35).abs().lt(EPS_D_TEMP);
var nearWarm30 = warmestMonth.subtract(30).abs().lt(EPS_D_TEMP);
var nearWarm25 = warmestMonth.subtract(25).abs().lt(EPS_D_TEMP);
var nearWarm20 = warmestMonth.subtract(20).abs().lt(EPS_D_TEMP);
var nearWarm15 = warmestMonth.subtract(15).abs().lt(EPS_D_TEMP);
var nearWarm10 = warmestMonth.subtract(10).abs().lt(EPS_D_TEMP);
var nearWarm5  = warmestMonth.subtract(5).abs().lt(EPS_D_TEMP);
var nearWarm0  = warmestMonth.subtract(0).abs().lt(EPS_D_TEMP);

function swapSummer(newSummer) {
  return ee.List([ coldLetter.cat(ee.String(newSummer)) ]);
}

dBordering = dBordering
  .cat(addBorder(nearWarm50, swapSummer('X')))
  .cat(addBorder(nearWarm40, swapSummer('z2')))
  .cat(addBorder(nearWarm35, swapSummer('z1')))
  .cat(addBorder(nearWarm30, swapSummer('a2')))
  .cat(addBorder(nearWarm25, swapSummer('a1')))
  .cat(addBorder(nearWarm20, swapSummer('b2')))
  .cat(addBorder(nearWarm15, swapSummer('b1')))
  .cat(addBorder(nearWarm10, swapSummer('c2')))
  .cat(addBorder(nearWarm5,  swapSummer('c1')))
  .cat(addBorder(nearWarm0,  swapSummer('Y')));

dBordering = dBordering
  .cat(addBorder(nearWarm50, swapSummer('H')))
  .cat(addBorder(nearWarm40, swapSummer('X')))
  .cat(addBorder(nearWarm35, swapSummer('z2')))
  .cat(addBorder(nearWarm30, swapSummer('z1')))
  .cat(addBorder(nearWarm25, swapSummer('a2')))
  .cat(addBorder(nearWarm20, swapSummer('a1')))
  .cat(addBorder(nearWarm15, swapSummer('b2')))
  .cat(addBorder(nearWarm10, swapSummer('b1')))
  .cat(addBorder(nearWarm5,  swapSummer('c2')))
  .cat(addBorder(nearWarm0,  swapSummer('c1')));

// --------------------
// Finalize bordering list
// --------------------
dBordering = dBordering.distinct();
dBordering = dBordering.removeAll(ee.List([dickinsonNow]));

var dickinsonBorderingStr = ee.String(
  ee.Algorithms.If(
    dBordering.length().gt(0),
    dBordering.join(' '),
    'none'
  )
);

// ====================================
// FORMAT METADATA AS STRINGS
// ====================================

var metaLines = ee.List([
  
  ee.String('elevation_meters: = N/A'),
  
  ee.String('hottest_month_C: ')
    .cat(warmestMonth.multiply(10).round().divide(10).format('%.1f')),

  ee.String('coldest_month_C: ')
    .cat(coldestMonth.multiply(10).round().divide(10).format('%.1f')),

  ee.String('annual_mean_C: ')
    .cat(annualMean.multiply(10).round().divide(10).format('%.1f')),
    
  ee.String('annual_pr_mm: ')
    .cat(annualPr.round().format('%.0f')),
    
  ee.String('/////////////////////////////////////////////////'),
  
  ee.String('  var period = \'').cat(NORMAL_PERIOD).cat('\';'),
  
  ee.String('  var dickinson= \'').cat(dickinsonCode).cat('\';'),
  
  ee.String('  var dickinson_bordering = \'').cat(dickinsonBorderingStr).cat('\';'),

  ee.String('  var koppen = \'').cat(koppen).cat('\';'),
  
  ee.String('  var koppen_bordering = \'').cat(koppenBorderingStr).cat('\';'),

  ee.String('  p_pet = \'N/A\';'),
    
  ee.String('  p_pet_unrounded = \'N/A\';'),
    
  ee.String('  annual_pet_mm = \'N/A\';'),
  
]);

var finalLines = metaLines
  .cat(ee.List(['  const rawLines = `']))
  .cat(combinedF.map(function(line){
    return ee.String('    ').cat(line);
  }))
  .cat(combinedC.map(function(line){
    return ee.String('    ').cat(line);
  }))
  .cat(ee.List(['  `;']))
  
finalLines.evaluate(function(list) {
  list.forEach(function(line) {
    print(line);
  });
});
