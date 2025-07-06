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

// — instead of MIN, take the MAX to get the hottest month —
var hottestHist = monthlyClim2000
  .reduce(ee.Reducer.max())
  .rename('hottestC');

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

// likewise, take MAX for the future hottest month
var hottest2100 = monthlyMean2100
  .reduce(ee.Reducer.max())
  .rename('hottestC');

// (4) Extrapolate to 2400: baseline + 4*(future – baseline)
var hottestC_global = hottest2100
  .add(25.5)
  .rename('hottestC_global');

// (5) Classification for hottest-month zones
function classifyHot(tC) {
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
    .rename('hotZone');
}

var hotZone = classifyHot(hottestC_global.select('hottestC_global'));

// (6) Display palette (unchanged)
var codeColorMap = {
  11: "#888888", // Boiling
  10: "#0000FF", // Hypercaneal
  9: "#000000", // X: Extreme Hyperthermal Summer
  8: "#550000", // Z2: Hyperthermal Summer
  7: "#990000", // Z1: Scorching Hot Summer
  6: "#FF0000", // A2: Very Hot Summer
  5: "#FFA500", // A1: Hot Summer
  4: "#FFFF00", // B2: Mild Summer
  3: "#008000", // B1: Cold Summer
  2: "#0000FF", // C2: Very Cold Summer
  1: "#FFC0CB", // C1: Freezing Summer
  0: "#000000"  // Y: Frigid Summer
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = hotZone
  .remap(codes, indices)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate zones (2200 projection)',
  true,
  0.7
);

// Debug: confirm collections
print('Hist2000 size:', hist2000.size());
print('Future2100 size:', future2100.size());
print('MonthlyMean2100 count:', monthlyMean2100.size());
