/***** CHELSA 2100 Map Maker using uploaded .tif assets (client-side IDs) *****/

var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets';  // <-- change if needed
var YEAR = 2100;

// Exact 30 arc-sec in meters at the equator (GEE reproject expects meters)
var ARCSEC30_M = (30.0 / 3600.0) * 111320.0;  // ≈ 926.67 m

function pad2(n){ return (n < 10 ? '0' : '') + n; }

// Client-side months
var monthsJS = [1,2,3,4,5,6,7,8,9,10,11,12];

// ---- Load tas (°C) at exact 30″ ----
var tasImages = monthsJS.map(function(m){
  var id = ASSET_ROOT + '/tas_' + YEAR + '_' + pad2(m);   // e.g. .../tas_2025_01
  var date = ee.Date.fromYMD(YEAR, m, 15);
  return ee.Image(id)
    .select(0)
    .rename('monthlyMean')
    // (optional) use bilinear so display is less blocky than nearest
    .resample('bilinear')
    // force exact 30 arc-sec
    .reproject({crs: 'EPSG:4326', scale: ARCSEC30_M})
    .set('month', m)
    .set('system:time_start', date.millis());
});
var monthlyTas6 = ee.ImageCollection(tasImages);

// ---- Load precipitation (mm/month) at exact 30″ ----
var prImages = monthsJS.map(function(m){
  var id = ASSET_ROOT + '/pr_' + YEAR + '_' + pad2(m);    // e.g. .../pr_2025_01
  var date = ee.Date.fromYMD(YEAR, m, 15);
  return ee.Image(id)
    .select(0)
    .rename('pr')
    .resample('bilinear')
    .reproject({crs: 'EPSG:4326', scale: ARCSEC30_M})
    .set('month', m)
    .set('system:time_start', date.millis());
});
var pr6 = ee.ImageCollection(prImages);

// ---------------------------------------------------------------------------
// The rest of your script can remain as-is from here (hottest/coldest, PET,
// aridity, climate classes, AOI, rendering). If you already pasted my previous
// 2025 Map Maker, keep everything after the collections.
// ---------------------------------------------------------------------------

// ---- hottest / coldest ----
var hottestC = monthlyTas6.qualityMosaic('monthlyMean')
  .select('monthlyMean').rename('hottestC');
var coldestC = monthlyTas6.map(function(img){
    return img.multiply(-1).copyProperties(img);
  }).qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean').rename('coldestC');

// ---- Monthly climate composite ----
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);
function monthlyClimMaker(m){ 
  m = ee.Number(m);
  var prM  = pr6.filter(ee.Filter.eq('month', m)).first().rename('pr');
  var tmeanC = monthlyTas6.filter(ee.Filter.eq('month', m)).first()
                .select('monthlyMean').rename('tmeanC');
  var days  = ee.Number(daysList.get(m.subtract(1)));
  var rainM = prM.multiply(days).rename('pr'); // total mm/month

  // Simple PET
  var es = tmeanC.expression('0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC});
  var Ra = ee.Image.constant(12 * 0.0820);
  var petM = es.multiply(Ra).multiply(0.1651).rename('pet');

  return rainM.addBands(petM).addBands(tmeanC).set('month', m);
}
var monthsEE = ee.List.sequence(1, 12);
var monthlyClim = ee.ImageCollection(monthsEE.map(monthlyClimMaker));

// ---- Aridity & climate classes (your original logic) ----
var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

var aridBase = ee.Image(6)
  .where(AI.lt(0.0036), 5)
  .where(AI.lt(0.0024), 2)
  .where(AI.lt(0.0012), 1)
  .rename('aridity');

var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

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

function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),  9)
    .where(tC.gte(35).and(tC.lt(40)),  8)
    .where(tC.gte(30).and(tC.lt(35)),  7)
    .where(tC.gte(25).and(tC.lt(30)),  6)
    .where(tC.gte(20).and(tC.lt(25)),  5)
    .where(tC.gte(15).and(tC.lt(20)),  4)
    .where(tC.gte(10).and(tC.lt(15)),  3)
    .where(tC.gte(5).and(tC.lt(10)),   2)
    .where(tC.gte(0).and(tC.lt(5)),    1)
    .where(tC.lt(0),                   0);
}
function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),   9)
    .where(tC.gte(20).and(tC.lt(30)),   8)
    .where(tC.gte(10).and(tC.lt(20)),   7)
    .where(tC.gte(0).and(tC.lt(10)),    6)
    .where(tC.gte(-10).and(tC.lt(0)),   5)
    .where(tC.gte(-20).and(tC.lt(-10)), 4)
    .where(tC.gte(-30).and(tC.lt(-20)), 3)
    .where(tC.gte(-40).and(tC.lt(-30)), 2)
    .where(tC.lt(-40),                  1);
}

var summerClass = classifySummer(hottestC);
var coldClass   = classifyCold(coldestC);

var combined = coldClass.multiply(100)
  .add(clim.multiply(10))
  .add(summerClass)
  .rename('combined');

// ----- your palette mapping here -----
var codeColorMap = { 
  410: "#880000",
  420: "#880000",
  430: "#880000",
  440: "#880000",
  450: "#880000",
  460: "#880000",
  
  411: "#ff0000",
  421: "#ff0000",
  431: "#ff0000",
  441: "#ff0000",
  451: "#ff0000",
  461: "#ff0000",
  
  //511: "#0000ff",
  //521: "#0000ff",
  //531: "#0000ff",
  //441: "#0000ff",
  //451: "#0000ff",
  //461: "#0000ff",
  
  412: "#bbbbff",
  422: "#bbbbff",
  432: "#bbbbff",
  442: "#bbbbff",
  452: "#bbbbff",
  462: "#bbbbff",
  
  413: "#0000ff",
  423: "#0000ff",
  433: "#0000ff",
  443: "#0000ff",
  453: "#0000ff",
  463: "#0000ff",
  
  414: "#cc0044",
  424: "#ff9933",
  444: "#ff4682",
  454: "#00ffff",
  464: "#004400",
  
  425: "#664422",
  445: "#330033",
  
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
  
  613: "#66ccff",
  623: "#66ccff",
  633: "#66ccff",
  643: "#66ccff",
  653: "#66ccff",
  663: "#66ccff",
  
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
  634: "#aaff00",
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
}; // TODO: fill out your scheme
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

// AOI example
var STATE_NAME = 'Colorado';
var states = ee.FeatureCollection('TIGER/2018/States');
var aoi = states.filter(ee.Filter.eq('NAME', STATE_NAME)).geometry();

Map.centerObject(aoi, 6);
Map.addLayer(discrete.clip(aoi),
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (' + STATE_NAME + ')',
  true, 0.7
);
