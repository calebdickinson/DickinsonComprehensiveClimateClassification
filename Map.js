// ----------------------------------------------------
// 1. LOAD ERA5 MONTHLY TEMPERATURE DATA (2000–2005)
// ----------------------------------------------------
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

// ----------------------------------------------------
// 2. LOAD NEX-GDDP HISTORICAL DATA (2000–2005)
// ----------------------------------------------------
var hist2000 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'historical'))
  .filter(ee.Filter.eq('model', 'ACCESS1-0'))
  .filter(ee.Filter.calendarRange(2000, 2005, 'year'));

var prDaily   = hist2000.select('pr'),
    tmaxDaily = hist2000.select('tasmax'),
    tminDaily = hist2000.select('tasmin'),
    daysList  = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim2000 = ee.ImageCollection(
  months.map(function(m){
    m = ee.Number(m);
    var prM   = prDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        tmaxM = tmaxDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        tminM = tminDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        days  = ee.Number(daysList.get(m.subtract(1))),
        rainM = prM.multiply(days).rename('pr'),
        tmeanC= tmaxM.add(tminM).divide(2).subtract(273.15).rename('tmeanC'),
        es    = tmeanC.expression(
                  '0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC}
                ),
        Ra    = ee.Image.constant(12 * 0.0820),
        petM  = es.multiply(Ra).multiply(0.1651).rename('pet');
    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

// ----------------------------------------------------
// 3. CLIMATE DERIVATIONS
// ----------------------------------------------------
var P_ann2000    = monthlyClim2000.select('pr' ).sum().rename('P_ann'),
    PET_ann2000  = monthlyClim2000.select('pet').sum().rename('PET_ann'),
    histHottest  = monthlyClim2000.qualityMosaic('tmeanC').select('tmeanC').rename('histHottest'),
    histColdest  = monthlyClim2000
                     .map(function(img){ return img.select('tmeanC').multiply(-1); })
                     .qualityMosaic('tmeanC')
                     .select('tmeanC').multiply(-1).rename('histColdest'),
    validMask    = histColdest.gte(-20).and(histHottest.gte(15)),
    AI2000       = P_ann2000.divide(PET_ann2000).rename('AI'),
    aridBase     = ee.Image(7) // H: Humid
                     .where(AI2000.lt(0.0036),6) // G: Semihumid
                     .where(AI2000.lt(0.0024),3) // S: Semiarid
                     .where(AI2000.lt(0.0012),2) // D: Arid Desert
                     .unmask(1) // no aridity
                     .rename('aridity')
                     .updateMask(AI2000.mask())
                     .updateMask(validMask),
    P_hs2000     = monthlyClim2000
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2000       = P_hs2000.divide(P_ann2000).rename('HS_ratio'),
    clim2000     = aridBase
                     .where(aridBase.neq(0).and(HS2000.gte(0.8)), 5) // W: Monsoon
                     .where(aridBase.neq(0).and(HS2000.lt(0.4)), 4) // M: Mediterranean
                     .rename('climateClass'),
    clim2000_flip= clim2000
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2000.eq(4)), 5)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2000.eq(5)), 4);

// ----------------------------------------------------
// 4. CLASSIFICATION FUNCTIONS
// ----------------------------------------------------
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

// ----------------------------------------------------
// 5. COMBINED ZONE CODE IMAGE
// ----------------------------------------------------
var warmComb = classifySummer(hottestC_global),
    coldComb = classifyCold(coldestC_global);

var combined = ee.Image(0)
  .where(validMask,
         coldComb.multiply(100)
                 .add(clim2000_flip.multiply(10))
                 .add(warmComb))
  .rename('combined');

// ----------------------------------------------------
// 6. COLOR MAP + VISUALIZATION
// ----------------------------------------------------
var codeColorMap = {
  876: "#009090", //AHA2
  875: "#00CACA", //AHA1

  776: "#005500", //BHA2
  775: "#008800", //BHA1
  774: "#00BB00", //BHB2
  
  677: "#005050", //CHZ1
  676: "#009090", //CHA2
  675: "#00CACA", //CHA1
  674: "#00EEEE", //CHB2
  
  576: "#005500", //DHA2
  575: "#008800", //DHA1
  574: "#00BB00", //DHB2
  
  475: "#00CACA", //EHA1
  474: "#00EEEE", //EHB2
  
  867: "#90EE90", //AGZ1
  866: "#90EE90", //AGA2
  865: "#90EE90", //AGA1
  
  766: "#90EE90", //BGA2
  765: "#90EE90", //BGA1
  764: "#90EE90", //BGB2
  
  667: "#90EE90", //CGZ1
  666: "#90EE90", //CGA2
  665: "#90EE90", //CGA1
  664: "#90EE90", //CGB2
  
  566: "#90EE90", //DGA2
  565: "#90EE90", //DGA1
  564: "#90EE90", //DGB2
  
  465: "#90EE90", //EGA1
  464: "#90EE90", //EGB2
  
  858: "#800080", //AWZ2
  857: "#800080", //AWZ1
  856: "#800080", //AWA2
  855: "#800080", //AWA1
  
  758: "#800080", //BWZ2
  757: "#800080", //BWZ1
  756: "#800080", //BWA2
  755: "#800080", //BWA1
  754: "#800080", //BWB2
  
  656: "#800080", //CWA2
  655: "#800080", //CWA1
  654: "#800080", //CWB2
  
  556: "#800080", //DWA2
  555: "#800080", //DWA1
  554: "#800080", //DWB2
  
  456: "#800080", //EWA2
  455: "#800080", //EWA1
  454: "#800080", //EWB2
  
  846: "#FFFF00", //AMA2
  
  746: "#FFFF00", //BMA2
  745: "#FFFF00", //BMA1
  744: "#FFFF00", //BMB2
  
  646: "#FFFF00", //CMA2
  645: "#FFFF00", //CMA1
  644: "#FFFF00", //CMB2
  
  546: "#FFFF00", //DMA2
  545: "#FFFF00", //DMA1
  544: "#FFFF00", //DMB2
  
  444: "#FFFF00", //EMB2

  837: "#FFA500", //ASZ1
  836: "#FFA500", //ASA2
  835: "#FFA500", //ASA1
  
  738: "#FFA500", //BSZ2
  737: "#FFA500", //BSZ1
  736: "#FFA500", //BSA2
  735: "#FFA500", //BSA1
  734: "#FFA500", //BSB2

  637: "#FFA500", //CSZ1
  636: "#FFA500", //CSA2
  635: "#FFA500", //CSA1
  634: "#FFA500", //CSB2
  
  536: "#FFA500", //DSA2
  535: "#FFA500", //DSA1
  534: "#FFA500", //DSB2
  
  436: "#FFA500", //ESA2
  435: "#FFA500", //ESA1
  434: "#FFA500", //ESB2
  
  828: "#FF0000", //ADZ2
  827: "#FF0000", //ADZ1
  826: "#FF0000", //ADA2
  825: "#FF0000", //ADA1
  
  729: "#000000", //BDX1
  728: "#770000", //BDZ2
  727: "#FF0000", //BDZ1
  726: "#FF0000", //BDA2
  725: "#FF0000", //BDA1
  724: "#FF0000", //BDB2
  
  628: "#FF0000", //CDZ2
  627: "#FF0000", //CDZ1
  626: "#FF0000", //CDA2
  625: "#FF0000", //CDA1
  624: "#FF0000", //CDB2
  
  527: "#FF0000", //DDZ1
  526: "#FF0000", //DDA2
  525: "#FF0000", //DDA1
  524: "#FF0000", //DDB2
  
  426: "#FF0000", //EDA2
  425: "#FF0000", //EDA1
  424: "#FF0000", //EDB2
  
  714: "#0000FF", //B_B1
  
  613: "#3333FF", //C_B1
  612: "#AC6AC5", //C_C2
  611: "#DC5596", //C_C1
  
  513: "#5555FF", //D_B1
  512: "#C378E0", //D_C2
  511: "#FF69B4", //D_C1
  510: "#888888", //D_Y
  
  413: "#7777FF", //E_B1
  412: "#DD88FF", //E_C2
  411: "#FF90BB", //E_C1
  410: "#AAAAAA", //E_Y
  
  315: "#5C4033", //F_A1
  314: "#964B00", //F_B2
  313: "#9999FF", //F_B1
  312: "#EFBBFF", //F_C2
  311: "#FFB6C1", //F_C1
  310: "#CCCCCC", //F_Y
  
  214: "#AD7842", //G_B2
  213: "#BBBBFF", //G_B1
  212: "#E6CCFF", //G_C2
  211: "#FBD9ED", //G_C1
  210: "#EEEEEE", //G_Y
  
  114: "#C4A484", //Y_B2
  113: "#DDDDFF", //Y_B1
  110: "#FFFFFF", //Y_Y

  };

// 1. Turn your JS object into client-side arrays:
var keys    = Object.keys(codeColorMap);                  // ["876","875",…,"110"]
var codes   = keys.map(function(k){ return parseInt(k,10); });    // [876,875,…,110]
var palette = keys.map(function(k){ return codeColorMap[k]; });   // ["#009090",…,"#FFFFFF"]

// 2. Build a JavaScript index array 0…N-1:
var indices = codes.map(function(code, idx){ return idx; });  // [0,1,2,…,123]

// 3. Remap your “big” codes → small indices:
var combinedIndexed = combined
  .remap(codes, indices, /* defaultValue */ -1)
  .rename('classIndex');

// 4. Draw *that* with an exact 0…(N-1) palette:
Map.centerObject(ee.Geometry.Point([0, 20]), 2);
Map.addLayer(
  combinedIndexed,
  {
    min:     0,
    max:     indices.length - 1,   // 123
    palette: palette
  },
  'combined (discrete)'
);

// ----------------------------------------------------
// 7. PRINT UNIQUE COMBINED ZONE CODES
// ----------------------------------------------------
// Make sure this function is defined *before* you call it:
function printZoneCodes() {
  var world = ee.Geometry.Rectangle([-180, -90, 180, 90]);
  var hist  = combined.reduceRegion({
    reducer:   ee.Reducer.frequencyHistogram(),
    geometry:  world,
    scale:     50000,
    maxPixels: 1e13
  });
  var codesDict   = ee.Dictionary(hist.get('combined'));
  var uniqueZones = codesDict.keys();
  print('Unique combined zone numbers:', uniqueZones);
}

// …and then call it:
printZoneCodes();
