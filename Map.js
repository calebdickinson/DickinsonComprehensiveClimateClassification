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
                 .add(coldComb))
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
  
  : "#90EE90", //BGA2
  : "#90EE90", //BGA1
  : "#90EE90", //BGB2
  
  : "#90EE90", //CGZ1
  : "#90EE90", //CGA2
  : "#90EE90", //CGA1
  : "#90EE90", //CGB2
  
  : "#90EE90", //DGA2
  : "#90EE90", //DGA1
  : "#90EE90", //DGB2
  
  : "#90EE90", //EGA1
  : "#90EE90", //EGB2
  
  : "#FFFF00", //AMA2
  
  : "#FFFF00", //BMA2
  : "#FFFF00", //BMA1
  : "#FFFF00", //BMB2
  
  : "#FFFF00", //CMA2
  : "#FFFF00", //CMA1
  : "#FFFF00", //CMB2
  
  : "#FFFF00", //DMA2
  : "#FFFF00", //DMA1
  : "#FFFF00", //DMB2
  
  : "#FFFF00", //EMB2
  
  : "#800080", //AWZ2
  : "#800080", //AWZ1
  : "#800080", //AWA2
  : "#800080", //AWA1
  
  : "#800080", //BWZ2
  : "#800080", //BWZ1
  : "#800080", //BWA2
  : "#800080", //BWA1
  : "#800080", //BWB2
  
  : "#800080", //CWA2
  : "#800080", //CWA1
  : "#800080", //CWB2
  
  : "#800080", //DWA2
  : "#800080", //DWA1
  : "#800080", //DWB2
  
  : "#800080", //EWA2
  : "#800080", //EWA1
  : "#800080", //EWB2
  
  : "#FFA500", //ASA2
  : "#FFA500", //ASA1
  : "#FFA500", //ASZ1
  
  : "#FFA500", //BSZ2
  : "#FFA500", //BSZ1
  : "#FFA500", //BSA2
  : "#FFA500", //BSA1
  : "#FFA500", //BSB2

  : "#FFA500", //CSZ1
  : "#FFA500", //CSA2
  : "#FFA500", //CSA1
  : "#FFA500", //CSB2
  
  : "#FFA500", //DSA2
  : "#FFA500", //DSA1
  : "#FFA500", //DSB2
  
  : "#FFA500", //ESA2
  : "#FFA500", //ESA1
  : "#FFA500", //ESB2
  
  : "#FF0000", //ADZ2
  : "#FF0000", //ADZ1
  : "#FF0000", //ADA2
  : "#FF0000", //ADA1
  
  : "#000000", //BDX1
  : "#770000", //BDZ2
  : "#FF0000", //BDZ1
  : "#FF0000", //BDA2
  : "#FF0000", //BDA1
  : "#FF0000", //BDB2
  
  : "#FF0000", //CDZ2
  : "#FF0000", //CDZ1
  : "#FF0000", //CDA2
  : "#FF0000", //CDA1
  : "#FF0000", //CDB2
  
  : "#FF0000", //DDZ1
  : "#FF0000", //DDA2
  : "#FF0000", //DDA1
  : "#FF0000", //DDB2
  
  : "#FF0000", //EDA2
  : "#FF0000", //EDA1
  : "#FF0000", //EDB2
  
  : "#0000FF", //B_B1
  
  : "#3333FF", //C_B1
  : "#AC6AC5", //C_C2
  : "#DC5596", //C_C1
  
  : "#5555FF", //D_B1
  : "#C378E0", //D_C2
  : "#FF69B4", //D_C1
  : "#888888", //D_Y
  
  : "#7777FF", //E_B1
  : "#DD88FF", //E_C2
  : "#FF90BB", //E_C1
  : "#AAAAAA", //E_Y
  
  : "#5C4033", //F_A1
  : "#964B00", //F_B2
  : "#9999FF", //F_B1
  : "#EFBBFF", //F_C2
  : "#FFB6C1", //F_C1
  : "#CCCCCC", //F_Y
  
  : "#AD7842", //G_B2
  : "#BBBBFF", //G_B1
  : "#E6CCFF", //G_C2
  : "#FBD9ED", //G_C1
  : "#EEEEEE", //G_Y
  
  : "#C4A484", //Y_B2
  : "#DDDDFF", //Y_B1
  : "#FFFFFF", //Y_Y

  };

// Convert string keys to numbers if possible
var keys = Object.keys(codeColorMap);
var codes = keys.map(function(k) {
  var n = parseInt(k, 10);
  return isNaN(n) ? null : n;
}).filter(function(v){ return v !== null; });

var palette = keys.map(function(k) { return codeColorMap[k]; });

Map.centerObject(ee.Geometry.Point([0, 20]), 2);
Map.addLayer(combined, {min: 1, max: codes.length, palette: palette}, 'combinedColored');

// ----------------------------------------------------
// 7. PRINT UNIQUE COMBINED ZONE CODES
// ----------------------------------------------------
function printZoneCodes() {
  var world = ee.Geometry.Rectangle([-180, -90, 180, 90]);
  var hist = combined.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: world,
    scale: 50000,
    maxPixels: 1e13
  });
  var codesDict = ee.Dictionary(hist.get('combined'));
  var uniqueZones = codesDict.keys();
  print('Unique combined zone numbers:', uniqueZones);
}
printZoneCodes();
