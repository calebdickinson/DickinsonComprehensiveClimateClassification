var era5 = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .filterDate('2000-01-01', '2005-12-31')
  .select('mean_2m_air_temperature')
  .map(function(img) {
    return img.subtract(273.15).rename('tempC')
              .set('system:time_start', img.get('system:time_start'));
  });

var months = ee.List.sequence(1, 12);

var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    var mImg = era5.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
    return mImg.set('month', m).rename('tempC');
  })
);

var hottestC_global = monthlyMeans.qualityMosaic('tempC')
                                  .select('tempC').rename('hottestC');

var coldestC_global = monthlyMeans
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('tempC')
  .multiply(-1)
  .select('tempC').rename('coldestC');

function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(45)),  9) // X1: Extreme Hyperthermal Summer
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

var codeColorMap = {
  8: "#C71585", // A: Supertropical
  7: "#FF0000", // A: Tropical
  6: "#FFA500", // B: Subtropical
  5: "#008800", // D: Temperate
  4: "#004400", // E: Continental
  3: "#0000FF", // F: Subarctic
  2: "#FFC0CB", // G: Arctic
  1: "#000000"  // Y: Superarctic
};

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = coldZone
  .remap(codes, indices, -1)
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
