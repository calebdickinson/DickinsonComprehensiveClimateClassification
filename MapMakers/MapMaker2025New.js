// ==========================================================
// 1) Inputs: CMIP6 primary, CMIP5 fallback (year 2025)
// ==========================================================

// --- CMIP6 (primary) ---
var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filter(ee.Filter.calendarRange(2025, 2025, 'year'));

// Daily mean 2m air temp (tas), K -> °C
var tasC6 = cmip6.select('tas').map(function(img){
  return img.subtract(273.15).rename('tasC')
            .copyProperties(img, ['system:time_start']);
});

// Precip (kg m-2 s-1) same units as CMIP5; we’ll month-sum via days later
var pr6 = cmip6.select('pr');

// --- CMIP5 (fallback) ---
var cmip5 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2025, 2025, 'year'));

var tasmax5 = cmip5.select('tasmax'); // K
var tasmin5 = cmip5.select('tasmin'); // K
// Build CMIP5 daily-mean proxy then °C
var tasC5 = ee.ImageCollection(
  tasmax5.combine(tasmin5).map(function(img){
    // match dates by using the two-band image collections directly when filtered by month
    // We'll compute monthly means below from tasmax/tasmin separately.
    return img; // placeholder, we compute monthly means from tasmax5/tasmin5
  })
);
var pr5 = cmip5.select('pr');

// ==========================================================
// 2) Monthly means (°C) for temperature: CMIP6.tas preferred,
//    fallback to CMIP5 (mean(tasmax,tasmin)) where CMIP6 missing
// ==========================================================
var months = ee.List.sequence(1, 12);

// Helper: monthly mean of CMIP6 tasC
function monthlyTasMean6(m){
  m = ee.Number(m);
  return tasC6.filter(ee.Filter.calendarRange(m, m, 'month'))
              .mean()
              .rename('tasC_month');
}

// Helper: monthly mean of CMIP5 (tasmax+tasmin)/2 in °C
function monthlyTasMean5(m){
  m = ee.Number(m);
  var maxM = tasmax5.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
  var minM = tasmin5.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
  // (K+K)/2 -> °C
  return maxM.add(minM).divide(2).subtract(273.15).rename('tasC_month');
}

// Build merged monthly °C (tasC6 preferred, else tasC5)
var monthlyTasMerged = ee.ImageCollection(
  months.map(function(m){
    var m6 = monthlyTasMean6(m);
    var m5 = monthlyTasMean5(m);
    var merged = m6.unmask(m5)                 // per-pixel fallback
                   .rename('monthlyMean')       // keep your original band name
                   .set('month', m);
    return merged;
  })
);

// ==========================================================
// 3) Hottest / coldest month rasters from the merged monthly means
// ==========================================================
var hottestC = monthlyTasMerged
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyTasMerged
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// ==========================================================
// 4) Monthly climatology for P, PET, and tmeanC using CMIP6→CMIP5 fallback
//     - Precip: month mean * days -> monthly total (mm equiv. if you prefer)
//     - tmeanC: same merged logic as above
//     - PET: Hargreaves-lite proxy from tmeanC (your original formula)
// ==========================================================
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

function monthlyPrMean6(m){ 
  return pr6.filter(ee.Filter.calendarRange(m, m, 'month')).mean().rename('pr');
}
function monthlyPrMean5(m){ 
  return pr5.filter(ee.Filter.calendarRange(m, m, 'month')).mean().rename('pr');
}

var monthlyClim = ee.ImageCollection(
  months.map(function(m){
    m = ee.Number(m);

    // precip mean (rate), fallback
    var prM6 = monthlyPrMean6(m);
    var prM5 = monthlyPrMean5(m);
    var prM  = prM6.unmask(prM5).rename('pr');

    // tmeanC (merged already defined as logic above)
    var tmeanC = monthlyTasMerged.filter(ee.Filter.eq('month', m)).first()
                                .select('monthlyMean')
                                .rename('tmeanC');

    // days in month
    var days  = ee.Number(daysList.get(m.subtract(1)));

    // monthly precip total (same units scaling as your prior approach)
    var rainM = prM.multiply(days).rename('pr');

    // PET proxy from tmeanC
    var es = tmeanC.expression('0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC});
    var Ra = ee.Image.constant(12 * 0.0820); // same as your constant
    var petM = es.multiply(Ra).multiply(0.1651).rename('pet');

    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

// ==========================================================
// 5) Aridity + seasonality classification (unchanged logic)
// ==========================================================
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

var aridBase = ee.Image(6) // H: Humid
  .where(AI.lt(0.0036), 5) // G: Semihumid
  .where(AI.lt(0.0024), 2) // S: Semiarid
  .where(AI.lt(0.0012), 1) // D: Arid Desert
  .rename('aridity');

var P_hs = monthlyClim
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3) // Mediterranean
  .rename('climateClass');

// ==========================================================
// 6) Your temp class functions (unchanged)
// ==========================================================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9)
    .where(tC.gte(35).and(tC.lt(40)),  8)
    .where(tC.gte(30).and(tC.lt(35)),  7)
    .where(tC.gte(25).and(tC.lt(30)),  6)
    .where(tC.gte(20).and(tC.lt(25)),  5)
    .where(tC.gte(15).and(tC.lt(20)),  4)
    .where(tC.gte(10).and(tC.lt(15)),  3)
    .where(tC.gte(5).and(tC.lt(10)),   2)
    .where(tC.gte(0).and(tC.lt(5)),    1)
    .where(tC.lt(0),                   0);
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9)
    .where(tC.gte(20).and(tC.lt(30)),   8)
    .where(tC.gte(10).and(tC.lt(20)),   7)
    .where(tC.gte(0).and(tC.lt(10)),    6)
    .where(tC.gte(-10).and(tC.lt(0)),   5)
    .where(tC.gte(-20).and(tC.lt(-10)), 4)
    .where(tC.gte(-30).and(tC.lt(-20)), 3)
    .where(tC.gte(-40).and(tC.lt(-30)), 2)
    .where(tC.lt(-40),                  1);
}

// ==========================================================
// 7) Combine classes
// ==========================================================
var summerClass = classifySummer(hottestC);
var coldClass   = classifyCold(coldestC);

var combined = coldClass
  .multiply(100)
  .add(clim.multiply(10))
  .add(summerClass)
  .rename('combined');

// ==========================================================
// 8) Display (fixed the variable name; using 'discrete' below)
// ==========================================================
var codeColorMap = {
  617: "#ff0000",
  627: "#ff8800",
  637: "#ffff00",
  647: "#ff00ff",
  657: "#00ff00",
  667: "#008800",
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discrete,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (CMIP6 w/ CMIP5 fallback)',
  true, 0.7
);
