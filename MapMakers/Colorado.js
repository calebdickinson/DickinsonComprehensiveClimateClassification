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
y
var codeColorMap = {
  462: "#ffffff",
  
  413: "#0000ff",
  423: "#0000ff",
  433: "#0000ff",
  443: "#0000ff",
  453: "#0000ff",
  463: "#0000ff",
  
  424: "#ff9933",
  454: "#00ffff",
  
  512: "#000000",
  522: "#000000",
  532: "#000000",
  542: "#000000",
  552: "#000000",
  562: "#000000",
  
  513: "#6666ff",
  523: "#6666ff",
  533: "#6666ff",
  543: "#6666ff",
  553: "#6666ff",
  563: "#6666ff",
  
  //664: "#000000",
  
  514: "#ff0066",
  515: "#dd2200",
  516: "#771100",
  614: "#ffffff",
  615: "#ff8888",
  616: "#ff0000",
  617: "#cc0000",
  618: "#880000",
  716: "#ff4444",
  717: "#cc4444",
  718: "#882222",
  //817: "#FF69B4",
  //818: "#ff13f0",
  
  524: "#ccaa88",
  525: "#aa8866",
  526: "#886644",
  //624: "#0000ff",
  625: "#ffcc00",
  626: "#ff8800",
  627: "#884400",
  628: "#442200",
  726: "#cc6600",
  //727: "#000000",
  //728: "#888888",
  
  534: "#aaaa00",
  535: "#dddd00",
  635: "#ffff00",
  //636: "#000000",
  637: "#cccccc",
  
  544: "#660066",
  545: "#aa00aa",
  546: "#ff88ff",
  645: "#ff00ff",
  
  554: "#00ff00",
  555: "#00cc00",
  654: "#008888",
  //556: "#888888",
  655: "#00cccc",
  //657: "#88cc88",
  //756: "#00ffff",
  //757: "#008888",
  
  564: "#008800",
  //665: "#0000ff",
  //666: "#008800"
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

var STATE_NAME = 'Colorado';  // <- change me

var states = ee.FeatureCollection('TIGER/2018/States');
var aoi = states.filter(ee.Filter.eq('NAME', STATE_NAME)).geometry();

var discreteAOI = discrete.clip(aoi);

Map.addLayer(
  discreteAOI,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (' + STATE_NAME + ')',
  true, 0.7
);
