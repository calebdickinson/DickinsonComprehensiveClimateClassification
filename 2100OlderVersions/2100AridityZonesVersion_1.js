// —————————————————————
// LOAD & PREP 2100 FUTURE DATA
// —————————————————————
var future2100 = ee.ImageCollection('NASA/NEX-GDDP')
    .filter(ee.Filter.eq('scenario','rcp85'))
    .filter(ee.Filter.calendarRange(2100,2100,'year'));

// DAILY PR (mm/day), TASMAX & TASMIN (K)
var prDaily   = future2100.select('pr');
var tmaxDaily = future2100.select('tasmax');
var tminDaily = future2100.select('tasmin');

// MONTH LIST & DAYS-IN-MONTH
var months   = ee.List.sequence(1,12);
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

// COMPUTE MONTHLY CLIMATOLOGY & HAMON PET
var monthlyClim2100 = ee.ImageCollection(
  months.map(function(m) {
    m = ee.Number(m);
    var prM   = prDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var tmaxM = tmaxDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var tminM = tminDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var days = ee.Number(daysList.get(m.subtract(1)));
    
    // mm/day → mm/month
    var rainM = prM.multiply(days).rename('pr');
    // mean °C
    var tmeanC = tmaxM.add(tminM).divide(2).subtract(273.15).rename('tmeanC');
    // Hamon PET
    var es = tmeanC.expression(
      '0.6108 * exp(17.27 * T / (T + 237.3))',
      {T: tmeanC}
    );
    var Ra   = ee.Image.constant(12 * 0.0820);
    var petM = es.multiply(Ra).multiply(0.1651).rename('pet');
    
    return rainM.addBands(petM).set('month', m);
  })
);

// SUM TO ANNUAL
var P_ann2100   = monthlyClim2100.select('pr').sum().rename('P_ann');
var PET_ann2100 = monthlyClim2100.select('pet').sum().rename('PET_ann');

// ARIDITY INDEX & BASE CLASS
var AI2100 = P_ann2100.divide(PET_ann2100).rename('AI');
var arid2100 = ee.Image(3)
  .where(AI2100.lt(0.0037), 2)
  .where(AI2100.lt(0.002),  1)
  .where(AI2100.lt(0.001),  0)
  .rename('aridity')
  .updateMask(AI2100.mask());

// MONSOON / MEDITERRANEAN
var P_hs2100 = monthlyClim2100
  .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun');
var HS2100 = P_hs2100.divide(P_ann2100).rename('HS_ratio');

var clim2100 = arid2100
  .where(arid2100.neq(0).and(HS2100.gte(0.8)), 4)
  .where(arid2100.neq(0).and(HS2100.lt(0.35)),  5)
  .rename('climateClass');

// FLIP IN SOUTHERN HEMI
var lat = ee.Image.pixelLonLat().select('latitude');
var clim2100_flip = clim2100
  .where(lat.lt(0).and(clim2100.eq(4)), 5)
  .where(lat.lt(0).and(clim2100.eq(5)), 4);

// VISUALIZE
Map.addLayer(clim2100_flip, {
  min: 0, max: 5,
  palette: [
    '#d73027','#ffa500','#a6d96a','#1a9850','#800080','#ffd700'
  ]
}, 'Future 2100 Climate Classes', true, 0.5);
