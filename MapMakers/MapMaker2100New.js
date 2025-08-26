// 2100 Map Maker

var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filter(ee.Filter.calendarRange(2100, 2100, 'year'));

var tasC6 = cmip6.select('tas').map(function(img){
  return img.subtract(273.15).rename('tasC')
            .copyProperties(img, ['system:time_start']);
});

var pr6 = cmip6.select('pr');

var months   = ee.List.sequence(1, 12);
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

function monthlyTasMean6(m){
  m = ee.Number(m);
  return tasC6.filter(ee.Filter.calendarRange(m, m, 'month'))
              .mean()
              .rename('monthlyMean')
              .set('month', m);
}

var monthlyTas6 = ee.ImageCollection(months.map(monthlyTasMean6));

var hottestC = monthlyTas6
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyTas6
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

function monthlyPrMean6(m){ 
  return pr6.filter(ee.Filter.calendarRange(m, m, 'month'))
            .mean().rename('pr');
}

var monthlyClim = ee.ImageCollection(
  months.map(function(m){
    m = ee.Number(m);
    var prM  = monthlyPrMean6(m).rename('pr');
    var tmeanC = monthlyTas6.filter(ee.Filter.eq('month', m)).first()
                            .select('monthlyMean').rename('tmeanC');
    var days  = ee.Number(daysList.get(m.subtract(1)));
    var rainM = prM.multiply(days).rename('pr');
    var es = tmeanC.expression('0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC});
    var Ra = ee.Image.constant(12 * 0.0820);
    var petM = es.multiply(Ra).multiply(0.1651).rename('pet');
    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(5);
var tropic    = pixelLat.abs().lte(5);
var southMask = pixelLat.lt(-5);

var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

var aridBase = ee.Image(6) // H: Humid
  .where(AI.lt(0.0036), 5) // G: Semihumid
  .where(AI.lt(0.0024), 2) // S: Semiarid
  .where(AI.lt(0.0012), 1) // D: Arid Desert
  .rename('aridity');

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

var combined = coldClass
  .multiply(100)
  .add(clim.multiply(10))
  .add(summerClass)
  .rename('combined');

var codeColorMap = {
  //515: "#ff0000",
  //525: "#ff8800",
  //535: "#ffff00",
  //545: "#ff00ff",
  //555: "#00ff00",
  //565: "#008800",

  110: "#000000",
  120: "#000000",
  130: "#000000",
  140: "#000000",
  150: "#000000",
  160: "#000000",
};

var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = combined.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discrete,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate',
  true, 0.7
);
