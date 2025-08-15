// ==== WorldClim V1 monthly climatology (global) ====
// Source: WORLDCLIM/V1/MONTHLY (bands: tavg, tmin, tmax, prec; month property)
// Temperatures must be multiplied by 0.1 to get °C.  (EE catalog docs)

// 1) Load WorldClim monthly images (global)
var WC = ee.ImageCollection('WORLDCLIM/V1/MONTHLY');

// 2) Build a 12-image collection (one per month) using tavg (°C)
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function (m) {
    var im = WC.filter(ee.Filter.eq('month', m)).first();
    // Each image has band 'tavg' at scale 0.1 °C
    return ee.Image(im).select('tavg').multiply(0.1)
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

// 4) Your classification (unchanged thresholds; now mask-aware)
function classifySummer(tC) {
  // Start with a 0 image but keep only pixels where tC is valid
  var out = ee.Image(0).updateMask(tC.mask());

  // Apply your bins
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
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = warmZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (WorldClim normals)',
  true, 0.7
);
