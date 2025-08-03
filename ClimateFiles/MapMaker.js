//A MAJOR ISSUE WITH ARIDITY CALCULATIONS WAS DISCOVERED
//ONLY PROGRAMS WITH THIS MESSAGE AT THE TOP HAVE BEEN CORRECTED
//THEREFORE ONLY THESE PROGRAMS CAN BE CONSIDERED VALID FOR CALCULATING ARIDITY
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

var hist = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'historical'))
  .filter(ee.Filter.eq('model', 'ACCESS1-0'))
  .filter(ee.Filter.calendarRange(2000, 2005, 'year'));

var prDaily   = hist.select('pr'),
    tmaxDaily = hist.select('tasmax'),
    tminDaily = hist.select('tasmin'),
    daysList  = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim = ee.ImageCollection(
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

var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic   = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);
var P_ann    = monthlyClim.select('pr' ).sum().rename('P_ann'),
    PET_ann  = monthlyClim.select('pet').sum().rename('PET_ann'),
    AI       = P_ann.divide(PET_ann).rename('AI'),
    aridBase     = ee.Image(6) // H: Humid
                     .where(AI.lt(0.0036),5) // G: Semihumid
                     .where(AI.lt(0.0024),2) // S: Semiarid
                     .where(AI.lt(0.0012),1) // D: Arid Desert
                     .rename('aridity'),
    P_hs     = monthlyClim
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS       = P_hs.divide(P_ann).rename('HS_ratio'),
    clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4)  // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3)  // Mediterranean
  .rename('climateClass');

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

var warmComb = classifySummer(hottestC_global),
    coldComb = classifyCold(coldestC_global);

var combined = coldComb
    .multiply(100)                
    .add(clim.multiply(10))
    .add(warmComb)    
    .rename('combined');

var codeColorMap = {
  714: "#ff0000",
  724: "#ff8800",
  734: "#ffff00",
  744: "#ff00ff",
  754: "#00ff00",
  764: "#008800",
  };

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = combined
  .remap(codes, indices)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    palette: palette
  },
  'Climate',
  true,   // show layer
  0.8     // 80% opacity
);
