// 2100 Summer Map

var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filterDate('2100-01-01', '2101-01-01');

var tasC6 = cmip6.select('tas').map(function(img) {
  return img.subtract(273.15).rename('tasC')
            .copyProperties(img, ['system:time_start']);
});

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

var hottest6 = monthly6.qualityMosaic('monthlyMean')
  .select('monthlyMean').rename('hottestC');

var coldest6 = monthly6
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean').rename('coldestC');

function classifySummer(tC) {
  var classified = ee.Image(0)
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
  
  return classified.updateMask(tC.mask());
}

var warmZone = classifySummer(hottest6);

var codeColorMap = {
  10:"#0000FF", // Hypercaneal
  9:"#000000",  // X1: Extreme Hyperthermal Summer
  8:"#550000",  // Z2: Hyperthermal Summer
  7:"#C71585",  // Z1: Scorching Hot Summer
  6:"#FF0000",  // A2: Very Hot Summer 
  5:"#FFA500",  // A1: Hot Summer
  4:"#FFFF00",  // B2: Mild Summer
  3:"#008000",  // B1: Cold Summer
  2:"#0000FF",  // C2: Very Cold Summer
  1:"#FF10F0",  // C1: Freezing Summer
  0:"#000000"   // Y: Frigid Summer
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = warmZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discrete,
  {min:0, max:indices.length-1, palette:palette},
  'Climate (CMIP6 ssp585 only)',
  true, 0.7
);
