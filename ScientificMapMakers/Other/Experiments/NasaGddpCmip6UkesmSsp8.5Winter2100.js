// 2100 Winter Map — UKESM1-0-LL (NEX-GDDP-CMIP6)

var months = ee.List.sequence(1, 12);

// Build monthly means from tas (K → °C)
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

// Build monthly means from (tasmax + tasmin)/2 (K → °C)
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

// Utility: does the collection contain a given band?
function icHasBand(ic, bandName) {
  var flagged = ic.map(function (img) {
    return img.set('hasBand', img.bandNames().contains(bandName));
  });
  return flagged.filter(ee.Filter.eq('hasBand', true)).size().gt(0);
}

// Pick hottest/coldest month from a monthly mean IC
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

// --- DATA: NEX-GDDP-CMIP6 restricted to UKESM1-0-LL & SSP585 in calendar year 2100
var gddp = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filter(ee.Filter.eq('model', 'UKESM1-0-LL'))
  .filterDate('2100-01-01', '2101-01-01');

// Build monthly means using tas if present, otherwise (tasmax+tasmin)/2
var monthly6 = ee.ImageCollection(
  ee.Algorithms.If(
    icHasBand(gddp, 'tas'),
    monthlyFromTas(gddp),
    monthlyFromPair(gddp)
  )
);

var hottestC = hottestFromMonthly(monthly6);
var coldestC = coldestFromMonthly(monthly6);

// Classification by coldest-month mean temperature (°C)
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

// Palette
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

var discreteLand = coldZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (coldest month) — UKESM1-0-LL SSP585 2100',
  true, 0.7
);

// Optional: center somewhere
// Map.setCenter(0, 20, 2);
