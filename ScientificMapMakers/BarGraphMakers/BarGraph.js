// ====== CONFIG ======
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16   = 65535;
var SCALE_PR     = 0.1;

var PERIODS = [
  '1981-2010',
  '2011-2040',
  '2041-2070',
  '2071-2100'
];

var CITIES = [
  {name: 'Santa Rosa, Argentina', lat: -36.6203, lon: -64.2900},
  {name: 'Córdoba, Argentina', lat: -31.4201, lon: -64.1888},
  {name: 'Rosario, Argentina', lat: -32.9442, lon: -60.6505},
  {name: 'Puerto Aysén, Chile', lat: -45.4030, lon: -72.7014},
  {name: 'Puerto Montt, Chile', lat: -41.4693, lon: -72.9424}
];

// Month numbers 1–12
var months = ee.List.sequence(1, 12);

// ====================================
// PERIOD SWITCHBOARD
// ====================================
function getPeriodConfig(period) {

  var projSuffix = {
    '2011-2040': '2011_2040_norm',
    '2041-2070': '2041_2070_norm',
    '2071-2100': '2071_2100_norm'
  };

  var isBaseline = (period === '1981-2010');

  return {

    // =========================
    // tas mean
    // =========================
    tasMean: function(mm) {

      if (isBaseline) {
        return 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';
      }

      return 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' +
             mm + '_' + projSuffix[period];
    },

    // =========================
    // tasmax
    // =========================
    tasmax: function(mm) {

      if (isBaseline) {
        return 'CHELSA_tasmax_' + mm + '_1981-2010_V2-1';
      }

      return 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' +
             mm + '_' + projSuffix[period];
    },

    // =========================
    // tasmin
    // =========================
    tasmin: function(mm) {

      if (isBaseline) {
        return 'CHELSA_tasmin_' + mm + '_1981-2010_V2-1';
      }

      return 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' +
             mm + '_' + projSuffix[period];
    },

    // =========================
    // precipitation
    // =========================
    pr: function(mm) {

      if (isBaseline) {
        return 'CHELSA_pr_' + mm + '_1981-2010_V2-1_u16';
      }

      return 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' +
             mm + '_' + projSuffix[period];
    },

    // =========================
    // PET mean
    // =========================
    petMean: isBaseline
      ? 'CHELSA_pet_penman_mean_1981-2010_V2-1'
      : 'CHELSA_pet_penman_mean_' + period,

    // =========================
    // scaling
    // =========================
    petScale: isBaseline ? 0.01 : 0.1,
    tasScale: 0.1,
    prScale: SCALE_PR
  };
}

// ====================================
// MAIN RUNNER
// ====================================
function runForPeriod(NORMAL_PERIOD, pt, LAT, elevation) {

  var CFG = getPeriodConfig(NORMAL_PERIOD);

  // ====================================
  // Load monthly tasmax / tasmin (°C)
  // ====================================
  var tasmaxImgs = [];
  var tasminImgs = [];

  for (var m = 1; m <= 12; m++) {
    var mm = (m < 10 ? '0' + m : '' + m);

    // tasmax
    var rawMax = ee.Image(ASSET_PREFIX + CFG.tasmax(mm));
    var tmaxC  = rawMax
      .updateMask(rawMax.neq(NODATA_U16))
      .multiply(CFG.tasScale)
      .subtract(273.15)
      .rename('tmaxC')
      .set('month', m);
    tasmaxImgs.push(tmaxC);

    // tasmin
    var rawMin = ee.Image(ASSET_PREFIX + CFG.tasmin(mm));
    var tminC  = rawMin
      .updateMask(rawMin.neq(NODATA_U16))
      .multiply(CFG.tasScale)
      .subtract(273.15)
      .rename('tminC')
      .set('month', m);
    tasminImgs.push(tminC);
  }

  var tasmaxMonthly = ee.ImageCollection(tasmaxImgs);
  var tasminMonthly = ee.ImageCollection(tasminImgs);

  // =====================================
  // Load monthly precipitation
  // =====================================
  var prImgs = [];
  for (var n = 1; n <= 12; n++) {
    var nn = (n < 10 ? '0' + n : '' + n);
    var rawPr = ee.Image(ASSET_PREFIX + CFG.pr(nn));
    var pr = rawPr
      .updateMask(rawPr.neq(NODATA_U16))
      .multiply(CFG.prScale)
      .rename('pr')
      .set('month', n);
    prImgs.push(pr);
  }
  var prMonthly = ee.ImageCollection(prImgs);
  
  // ---- Annual precipitation (mm/year) from THIS period ----
  var precipMM_raw = months.map(function(m) {
    var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
    return atPoint(img, 'pr', pt); // UNROUNDED mm/month
  });
  
  var annualPr = ee.Number(precipMM_raw.reduce(ee.Reducer.sum()));
  
  // ====================================
  // AI (P / PET) — numeric printout (POINT-BASED)
  // ====================================
  
  // PERIOD-AWARE PET
  var PET_MEAN_ID = ASSET_PREFIX + CFG.petMean;
  var SCALE_PET   = CFG.petScale;
  
  // PET mean image (mm/month), masked
  var petRaw = ee.Image(PET_MEAN_ID);
  
  var petMeanMmImg = petRaw
    .updateMask(petRaw.neq(NODATA_U16))
    .multiply(SCALE_PET)
    .rename('pet_mm_month');
  
  // Sample PET at point
    var rawPet = petMeanMmImg.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 1000,
    maxPixels: 1e9
  }).get('pet_mm_month');
    
  // kill null immediately
  var petMeanAtPoint = ee.Number(
    ee.Algorithms.If(rawPet, rawPet, 0)
  );
  
  // Annual PET (mm/year)
  var petAnnAtPoint = petMeanAtPoint.multiply(12);
  
  // Aridity Index (dimensionless)
  var aiAtPoint = annualPr.divide(petAnnAtPoint);

  // ====== Helpers ======
  function atPoint(img, band, pt) {
    var proj = img.projection();
    var dict = img.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: pt,
      crs: proj,
      scale: proj.nominalScale(),
      maxPixels: 1e9
    });
    return ee.Number(dict.get(band));
  }

  function cToF_rounded(num) {
    return num.multiply(9).divide(5).add(32).round();
  }

  function mmToIn_rounded(num) {
    return num.divide(25.4).multiply(10).round().divide(10);
  }

  // ====================================
  // Build lists
  // ====================================

  var tmaxF = months.map(function(m) {
    var img = tasmaxMonthly.filter(ee.Filter.eq('month', m)).first();
    return cToF_rounded(atPoint(img, 'tmaxC', pt));
  });

  var tminF = months.map(function(m) {
    var img = tasminMonthly.filter(ee.Filter.eq('month', m)).first();
    return cToF_rounded(atPoint(img, 'tminC', pt));
  });

  var precipIn = months.map(function(m) {
    var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
    return mmToIn_rounded(atPoint(img, 'pr', pt));
  });

  var tmaxC = months.map(function(m) {
    var img = tasmaxMonthly.filter(ee.Filter.eq('month', m)).first();
    return atPoint(img, 'tmaxC', pt).round();
  });

  var tminC = months.map(function(m) {
    var img = tasminMonthly.filter(ee.Filter.eq('month', m)).first();
    return atPoint(img, 'tminC', pt).round();
  });

  var precipMM = months.map(function(m) {
    var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
    return atPoint(img, 'pr', pt).round();
  });

  // ====================================
  // PRINT BLOCKS
  // ====================================

  var combinedF = months.map(function(m) {
    m = ee.Number(m);
    return ee.String(m).cat(': ')
      .cat(ee.Number(tmaxF.get(m.subtract(1))).format('%.0f')).cat(' ')
      .cat(ee.Number(tminF.get(m.subtract(1))).format('%.0f')).cat(' ')
      .cat(ee.Number(precipIn.get(m.subtract(1))).format('%.1f'));
  });

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
  
    var id = ASSET_PREFIX + CFG.tasMean(mm);
  
    var raw = ee.Image(id);
  
    var tasC = raw
      .updateMask(raw.neq(NODATA_U16))
      .multiply(CFG.tasScale)
      .subtract(273.15)
      .rename('tmeanC');
  
    tasC_raw.push(atPoint(tasC, 'tmeanC', pt));
  }
  
  // Convert to ee.List
  tasC_raw = ee.List(tasC_raw);
  
  // Monthly precipitation
  var precipMM_raw = months.map(function(m) {
    var img = prMonthly.filter(ee.Filter.eq('month', m)).first();
    return atPoint(img, 'pr', pt);
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
  // A ↔ C boundary (18 °C)
  // ------------------------------------
  
  var nearAC = coldestMonth.subtract(18).abs().lt(EPS_TEMP);
  
  var firstLetter = ee.String(koppen.slice(0,1));
  
  var borderingAC = ee.String(
    ee.Algorithms.If(
      firstLetter.compareTo('A').eq(0),
      // A → build proper C code
      ee.String('C').cat(cdSecond).cat(cThird),
      ee.Algorithms.If(
        firstLetter.compareTo('C').eq(0),
        // C → use tropical decision tree result
        tropicalCode,
        ''
      )
    )
  );
  
  bordering = bordering.cat(
    ee.List(
      ee.Algorithms.If(
        nearAC.and(
          firstLetter.compareTo('A').eq(0)
          .or(firstLetter.compareTo('C').eq(0))
        ),
        [borderingAC],
        []
      )
    )
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
  
  var near_s = minSummer.subtract(maxWinter.divide(3)).abs().lt(EPS_PR)
    .and(minSummer.lt(40 + EPS_PR));
  
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
  
  // sort descending (warmest first)
  var sortedTemps = tasC_raw.sort().reverse();
  
  // 4th warmest month
  var fourthWarmest = ee.Number(sortedTemps.get(3));
  
  // how close it is to 10 °C
  var near_bc = fourthWarmest.subtract(10).abs().lt(EPS_TEMP);
  
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
  
  // ------------------------------------
  // Subtropical highland override
  // ------------------------------------
  
  var isHighland = elevation.gte(1500);
  
  // ONLY the climates you currently use
  var highlandEligible = ee.List([
    'Cfb',
    'Cfc',
    'Cwb',
    'Cwc'
  ]);
  
  // function → is this code eligible?
  function eligibleForHighland(code) {
    code = ee.String(code);
  
    return ee.Number(
      highlandEligible
        .map(function(x){ return ee.String(x).compareTo(code).eq(0); })
        .reduce(ee.Reducer.anyNonZero())
    ).eq(1);
  }
  
  // ---- main classification ----
  koppen = ee.String(
    ee.Algorithms.If(
      isHighland.and(eligibleForHighland(koppen)),
      koppen.cat('h'),
      koppen
    )
  );
  
  // ---- bordering classifications ----
  bordering = bordering.map(function(code) {
    code = ee.String(code);
  
    return ee.String(
      ee.Algorithms.If(
        isHighland.and(eligibleForHighland(code)),
        code.cat('h'),
        code
      )
    );
  });
  
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
  
  // ---- Base AI classes ----
  // ---- Aridity letter (AI-first hierarchy) ----

  // AI tiers
  var ai_d = aiAtPoint.lt(0.25);
  var ai_s = aiAtPoint.gte(0.25).and(aiAtPoint.lt(0.50));
  var ai_g = aiAtPoint.gte(0.50).and(aiAtPoint.lt(0.75));
  var ai_h = aiAtPoint.gte(0.75);
  
  // Mediterranean seasonality
  var isMed = HS.lt(0.4);
  
  // Monsoon seasonality
  var isMonsoon = P6ratio.gte(0.8).and(isMed.not());
  
  // AI-tiered aridity logic
  var aridityLetter = ee.String(
    ee.Algorithms.If(coldCond, '',
    ee.Algorithms.If(ai_d, 'd',
  
    ee.Algorithms.If(ai_s,
      ee.Algorithms.If(isMed, 'm',
      ee.Algorithms.If(isMonsoon, 'v', 's')),
  
    ee.Algorithms.If(ai_g,
      ee.Algorithms.If(isMed, 'm',
      ee.Algorithms.If(isMonsoon, 'w', 'g')),
  
    // ai_h
      ee.Algorithms.If(isMed, 'm',
      ee.Algorithms.If(isMonsoon, 'w', 'h'))
  
    ))))
  );
    
  // ---- Rainforest fix ----
  var P_driest = minPr;
  
  // aridityLetter == 'm'  (as 0/1)
  var isMedLetter = aridityLetter.compareTo('m').eq(0);
  
  // rainforestCancel = (aridityLetter == 'm') AND (P_driest >= PET/24)
  var rainforestCancel = isMedLetter.multiply(
    P_driest.gte(petAnnAtPoint.divide(24))
  ).eq(1);
  
  aridityLetter = ee.String(
    ee.Algorithms.If(rainforestCancel, 'h', aridityLetter)
  );
  
  // ---------- Final code ----------
  var dickinsonCode = coldLetter.cat(aridityLetter).cat(summerLetter);
  
  // ====================================
  // Dickinson bordering climates
  // ====================================
  
  // Bucket
  var dBordering = ee.List([]);
  
  // Tolerances
  var EPS_D_TEMP  = 0.5;   // °C near a temperature boundary
  var EPS_AI      = 0.01;  // AI near boundary
  var EPS_RATIO   = 0.02;  // HS or P6ratio near boundary
  var EPS_MM      = 5;     // mm for rainforest cancel boundary (P_driest vs PET/24)
  
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
    return ee.List([ ee.String(newCold).cat(aridityLetter).cat(summerLetter) ]);
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
    return ee.List([ coldLetter.cat(aridityLetter).cat(ee.String(newSummer)) ]);
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
  
  // ====================================
  // Dickinson bordering climates — ARIDITY
  // ====================================
  //
  // Aridity classes and their letter:
  //   1 = Arid/Desert  (d)  : AI < 0.25
  //   2 = Semiarid     (s)  : 0.25 ≤ AI < 0.50, not Med, not Monsoon
  //   3 = Mediterranean(m)  : AI ≥ 0.25, HS seasonal (overrides 2/5/6), unless rainforest-cancel
  //   4 = Monsoon      (w)  : AI ≥ 0.25, P6ratio ≥ 0.8, not Med (overrides 2/5/6)
  //   5 = Semihumid    (g)  : 0.50 ≤ AI < 0.75, not Med, not Monsoon
  //   6 = Humid        (h)  : AI ≥ 0.75, not Med, not Monsoon (or Med+rainforest-cancel)
  //   7 = Cold         ('')  : coldCond overrides all
  //   9 = Semiarid Monsoon(v): was Monsoon AND AI < 0.50
  
  // ── Helper: compute aridity letter from raw inputs ──────────────────────────
  // Mirrors the raster classification exactly.
  // Pass actual ee.Number values for each flag (0/1 or boolean).
  function computeAridityLetter(ai, isMedBool, isMonsoonBool, coldCondBool, pDriest, petAnn) {
  
    // Step 1: base AI tier
    var base = ee.String(
      ee.Algorithms.If(ai.lt(0.25), 'd',
      ee.Algorithms.If(ai.lt(0.50), 's',
      ee.Algorithms.If(ai.lt(0.75), 'g',
      'h')))
    );
  
    // Step 2: Mediterranean override (AI ≥ 0.25, not desert)
    // Med takes priority over Monsoon per the raster (.where ordering)
    base = ee.String(
      ee.Algorithms.If(
        isMedBool.and(ai.gte(0.25)),
        // rainforest-cancel: if driest month ≥ PET_annual/24, Med → Humid
        ee.Algorithms.If(
          pDriest.gte(petAnn.divide(24)),
          'h',   // rainforest cancel: Mediterranean → Humid
          'm'    // normal Mediterranean
        ),
        base
      )
    );
  
    // Step 3: Monsoon override (AI ≥ 0.25, not Med, not desert)
    base = ee.String(
      ee.Algorithms.If(
        isMonsoonBool.and(isMedBool.not()).and(ai.gte(0.25)),
        // Semiarid Monsoon (v) when AI < 0.50, else Monsoon (w)
        ee.Algorithms.If(ai.lt(0.50), 'v', 'w'),
        base
      )
    );
  
    // Step 4: Cold override (suppresses aridity letter entirely)
    return ee.String(ee.Algorithms.If(coldCondBool, '', base));
  }
  
  // ── Current values (already computed earlier in script) ─────────────────────
  // aiAtPoint, isMed, isMonsoon, coldCond, P_driest (= minPr), petAnnAtPoint
  // aridityLetter (current final letter, already computed)
  
  // ── Shorthand: build a full code string from a candidate aridity letter ──────
  function makeCode(candidateLetter) {
    return coldLetter.cat(candidateLetter).cat(summerLetter);
  }
  
  // ── Emit a border only when the candidate letter differs from current ─────────
  function borderIfDifferent(candidateLetter) {
    return ee.List(
      ee.Algorithms.If(
        candidateLetter.compareTo(aridityLetter).neq(0),
        [makeCode(candidateLetter)],
        []
      )
    );
  }
  
  var aridBorders = ee.List([]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 1 — AI = 0.25  (desert d ↔ semiarid s / v / m)
  // ─────────────────────────────────────────────────────────────────────────────
  var nearAI025 = aiAtPoint.subtract(0.25).abs().lt(EPS_AI);
  
  // Letter just below 0.25 (desert side)
  var letterBelow025 = computeAridityLetter(
    ee.Number(0.24), isMed, isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  // Letter just above 0.25 (semiarid side — Med/Monsoon can still apply)
  var letterAbove025 = computeAridityLetter(
    ee.Number(0.26), isMed, isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearAI025, [
      makeCode(letterBelow025),
      makeCode(letterAbove025)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 2 — AI = 0.50  (semiarid s/v ↔ semihumid g/w)
  // ─────────────────────────────────────────────────────────────────────────────
  var nearAI050 = aiAtPoint.subtract(0.50).abs().lt(EPS_AI);
  
  var letterBelow050 = computeAridityLetter(
    ee.Number(0.49), isMed, isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  var letterAbove050 = computeAridityLetter(
    ee.Number(0.51), isMed, isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearAI050, [
      makeCode(letterBelow050),
      makeCode(letterAbove050)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 3 — AI = 0.75  (semihumid g/w ↔ humid h)
  // ─────────────────────────────────────────────────────────────────────────────
  var nearAI075 = aiAtPoint.subtract(0.75).abs().lt(EPS_AI);
  
  var letterBelow075 = computeAridityLetter(
    ee.Number(0.74), isMed, isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  var letterAbove075 = computeAridityLetter(
    ee.Number(0.76), isMed, isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearAI075, [
      makeCode(letterBelow075),
      makeCode(letterAbove075)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 4 — Mediterranean seasonality threshold
  //   NH: HS < 0.4 → Med;  NH: HS ≥ 0.4 → not-Med
  //   SH: HS > 0.6 → Med;  SH: HS ≤ 0.6 → not-Med
  // Only relevant when AI ≥ 0.25 (not desert) and not coldCond
  // ─────────────────────────────────────────────────────────────────────────────
  var medThresh   = ee.Number(ee.Algorithms.If(isSouth, 0.6, 0.4));
  var nearHSMed   = HS.subtract(medThresh).abs().lt(EPS_RATIO)
                      .and(aiAtPoint.gte(0.25))
                      .and(coldCond.not());
  
  // Letter with Med flipped off
  var letterMedOff = computeAridityLetter(
    aiAtPoint, ee.Number(0), isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  // Letter with Med flipped on
  var letterMedOn  = computeAridityLetter(
    aiAtPoint, ee.Number(1), isMonsoon, coldCond, P_driest, petAnnAtPoint
  );
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearHSMed, [
      makeCode(letterMedOff),
      makeCode(letterMedOn)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 5 — Monsoon seasonality threshold  (P6ratio = 0.8)
  // Only relevant when AI ≥ 0.25, not Med, not coldCond
  // ─────────────────────────────────────────────────────────────────────────────
  var nearP6Monsoon = P6ratio.subtract(0.8).abs().lt(EPS_RATIO)
                        .and(aiAtPoint.gte(0.25))
                        .and(isMed.not())
                        .and(coldCond.not());
  
  // Letter with Monsoon flipped off
  var letterMonsoonOff = computeAridityLetter(
    aiAtPoint, isMed, ee.Number(0), coldCond, P_driest, petAnnAtPoint
  );
  // Letter with Monsoon flipped on
  var letterMonsoonOn  = computeAridityLetter(
    aiAtPoint, isMed, ee.Number(1), coldCond, P_driest, petAnnAtPoint
  );
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearP6Monsoon, [
      makeCode(letterMonsoonOff),
      makeCode(letterMonsoonOn)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 6 — Rainforest-cancel  (P_driest = PET_annual / 24)
  // Only fires when current class is Med (m or h from Med-cancel)
  // m ↔ h at the cancel threshold
  // ─────────────────────────────────────────────────────────────────────────────
  var inMedClass    = isMed.and(aiAtPoint.gte(0.25)).and(coldCond.not());
  var nearRainCancel = P_driest.subtract(petAnnAtPoint.divide(24)).abs().lt(EPS_MM)
                        .and(inMedClass);
  
  // Letter with cancel flipped off (P_driest just below threshold → m)
  var letterCancelOff = computeAridityLetter(
    aiAtPoint, isMed, isMonsoon, coldCond,
    petAnnAtPoint.divide(24).subtract(EPS_MM + 1),   // JS arithmetic, not .add()
    petAnnAtPoint
  );
  // Letter with cancel flipped on (P_driest just above threshold → h)
  var letterCancelOn  = computeAridityLetter(
    aiAtPoint, isMed, isMonsoon, coldCond,
    petAnnAtPoint.divide(24).add(EPS_MM + 1),         // JS arithmetic, not .add()
    petAnnAtPoint
  );
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearRainCancel, [
      makeCode(letterCancelOff),
      makeCode(letterCancelOn)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // BOUNDARY 7 — ColdCond toggle
  //   coldCond = warmestMonth < 15 OR coldestMonth < -20
  //   Near this boundary: '' ↔ active aridity letter
  // ─────────────────────────────────────────────────────────────────────────────
  var nearColdCondBoundary = warmestMonth.subtract(15).abs().lt(EPS_D_TEMP)
                               .or(coldestMonth.add(20).abs().lt(EPS_D_TEMP));
  
  // Letter with coldCond forced off (aridity active)
  var letterColdOff = computeAridityLetter(
    aiAtPoint, isMed, isMonsoon, ee.Number(0), P_driest, petAnnAtPoint
  );
  // Letter with coldCond forced on (aridity suppressed → '')
  var letterColdOn  = ee.String('');
  
  aridBorders = aridBorders.cat(
    ee.List(ee.Algorithms.If(nearColdCondBoundary, [
      makeCode(letterColdOff),
      makeCode(letterColdOn)
    ], []))
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Merge aridity borders into main dBordering, then finalize
  // ─────────────────────────────────────────────────────────────────────────────
  
  // (cold-letter and summer-letter borders already populated dBordering above)
  dBordering = dBordering.cat(aridBorders);
  
  // Deduplicate, remove current code, remove empty strings
  dBordering = dBordering.distinct();
  dBordering = dBordering.removeAll(ee.List([dickinsonCode]));
  dBordering = dBordering.filter(ee.Filter.neq('item', ''));
  
  var dickinsonBorderingStr = ee.String(
    ee.Algorithms.If(
      dBordering.length().gt(0),
      dBordering.join(' '),
      'none'
    )
  );
  
  // ====================================
  // Build rawLinesString from monthly data
  // ====================================
  var rawLinesString = combinedF
    .cat(combinedC)
    .join('\n');
  
  // ====================================
  // FORMAT METADATA AS JSON
  // ====================================

  var periodDict = ee.Dictionary({
  
    // classifications
    dickinson: dickinsonCode,
    dickinson_bordering: dickinsonBorderingStr,
    koppen: koppen,
    koppen_bordering: koppenBorderingStr,
  
    // AI / PET values
    p_pet: ee.Algorithms.If(
      petAnnAtPoint.gt(0),
      aiAtPoint.multiply(100).round().divide(100).format('%.2f'),
      'N/A'
    ),
  
    p_pet_unrounded: ee.Algorithms.If(
      petAnnAtPoint.gt(0),
      aiAtPoint.multiply(1000).round().divide(1000).format('%.3f'),
      'N/A'
    ),
  
    annual_pet_mm: ee.Algorithms.If(
      petAnnAtPoint.gt(0),
      petAnnAtPoint.round().format('%.0f'),
      'N/A'
    ),
  
    // monthly data
    rawLines: rawLinesString
  });
  
  // IMPORTANT: return to caller
  return periodDict;
}

// ====================================
// RUN ALL PERIODS → SINGLE JSON OUTPUT
// ====================================

CITIES.forEach(function(city) {

  var CITY_NAME = city.name;
  var LAT = city.lat;
  var LON = city.lon;
  var pt  = ee.Geometry.Point([LON, LAT]);
  
  // ====================================
  // Elevation at point (GLOBAL — same for all periods)
  // ====================================
  var elevImg = ee.Image('USGS/SRTMGL1_003').rename('elev');
  
  var rawElevation = elevImg.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 1000,
    maxPixels: 1e9
  }).get('elev');
  
  // null protection
  rawElevation = ee.Algorithms.If(rawElevation, rawElevation, -5000);
  rawElevation = ee.Number(rawElevation);
  
  // sanity range
  var elevation = ee.Number(
    ee.Algorithms.If(
      rawElevation.gte(-500).and(rawElevation.lte(9000)),
      rawElevation,
      -9999
    )
  );

  // --- build coordinate key ---
  var coordKey =
    ee.Number(LAT).format('%.4f')
      .cat(', ')
      .cat(ee.Number(LON).format('%.4f'));
  
  // --- build periods dictionary ---
  var periodsDict = ee.Dictionary(
    PERIODS.reduce(function(acc, p) {
      acc = ee.Dictionary(acc);
      return acc.set(p, runForPeriod(p, pt, LAT, elevation));
    }, ee.Dictionary({}))
  );
  
  // --- city object ---
  var cityDict = ee.Dictionary({
    city: CITY_NAME,
    periods: periodsDict
  });
  
  // --- final JSON ---
  var finalJson = ee.Dictionary()
    .set(coordKey, cityDict);
  
  finalJson.evaluate(function(result) {
    var key = Object.keys(result)[0];
  
    // build formatted body
    var body = JSON.stringify(result[key], null, 2)
      .split('\n')
      .slice(1, -1) // remove outer braces
      .map(function(line) {
        return '  ' + line;
      })
      .join('\n');
  
    // single clean print
    print(
      '  "' + key + '": {\n' +
      body + '\n' +
      '  },'
    );
  });
});