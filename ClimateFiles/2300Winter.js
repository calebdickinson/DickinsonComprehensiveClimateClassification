// (0) ERA5 baseline for reference (if you need it)
var era5 = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .filterDate('1995-01-01', '2005-12-31')
  .select('mean_2m_air_temperature')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tempC')
      .set('system:time_start', img.get('system:time_start'));
  });

// (1) Month indices
var months = ee.List.sequence(1, 12);

// (2) Historical 2000–2005 (explicit dates)
var hist2000 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'historical'))
  .filter(ee.Filter.eq('model',    'ACCESS1-0'))
  .filterDate('2000-01-01', '2005-12-31');

var tmaxDaily = hist2000.select('tasmax');
var tminDaily = hist2000.select('tasmin');

// Build monthly mean-of-(tmax+tmin)/2
var monthlyClim2000 = ee.ImageCollection(
  months.map(function(m) {
    m = ee.Number(m);
    var maxC = tmaxDaily
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .subtract(273.15);
    var minC = tminDaily
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .subtract(273.15);
    return ee.Image.cat([ maxC, minC ])
      .reduce(ee.Reducer.mean())
      .rename('tmeanC');
  })
);

// Coldest month baseline, single band 'coldestC'
var coldestHist = monthlyClim2000
  .reduce(ee.Reducer.min())
  .rename('coldestC');

// (3) Future “2100” rcp85 with explicit 2100 dates
var future2100 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.eq('model',    'ACCESS1-0'))
  .filterDate('2099-01-01', '2099-12-31');

var tmax2100 = future2100.select('tasmax');
var tmin2100 = future2100.select('tasmin');

var monthlyMean2100 = ee.ImageCollection(
  months.map(function(m) {
    m = ee.Number(m);
    var maxC = tmax2100
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .subtract(273.15);
    var minC = tmin2100
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .subtract(273.15);
    return ee.Image.cat([ maxC, minC ])
      .reduce(ee.Reducer.mean())
      .rename('tmeanC');
  })
);

var coldest2100 = monthlyMean2100
  .reduce(ee.Reducer.min())
  .rename('coldestC');

// (4) Extrapolate to 2300:
var coldestC_global = coldest2100
  .add(17)
  .rename('coldestC_global');

// (5) Classification
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

var coldZone = classifyCold(coldestC_global.select('coldestC_global'));

// (6) Display palette
var codeColorMap = {
  11: "#0000FF", // H: Hypercaneal
  10: "#888888", // X: Uninhabitable
  9: "#000000", // Z: Ultratropical
  8: "#C71585", // A: Supertropical
  7: "#FF0000", // B: Tropical
  6: "#FFA500", // C: Subtropical
  5: "#008800", // D: Temperate
  4: "#004400", // E: Continental
  3: "#0000FF", // F: Subarctic
  2: "#FFC0CB", // G: Arctic
  1: "#000000"  // Y: Superarctic
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
  'Climate zones (2200 projection)',
  true,
  0.7
);

// Debug: print counts to confirm collections aren’t empty
print('Hist2000 size:', hist2000.size());
print('Future2100 size:', future2100.size());
print('MonthlyMean2100 count:', monthlyMean2100.size());
