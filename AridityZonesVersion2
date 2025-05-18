// —————————————————————
// 1. LOAD TERRACLIMATE & SELECT YOUR BASELINE PERIOD (2001–2020)
// —————————————————————
var tc = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
  .filterDate('2001-01-01', '2020-12-31')
  // pr = monthly total precipitation (mm/month)
  // pet = monthly potential evapotranspiration (mm/month)
  .select(['pr','pet']);

// —————————————————————
// 2. COMPUTE MONTHLY CLIMATOLOGY
// —————————————————————
var months = ee.List.sequence(1, 12);
var monthlyClim = ee.ImageCollection(
  months.map(function(m) {
    m = ee.Number(m);
    // average all Januarys, all Februarys, etc.
    var clim = tc
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean()
      .set('month', m);
    return clim;
  })
);

// —————————————————————
// 3. SUM TO ANNUAL MEANS
// —————————————————————
// Annual mean precipitation (mm/year)
var P_ann = monthlyClim.select('pr')
  .sum()
  .rename('P_ann');
// Annual potential evapotranspiration (mm/year)
var PET_ann = monthlyClim.select('pet')
  .sum()
  .rename('PET_ann');

// —————————————————————
// 4. CALCULATE ARIDITY INDEX & CLASSIFY
// —————————————————————
// Aridity Index AI = P_ann / PET_ann
var AI = P_ann.divide(PET_ann).rename('AI');

// 0 = Arid       
// 1 = Semi-arid  
// 2 = Sub-humid  
// 3 = Humid      
var aridity = ee.Image(3)  // default = Humid
  .where(AI.lt(0.105), 2)   // Semi-humid
  .where(AI.lt(0.04), 1)   // Semi-arid
  .where(AI.lt(0.02), 0)   // Arid
  .rename('aridity')
  .updateMask(AI.mask());
  
// —————————————————————
// 5. ADD MONSOON & MEDITERRANEAN (excluding deserts)
// —————————————————————
// Sum April–September precipitation from your monthlyClim
var P_highSun = monthlyClim
  .filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
  .select('pr')
  .sum()
  .rename('P_highSun');

// Compute high‐sun ratio
var HS_ratio = P_highSun.divide(P_ann).rename('HS_ratio');

// Extend the 0–3 aridity map into a 0–5 “climate class” map
var climateClass = aridity
  // Monsoon where not desert and ≥80% percipitation in high-sun months
  .where(aridity.neq(0).and(HS_ratio.gte(0.8)), 4)
  // Mediterranean where not desert and <35% percipitation in high-sun months
  .where(aridity.neq(0).and(HS_ratio.lt(0.35)),   5)
  .rename('climateClass');
  
  // get latitude as an image
var lat = ee.Image.pixelLonLat().select('latitude');
// create a mask for southern hemisphere
var isSouth = lat.lt(0);

// swap class 4⇄5 where lat<0
var climateClassFlipped = climateClass
  .where(isSouth.and(climateClass.eq(4)), 5)
  .where(isSouth.and(climateClass.eq(5)), 4)
  .rename('climateClass');

// —————————————————————
// 6. VISUALIZE EXTENDED CLASSES
// —————————————————————
Map.addLayer(climateClassFlipped, {
  min: 0, max: 5,
  palette: [
    '#d73027', // 0 = Arid
    '#ffa500', // 1 = Semi-arid
    '#a6d96a', // 2 = Sub-humid
    '#1a9850', // 3 = Humid
    '#800080', // 4 = Monsoon
    '#ffd700'  // 5 = Mediterranean
  ]
}, 'Climate Classes (0–5)', /* shown= */ true, /* opacity= */ 0.5);
