// ------------------------------
// PRIMARY: GDDP-CMIP6 (SSP5-8.5)
// ------------------------------
var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filterDate('2025-01-01', '2026-01-01');

// Daily mean 2 m air temp (tas), K -> °C
var tasC6 = cmip6.select('tas').map(function(img) {
  return img.subtract(273.15).rename('tasC')
            .copyProperties(img, ['system:time_start']);
});

// Monthly means (°C)
var months = ee.List.sequence(1, 12);
var monthly6 = ee.ImageCollection(
  months.map(function(m) {
    return tasC6
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .rename('monthlyMean')
      .set('month', m);
  })
);

// Hottest/coldest month from CMIP6
var hottest6 = monthly6.qualityMosaic('monthlyMean')
  .select('monthlyMean').rename('hottestC');

var coldest6 = monthly6
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean').rename('coldestC');


// -------------------------------------
// FALLBACK: NEX-GDDP (CMIP5, RCP8.5)
// used where CMIP6 is masked
// -------------------------------------
var cmip5 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2025, 2025, 'year')); // 2099–2100

// Use (tasmax + tasmin)/2 as daily mean (K -> °C)
var tasC5 = cmip5.map(function(img) {
  var tmeanK = img.select('tasmax').add(img.select('tasmin')).multiply(0.5);
  return tmeanK.subtract(273.15).rename('tasC')
               .copyProperties(img, ['system:time_start']);
});

// Monthly means (°C)
var monthly5 = ee.ImageCollection(
  months.map(function(m) {
    return tasC5
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .rename('monthlyMean')
      .set('month', m);
  })
);

// Hottest/coldest month from NEX-GDDP
var hottest5 = monthly5.qualityMosaic('monthlyMean')
  .select('monthlyMean').rename('hottestC_fb');

var coldest5 = monthly5
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean').rename('coldestC_fb');


// -------------------------------------
// BLEND: use CMIP6, fallback to NEX-GDDP
// wherever CMIP6 is masked
// -------------------------------------
var hottestC_global = hottest6.unmask(hottest5);
var coldestC_global = coldest6.unmask(coldest5);

function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(100).and(tC.lt(150)), 11) // Boiling
    .where(tC.gte(50).and(tC.lt(100)), 10)  // Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   9)  // X1: Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),   8)  // Z2: Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),   7)  // Z1: Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),   6)  // A2: Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),   5)  // A1: Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),   4)  // B2: Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),   3)  // B1: Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),    2)  // C2: Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),     1)  // C1: Freezing Summer
    .where(tC.lt(0),                    0)  // Y: Frigid Summer
    .rename('warmZone');
}

var warmZone = classifySummer(hottestC_global);

// Palette & display (unchanged)
var codeColorMap = {
  11:"#888888", 10:"#0000FF", 9:"#000000", 8:"#550000", 7:"#C71585",
   6:"#FF0000",  5:"#FFA500", 4:"#FFFF00", 3:"#008000", 2:"#0000FF",
   1:"#FFC0CB",  0:"#000000"
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = warmZone.remap(codes, indices).rename('classIndex');

Map.setCenter(0, 20, 2);
Map.addLayer(
  discrete,
  {min:0, max:indices.length-1, palette:palette},
  'Climate (CMIP6 ssp585 with NEX-GDDP rcp85 fallback)',
  true, 0.7
);
