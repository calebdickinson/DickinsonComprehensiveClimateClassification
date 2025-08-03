// a) NASA/NEX-GDDP for warm/cold
var future = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2100, 2100, 'year'));

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
var hottestC_future = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

// Coldest‐month: invert, mosaic, then invert back
var coldestC_future = monthlyMeans
  .map(function(img) {
    return img.multiply(-1).copyProperties(img);
  })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// b) NEX-GDDP for aridity
var future2100 = ee.ImageCollection('NASA/NEX-GDDP')
    .filter(ee.Filter.eq('scenario','rcp85'))
    .filter(ee.Filter.calendarRange(2100,2100,'year'));
var prDaily   = future2100.select('pr');
var tmaxDaily = future2100.select('tasmax');
var tminDaily = future2100.select('tasmin');
var months   = ee.List.sequence(1,12);
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim2100 = ee.ImageCollection(
  months.map(function(m) {
    m = ee.Number(m);
    var prM   = prDaily  .filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var tmaxM = tmaxDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var tminM = tminDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var days  = ee.Number(daysList.get(m.subtract(1)));
    var rainM = prM.multiply(days).rename('pr');
    var tmeanC = tmaxM.add(tminM)
                      .divide(2)
                      .subtract(273.15)
                      .rename('tmeanC');
    var es   = tmeanC.expression(
      '0.6108 * exp(17.27 * T / (T + 237.3))',
      {T: tmeanC}
    );
    var Ra   = ee.Image.constant(12 * 0.0820);
    var petM = es.multiply(Ra)
                 .multiply(0.1651)
                 .rename('pet');
    return rainM
      .addBands(petM)
      .addBands(tmeanC)
      .set('month', m);
  })
);

var P_ann2100    = monthlyClim2100.select('pr' ).sum().rename('P_ann'),
    PET_ann2100  = monthlyClim2100.select('pet').sum().rename('PET_ann'),
    AI2100       = P_ann2100.divide(PET_ann2100).rename('AI'),
    aridBase     = ee.Image(6)
                     .where(AI2100.lt(0.0036),5)
                     .where(AI2100.lt(0.0024), 2)
                     .where(AI2100.lt(0.0012), 1)
                     .rename('aridity'),
    P_hs2100     = monthlyClim2100
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2100       = P_hs2100.divide(P_ann2100).rename('HS_ratio'),
    clim2100     = aridBase
                     .where(aridBase.neq(0).and(HS2100.gte(0.8)),4)
                     .where(aridBase.neq(0).and(HS2100.lt(0.4)),3)
                     .rename('climateClass'),
    clim2100_flip= clim2100
                     .where(ee.Image.pixelLonLat().select('latitude').lt(3).and(clim2100.eq(4)),3)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(4).and(clim2100.eq(3)),4);


function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9) // X: Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8) // Z2: Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7) // Z1: Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6) // A2: Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5) // A1: Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4) // B2: Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3) // B1: Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2) // C2: Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1) // C1: Freezing Summer
    .where(tC.lt(0),                   0) // Y: Frigid Summer
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9) // Z: Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),   8) // A: Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2) // G: Arctic
    .where(tC.lt(-40),                  1) // Y: Superarctic
}

// classify highest‐month temps
var summerClass = classifySummer(hottestC_future);

// classify lowest‐month temps
var coldClass   = classifyCold(coldestC_future);

// combine
var combined = coldClass
  .multiply(100)                
  .add(clim2100_flip.multiply(10))
  .add(summerClass)    
  .rename('combined');
  
var codeColorMap = {
  617: "#ff0000",
  627: "#ff8800",
  637: "#ffff00",
  647: "#ff00ff",
  657: "#00ff00",
  667: "#008800",
};

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = combined
  .remap(codes, indices)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    palette: palette
  },
  'Climate',
  true,   // show layer
  0.7     // 70% opacity
);
