// Precompute 1971–2000 aridity & climate classification

// 1) Load NASA/NEX-GDDP historical 1971–2000
var data = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario','historical'))
  .filter(ee.Filter.calendarRange(1971,2000,'year'));

// 2) Build monthly climatologies: rainfall (pr), PET & mean temp (tmeanC)
var prDaily   = data.select('pr'),
    tmaxDaily = data.select('tasmax'),
    tminDaily = data.select('tasmin');

var months   = ee.List.sequence(1,12);
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

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
                  '0.6108 * exp(17.27 * T / (T + 237.3))',{T:tmeanC}
                ),
        Ra    = ee.Image.constant(12 * 0.0820),
        petM  = es.multiply(Ra).multiply(0.1651).rename('pet');
    return rainM.addBands(petM).addBands(tmeanC).set('month',m);
  })
);

// 3) Sum annual totals & find hottest/coldest months
var P_ann       = monthlyClim.select('pr' ).sum().rename('P_ann'),
    PET_ann     = monthlyClim.select('pet').sum().rename('PET_ann'),
    histHottest = monthlyClim.qualityMosaic('tmeanC').select('tmeanC')
                       .rename('histHottest'),
    histColdest = monthlyClim
                     .map(function(img){ return img.select('tmeanC').multiply(-1); })
                     .qualityMosaic('tmeanC')
                     .select('tmeanC').multiply(-1).rename('histColdest'),
    validMask   = histColdest.gte(-20).and(histHottest.gte(15)),
    AI          = P_ann.divide(PET_ann).rename('AI');

// 4) Base aridity classes (0–3) then refine to climateClass (0–5)
var aridBase = ee.Image(3)
  .where(AI.lt(0.0036),2)
  .where(AI.lt(0.0024),1)
  .where(AI.lt(0.0012),0)
  .updateMask(AI.mask())
  .updateMask(validMask);

var P_hs = monthlyClim
  .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

var lat = ee.Image.pixelLonLat().select('latitude');
var north  = lat.gt(5),
    tropic = lat.abs().lte(5),
    south  = lat.lt(-5);

var climateClass = aridBase
  // Northern hemisphere monsoon/med
  .where(north.and(aridBase.neq(0)).and(HS.gte(0.8)),   4)  // Monsoon
  .where(north.and(aridBase.neq(0)).and(HS.lt(0.4)),    5)  // Mediterranean
  // Tropics
  .where(tropic.and(aridBase.neq(0)).and(HS.lt(0.2)),  4)  // Monsoon
  .where(tropic.and(aridBase.neq(0)).and(HS.gte(0.8)), 4)  // Monsoon
  // Southern hemisphere monsoon/med
  .where(south.and(aridBase.neq(0)).and(HS.lt(0.2)),   4)  // Monsoon
  .where(south.and(aridBase.neq(0)).and(HS.gte(0.6)),   5)  // Mediterranean
  .rename('climateClass');

// 5) Export to your CurrentClimate folder
var region = ee.Geometry.Rectangle([-180, -90, 180, 90]);
var scale  = 25000;
var maxPx  = 1e13;

Export.image.toAsset({
  image:       climateClass,
  description: 'Aridity_1971_2000',
  assetId:     'Aridity_1971_2000',
  region:      region,
  scale:       scale,
  maxPixels:   maxPx
});
