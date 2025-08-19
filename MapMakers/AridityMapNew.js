// ==== WorldClim v1 monthly (WORLDCLIM/V1/MONTHLY) ====

var WC = ee.ImageCollection('WORLDCLIM/V1/MONTHLY');

// Build monthly mean temperatures from (tmax + tmin) / 2 (°C)
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function (m) {
    var im = WC.filter(ee.Filter.eq('month', m)).first();
    var tmaxC = ee.Image(im).select('tmax').multiply(0.1);
    var tminC = ee.Image(im).select('tmin').multiply(0.1);
    var tmeanC = tmaxC.add(tminC).divide(2).rename('monthlyMean');
    return tmeanC.set('month', m);
  })
);

// Extract hottest-month and coldest-month rasters
var hottestC_global = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC_global = monthlyMeans
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim = ee.ImageCollection(
  months.map(function (m) {
    m = ee.Number(m);
    var im = WC.filter(ee.Filter.eq('month', m)).first();

    // WorldClim monthly precip in mm.
    var prMonth = ee.Image(im).select('prec'); // mm per month
    var rainM = prMonth.divide(86400).rename('pr');

    // Monthly mean temperature (°C) from (tmax + tmin)/2
    var tmaxC = ee.Image(im).select('tmax').multiply(0.1);
    var tminC = ee.Image(im).select('tmin').multiply(0.1);
    var tmeanC = tmaxC.add(tminC).divide(2).rename('tmeanC');

    // PET
    var es = tmeanC.expression(
      '0.6108 * exp(17.27 * T / (T + 237.3))', { T: tmeanC }
    );
    var Ra = ee.Image.constant(12 * 0.0820); // same constant you used
    var petM = es.multiply(Ra).multiply(0.1651).rename('pet');

    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

// Latitude masks
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic   = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

// Annual sums / ratios
var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

// Base aridity classes
var aridBase = ee.Image(6) // H: Humid
  .where(AI.lt(0.0036), 5) // G: Semihumid
  .where(AI.lt(0.0024), 2) // S: Semiarid
  .where(AI.lt(0.0012), 1) // D: Arid Desert
  .rename('aridity');

// High-sun precipitation fraction
var P_hs = monthlyClim
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .select('pr')
  .sum()
  .rename('P_highSun');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

// Final class map
// Make a land mask from WorldClim data
var landMask = WC.first().select('tavg').mask().gt(0);

// Apply the mask to all final outputs
var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4)
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3)
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4)
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4)
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4)
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3)
  .where(hottestC_global.lt(15).or(coldestC_global.lt(-20)), 7)
  .updateMask(landMask)   // 👈 mask out oceans
  .rename('climateClass');

// Color map (same)
var codeColorMap = {
  1: "#FF0000", // D: Arid Desert
  2: "#FFA500", // S: Semiarid
  3: "#FFFF00", // M: Mediterranean
  4: "#FF00FF", // W: Monsoon
  5: "#00FF00", // G: Semihumid
  6: "#006600", // H: Humid
  7: "#0000FF"  // no aridity
};

// Parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// Discrete remap & display
var discreteLand = clim
  .remap(codes, indices, -1)  // any code not in codes → -1 (transparent)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    min:     0,
    max:     indices.length - 1,
    palette: palette
  },
  'Climate (WorldClim v1, discrete)',
  true,
  0.7
);
