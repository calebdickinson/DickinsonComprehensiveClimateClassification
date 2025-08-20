// 2025

var months   = ee.List.sequence(1, 12);
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

function dailyTmeanC(ic) {
  return ic.map(function(img) {
    var bn = img.bandNames();
    var tmeanK = ee.Image(ee.Algorithms.If(
      bn.contains('tas'),
      img.select('tas'),
      img.select('tasmax').add(img.select('tasmin')).multiply(0.5)
    ));
    return tmeanK.subtract(273.15).rename('tmeanC')
                 .copyProperties(img, ['system:time_start']);
  });
}

function monthlyPack(tmeanDailyC, prDaily) {
  return ee.ImageCollection(
    months.map(function(m){
      m = ee.Number(m);
      var tmeanC_m = tmeanDailyC.filter(ee.Filter.calendarRange(m,m,'month'))
                                .mean().rename('tmeanC');
      var pr_m  = prDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
      var days  = ee.Number(daysList.get(m.subtract(1)));
      var rainM = pr_m.multiply(days).rename('pr');
      var es  = tmeanC_m.expression('0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC_m});
      var Ra  = ee.Image.constant(12 * 0.0820);
      var pet = es.multiply(Ra).multiply(0.1651).rename('pet');
      return tmeanC_m.addBands(rainM).addBands(pet).set('month', m);
    })
  );
}

function monthlyMeanTemps(tmeanDailyC) {
  return ee.ImageCollection(
    months.map(function(m) {
      return tmeanDailyC
        .filter(ee.Filter.calendarRange(m, m, 'month'))
        .mean()
        .rename('monthlyMean')
        .set('month', m);
    })
  );
}

var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filterDate('2025-01-01', '2026-01-01');

var tmeanC6_daily = dailyTmeanC(cmip6);
var pr6_daily     = cmip6.select('pr');

var monthlyTemp6  = monthlyMeanTemps(tmeanC6_daily);
var hottest6 = monthlyTemp6.qualityMosaic('monthlyMean')
  .select('monthlyMean').rename('hottestC');
var coldest6 = monthlyTemp6
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean').rename('coldestC');

var monthlyClim = monthlyPack(tmeanC6_daily, pr6_daily);
var hottestC_global = hottest6;
var coldestC_global = coldest6;

var pixelLat  = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

var validMask = P_ann.mask()
  .and(PET_ann.mask())
  .and(hottestC_global.mask())
  .and(coldestC_global.mask());

var aridBase = ee.Image(6) // H: Humid
  .updateMask(validMask)
  .where(AI.lt(0.0036),5)  // G: Semihumid
  .where(AI.lt(0.0024),2)  // S: Semiarid
  .where(AI.lt(0.0012),1)  // D: Arid Desert
  .rename('aridity');

var P_hs = monthlyClim
  .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun')
  .updateMask(P_ann.mask());

var HS = P_hs.divide(P_ann).rename('HS_ratio').updateMask(P_ann.mask());

var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3) // Mediterranean
  .where(hottestC_global.lt(15).or(coldestC_global.lt(-20)), 7) // no aridity
  .updateMask(validMask)
  .rename('climateClass');

var codeColorMap = {
  1: "#FF0000", // D: Arid Desert
  2: "#FFA500", // S: Semiarid
  3: "#FFFF00", // M: Mediterranean
  4: "#FF00FF", // W: Monsoon
  5: "#00FF00", // G: Semihumid
  6: "#006600", // H: Humid
  7: "#0000FF"  // no aridity
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = clim
  .remap(codes, indices)
  .updateMask(validMask)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate',
  true,
  0.7
);
