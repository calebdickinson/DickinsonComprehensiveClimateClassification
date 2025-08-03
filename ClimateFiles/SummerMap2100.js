// a) NASA/NEX-GDDP for warm/cold
var future = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2099, 2100, 'year'));

// Convert tasmax and tasmin from Kelvin to Celsius
var tasmax = future.select('tasmax')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasmaxC')
      .copyProperties(img, ['system:time_start']);
  });
var tasmin = future.select('tasmin')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasminC')
      .copyProperties(img, ['system:time_start']);
  });

// Build monthly means by averaging tasmax/tasmin
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    var maxMean = tasmax
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    var minMean = tasmin
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    // daily‐mean → monthly‐mean
    return maxMean.add(minMean)
                  .divide(2)
                  .rename('monthlyMean')
                  .set('month', m);
  })
);

// Extract hottest-month and coldest-month rasters

// Hottest‐month: pick the image with the highest monthlyMean at each pixel
var hottestC_global = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

// Coldest‐month: invert, mosaic, then invert back
var coldestC_global = monthlyMeans
  .map(function(img) {
    return img.multiply(-1).copyProperties(img);
  })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

var hist2000 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'historical'))
  .filter(ee.Filter.eq('model', 'ACCESS1-0'))
  .filter(ee.Filter.calendarRange(2000, 2005, 'year'));

var prDaily   = hist2000.select('pr'),
    tmaxDaily = hist2000.select('tasmax'),
    tminDaily = hist2000.select('tasmin'),
    daysList  = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim2000 = ee.ImageCollection(
  months.map(function(m){
    m = ee.Number(m);
    var prM   = prDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        tmaxM = tmaxDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        tminM = tminDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        days  = ee.Number(daysList.get(m.subtract(1))),
        rainM = prM.multiply(days).rename('pr'),
        tmeanC= tmaxM.add(tminM).divide(2).subtract(273.15).rename('tmeanC'),
        es    = tmeanC.expression(
                  '0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC}
                ),
        Ra    = ee.Image.constant(12 * 0.0820),
        petM  = es.multiply(Ra).multiply(0.1651).rename('pet');
    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

var P_ann2000    = monthlyClim2000.select('pr' ).sum().rename('P_ann'),
    PET_ann2000  = monthlyClim2000.select('pet').sum().rename('PET_ann'),
    AI2000       = P_ann2000.divide(PET_ann2000).rename('AI'),
    aridBase     = ee.Image(6) // H: Humid
                     .where(AI2000.lt(0.0036),5) // G: Semihumid
                     .where(AI2000.lt(0.0024),2) // S: Semiarid
                     .where(AI2000.lt(0.0012),1) // D: Arid Desert
                     .rename('aridity'),
    P_hs2000     = monthlyClim2000
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2000       = P_hs2000.divide(P_ann2000).rename('HS_ratio'),
    clim2000     = aridBase
                     .where(aridBase.neq(1).and(HS2000.gte(0.8)), 4) // W: Monsoon
                     .where(aridBase.neq(1).and(HS2000.lt(0.4)), 3) // M: Mediterranean
                     .rename('climateClass'),
    clim2000_flip= clim2000
                     .where(ee.Image.pixelLonLat().select('latitude').lt(5).and(clim2000.eq(4)), 3)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(5).and(clim2000.eq(3)), 4)
                     .where(hottestC_global.lt(15).or(coldestC_global.lt(-20)),7); // no aridity

function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(100).and(tC.lt(150)),  11) // Boiling
    .where(tC.gte(50).and(tC.lt(100)),  10) // Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),  9) // X1: Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8) // Z2: Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7) // Z1: Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6) // A2: Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5) // A1: Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4) // B2: Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3) // B1: Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2) // C2: Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1) // C1: Freezing Summer
    .where(tC.lt(0),                   0) // Y: Frigid Summer
    .rename('warmZone');
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(50).and(tC.lt(60)),   11) // H: Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   10) // X: Uninhabitable
    .where(tC.gte(30).and(tC.lt(40)),   9) // Z: Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),   8) // A: Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2) // G: Arctic
    .where(tC.lt(-40),                  1) // Y: Superarctic
    .rename('coldZone');
}

var warmZone = classifySummer(hottestC_global);
var coldZone = classifyCold(coldestC_global);

var landMask = ee.Image('NOAA/NGDC/ETOPO1')
  .select('bedrock')
  .gte(0);  // ≥0 m = land (includes ice & lakes)

var codeColorMap = {
  11: "#888888", // Boiling
  10: "#0000FF", // Hypercaneal
  9: "#000000", // X: Extreme Hyperthermal Summer
  8: "#550000", // Z2: Hyperthermal Summer
  7: "#C71585", // Z1: Scorching Hot Summer
  6: "#FF0000", // A2: Very Hot Summer
  5: "#FFA500", // A1: Hot Summer
  4: "#FFFF00", // B2: Mild Summer
  3: "#008000", // B1: Cold Summer
  2: "#0000FF", // C2: Very Cold Summer
  1: "#FFC0CB", // C1: Freezing Summer
  0: "#000000"  // Y: Frigid Summer
};

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = warmZone
  .remap(codes, indices)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    min:     0,
    max:     indices.length - 1,
    palette: palette
  },
  'Climate',
  true,   // show layer
  0.7     // 70% opacity
);
