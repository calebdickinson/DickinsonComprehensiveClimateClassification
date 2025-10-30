// ---- Source: WorldClim v1 monthly ----
var WC = ee.ImageCollection('WORLDCLIM/V1/MONTHLY');

// Months helper
var months = ee.List.sequence(1, 12);

// ---- Monthly mean temperature (°C) from (tmax+tmin)/2 ----
var monthlyMeans = ee.ImageCollection(
  months.map(function (m) {
    var im = WC.filter(ee.Filter.eq('month', m)).first();
    var tmaxC = ee.Image(im).select('tmax').multiply(0.1);
    var tminC = ee.Image(im).select('tmin').multiply(0.1);
    var tmeanC = tmaxC.add(tminC).divide(2).rename('monthlyMean');
    return tmeanC.set('month', m);
  })
);

// ---- Hottest & coldest (°C) ----
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

// ---- Monthly climate stack (P rate, PET, tmeanC) ----
var monthlyClim = ee.ImageCollection(
  months.map(function (m) {
    m = ee.Number(m);
    var im = WC.filter(ee.Filter.eq('month', m)).first();

    // Precip: WorldClim monthly precip in mm → divide by 86400
    var prMonth = ee.Image(im).select('prec'); // mm per month
    var rainM = prMonth.divide(86400).rename('pr');

    // Monthly mean temperature (°C) from (tmax + tmin)/2
    var tmaxC = ee.Image(im).select('tmax').multiply(0.1);
    var tminC = ee.Image(im).select('tmin').multiply(0.1);
    var tmeanC = tmaxC.add(tminC).divide(2).rename('tmeanC');

    // PET proxy
    var es = tmeanC.expression(
      '0.6108 * exp(17.27 * T / (T + 237.3))', { T: tmeanC }
    );
    var Ra = ee.Image.constant(12 * 0.0820);
    var petM = es.multiply(Ra).multiply(0.1651).rename('pet');

    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

// ---- Latitude masks (same as yours) ----
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

// ---- Annual sums / ratios ----
var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

// ---- Base aridity classes ----
var aridBase = ee.Image(6) // H: Humid
  .where(AI.lt(0.0036), 5) // G: Semihumid
  .where(AI.lt(0.0024), 2) // S: Semiarid
  .where(AI.lt(0.0012), 1) // D: Arid Desert
  .rename('aridity');

// ---- High-sun precipitation fraction (Apr–Sep) ----
var P_hs = monthlyClim
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3) // Mediterranean
  .rename('climateClass');

// ===========================
// Temperature class functions 
// ===========================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9)  // Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8)  // Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7)  // Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6)  // Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5)  // Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4)  // Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3)  // Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2)  // Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1)  // Freezing Summer
    .where(tC.lt(0),                   0); // Frigid Summer
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9)  // Ultratropical
    .where(tC.gte(20).and(tC.lt(30)),   8)  // Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7)  // Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6)  // Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5)  // Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4)  // Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3)  // Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2)  // Arctic
    .where(tC.lt(-40),                  1); // Superarctic
}

// =======================================
// Combine: cold*100 + climate*10 + summer
// =======================================
var summerClass = classifySummer(hottestC);
var coldClass   = classifyCold(coldestC);

var combined = coldClass
  .multiply(100)
  .add(clim.multiply(10))
  .add(summerClass)
  .rename('combined');

var codeColorMap = {
  515: "#ff0000",
  525: "#ff8800",
  535: "#ffff00",
  545: "#ff00ff",
  555: "#00ff00",
  565: "#008800",
  
  //634: "#000000",
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discrete,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (WorldClim v1)',
  true, 0.7
);
