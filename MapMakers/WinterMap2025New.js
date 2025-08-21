// 2025 Winter Map

var months = ee.List.sequence(1, 12);

function monthlyFromTas(ic) {
  var tasC = ic.select('tas').map(function (img) {
    return img.subtract(273.15).rename('tasC')
              .copyProperties(img, ['system:time_start']);
  });
  return ee.ImageCollection(
    months.map(function (m) {
      return tasC.filter(ee.Filter.calendarRange(m, m, 'month'))
                 .mean()
                 .rename('monthlyMean')
                 .set('month', m);
    })
  );
}

function monthlyFromPair(ic) {
  var tmaxC = ic.select('tasmax').map(function (img) {
    return img.subtract(273.15).rename('tasmaxC')
              .copyProperties(img, ['system:time_start']);
  });
  var tminC = ic.select('tasmin').map(function (img) {
    return img.subtract(273.15).rename('tasminC')
              .copyProperties(img, ['system:time_start']);
  });
  return ee.ImageCollection(
    months.map(function (m) {
      var maxMean = tmaxC.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
      var minMean = tminC.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
      return maxMean.add(minMean).divide(2)
                    .rename('monthlyMean')
                    .set('month', m);
    })
  );
}

function icHasBand(ic, bandName) {
  var flagged = ic.map(function (img) {
    return img.set('hasBand', img.bandNames().contains(bandName));
  });
  return flagged.filter(ee.Filter.eq('hasBand', true)).size().gt(0);
}

function hottestFromMonthly(monthlyIC) {
  return monthlyIC.qualityMosaic('monthlyMean')
                  .select('monthlyMean').rename('hottestC');
}
function coldestFromMonthly(monthlyIC) {
  return monthlyIC.map(function (img) { return img.multiply(-1).copyProperties(img); })
                  .qualityMosaic('monthlyMean')
                  .multiply(-1)
                  .select('monthlyMean').rename('coldestC');
}

var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filterDate('2025-01-01', '2026-01-01');

var monthly6 = ee.ImageCollection(
  ee.Algorithms.If(
    icHasBand(cmip6, 'tas'),
    monthlyFromTas(cmip6)
  )
);

var hottestC = hottestFromMonthly(monthly6);
var coldestC = coldestFromMonthly(monthly6);

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(50).and(tC.lt(60)),   11) // H: Hypercaneal
    .where(tC.gte(40).and(tC.lt(50)),   10) // X: Uninhabitable
    .where(tC.gte(30).and(tC.lt(40)),    9) // Z: Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),    8) // A: Supertropical
    .where(tC.gte(10).and(tC.lt(20)),    7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),     6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),    5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)),  4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)),  3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)),  2) // G: Arctic
    .where(tC.lt(-40),                   1) // Y: Superarctic
    .rename('coldZone');
}

var coldZone = classifyCold(coldestC);

var codeColorMap = {
  11: "#0000FF", // H: Hypercaneal
  10: "#0000FF", // X: Uninhabitable
  9:  "#000000", // Z: Ultratropical
  8:  "#C71585", // A: Supertropical
  7:  "#FF0000", // B: Tropical
  6:  "#FFA500", // C: Subtropical
  5:  "#008800", // D: Temperate
  4:  "#004400", // E: Continental
  3:  "#0000FF", // F: Subarctic
  2:  "#FF10F0", // G: Arctic
  1:  "#000000"  // Y: Superarctic
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = coldZone
  .remap(codes, indices)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (coldest month)',
  true, 0.7
);
