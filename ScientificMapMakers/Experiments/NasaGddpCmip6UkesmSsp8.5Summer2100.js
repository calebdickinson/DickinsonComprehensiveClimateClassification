// 2100 Summer Map — UKESM1-0-LL (NEX-GDDP-CMIP6)

var months = ee.List.sequence(1, 12);

// Helpers to build monthly means (K → °C)
function monthlyFromTas(ic) {
  var tasC = ic.select('tas').map(function(img){
    return img.subtract(273.15).rename('tasC')
              .copyProperties(img, ['system:time_start']);
  });
  return ee.ImageCollection(months.map(function(m){
    return tasC.filter(ee.Filter.calendarRange(m, m, 'month'))
               .mean().rename('monthlyMean').set('month', m);
  }));
}

function monthlyFromPair(ic) {
  var tmaxC = ic.select('tasmax').map(function(img){
    return img.subtract(273.15).rename('tasmaxC')
              .copyProperties(img, ['system:time_start']);
  });
  var tminC = ic.select('tasmin').map(function(img){
    return img.subtract(273.15).rename('tasminC')
              .copyProperties(img, ['system:time_start']);
  });
  return ee.ImageCollection(months.map(function(m){
    var maxMean = tmaxC.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
    var minMean = tminC.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
    return maxMean.add(minMean).divide(2)
                  .rename('monthlyMean').set('month', m);
  }));
}

function icHasBand(ic, bandName){
  var flagged = ic.map(function(img){
    return img.set('hasBand', img.bandNames().contains(bandName));
  });
  return flagged.filter(ee.Filter.eq('hasBand', true)).size().gt(0);
}

function hottestFromMonthly(monthlyIC){
  return monthlyIC.qualityMosaic('monthlyMean')
                  .select('monthlyMean').rename('hottestC');
}

// --- DATA: restrict to SSP585, UKESM1-0-LL, year 2100
var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filter(ee.Filter.eq('model', 'UKESM1-0-LL'))
  .filterDate('2100-01-01', '2101-01-01');

// Build monthly means using tas if available; else (tasmax+tasmin)/2
var monthly6 = ee.ImageCollection(
  ee.Algorithms.If(icHasBand(cmip6, 'tas'),
                   monthlyFromTas(cmip6),
                   monthlyFromPair(cmip6))
);

var hottest6 = hottestFromMonthly(monthly6);

// --- Classification (summer / hottest-month °C)
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

// Palette & render
var codeColorMap = {
  10:"#0000FF", // Hypercaneal
  9:"#000000",  // X1
  8:"#550000",  // Z2
  7:"#C71585",  // Z1
  6:"#FF0000",  // A2
  5:"#FFA500",  // A1
  4:"#FFFF00",  // B2
  3:"#008000",  // B1
  2:"#0000FF",  // C2
  1:"#FF10F0",  // C1
  0:"#000000"   // Y
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = warmZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discrete,
  {min:0, max:indices.length-1, palette:palette},
  'Climate (hottest month) — UKESM1-0-LL SSP585 2100',
  true, 0.7
);
// Map.setCenter(0, 20, 2);
