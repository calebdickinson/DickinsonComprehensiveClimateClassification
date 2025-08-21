// ==== ERA5 monthly climatology (global: land + ocean) ====
// Source: ECMWF/ERA5/MONTHLY
// Band: mean_2m_air_temperature (Kelvin)

// --- Config: climatology window 
var start = '1991-01-01';
var end   = '2021-01-01';  // end exclusive

// 1) Load ERA5 monthly images (global)
var ERA = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .filterDate(start, end);

// 2) Build a 12-image collection (one per month) using 2m temp (°C)
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function (m) {
    // Mean of the m-th month across all years in the window
    return ERA
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .select('mean_2m_air_temperature') // Kelvin
      .subtract(273.15)                  // -> °C
      .rename('monthlyMean')
      .set('month', m);
  })
);

// 3) Hottest & coldest month rasters from climatology
var hottestC = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyMeans
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// 4) Your classification
function classifySummer(tC) {
  var out = ee.Image(0).updateMask(tC.mask());
  out = out.where(tC.gte(50), 10)  // H
           .where(tC.gte(40).and(tC.lt(50)),  9)   // X
           .where(tC.gte(35).and(tC.lt(40)),  8)   // Z2
           .where(tC.gte(30).and(tC.lt(35)),  7)   // Z1
           .where(tC.gte(25).and(tC.lt(30)),  6)   // A2
           .where(tC.gte(20).and(tC.lt(25)),  5)   // A1
           .where(tC.gte(15).and(tC.lt(20)),  4)   // B2
           .where(tC.gte(10).and(tC.lt(15)),  3)   // B1
           .where(tC.gte(5).and(tC.lt(10)),   2)   // C2
           .where(tC.gte(0).and(tC.lt(5)),    1)   // C1
           .where(tC.lt(0),                   0);  // Y
  return out.rename('warmZone');
}
var warmZone = classifySummer(hottestC);

// 5) Color map & display 
var codeColorMap = {
  11:"#888888",10:"#0000FF",9:"#000000",8:"#550000",
  7:"#C71585",6:"#FF0000",5:"#FFA500",4:"#FFFF00",
  3:"#008000",2:"#0000FF",1:"#FFC0CB",0:"#000000"
};
// Sort keys numerically for stable remap order
var keys = Object.keys(codeColorMap).map(function(k){ return parseInt(k, 10); })
  .sort(function(a,b){ return a - b; });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = keys.map(function(_, i){ return i; });

// Map class codes to 0..N-1 for discrete visualization
var discreteGlobal = warmZone.remap(keys, indices).rename('classIndex');

// Display
Map.addLayer(
  discreteGlobal,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (ERA5 1991–2020, land + ocean)',
  true, 0.7
);

