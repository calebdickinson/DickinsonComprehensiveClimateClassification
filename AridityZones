// Set time range
var start = '2020-01-01';
var end = '2020-12-31';

// Load Daymet data
var daymet = ee.ImageCollection('NASA/ORNL/DAYMET_V4')
  .filterDate(start, end);

// Compute daily mean temperature: (tmin + tmax) / 2
var dailyTmean = daymet.map(function(image) {
  var tmin = image.select('tmin');
  var tmax = image.select('tmax');
  var tmean = tmin.add(tmax).divide(2).rename('tmean');
  return image.addBands(tmean);
});

// Annual mean temperature and total precipitation
var meanTemp = dailyTmean.select('tmean').mean().rename('meanTemp');
var annualPrecip = daymet.select('prcp').sum().rename('annualPrecip');

// Get monthly precipitation image for a given month
function getMonthlyPrecip(month) {
  var start = ee.Date('2020-' + (month < 10 ? '0' + month : month) + '-01');
  var end = ee.Date(start).advance(1, 'month');
  return daymet
    .filterDate(start, end)
    .select('prcp')
    .sum()
    .rename('prcp');  // Same band name for all months
}

// Sum April–September precipitation (high-sun period)
var highSunMonths = ee.ImageCollection([4, 5, 6, 7, 8, 9].map(getMonthlyPrecip));
var highSunPrecip = highSunMonths.sum().rename('highSunPrecip');

// Calculate the proportion of high-sun precipitation
var highSunRatio = highSunPrecip.divide(annualPrecip).rename('highSunRatio');

// Determine Köppen adjustment based on seasonal rainfall distribution
var adjustment = highSunRatio.gte(0.7).multiply(280)
  .add(highSunRatio.gte(0.3).and(highSunRatio.lt(0.7)).multiply(140))
  .add(highSunRatio.lt(0.3).multiply(0));

// Compute aridity threshold: P = 20 × T + adjustment
var pThreshold = meanTemp.multiply(20).add(adjustment).rename('pThreshold');
var pt_half = pThreshold.multiply(0.5);
var pt_triple = pThreshold.multiply(3);

// Classify aridity: 0 = Arid, 1 = Semi-arid, 2 = Semi-humid, 3 = Humid
var aridity = ee.Image.constant(3)
  .where(annualPrecip.lt(pt_triple), 2)   // Semi-humid
  .where(annualPrecip.lt(pThreshold), 1)  // Semi-arid
  .where(annualPrecip.lt(pt_half), 0)     // Arid
  .rename('aridityClass');

// Mask invalid pixels (e.g., ocean or missing data)
var valid = annualPrecip.mask().and(meanTemp.mask());
aridity = aridity.updateMask(valid);

// Visualization
var viz = {
  min: 0,
  max: 3,
  palette: [
    '#d73027',  // 0 = Arid (red)
    '#ffa500',  // 1 = Semi-arid (orange)
    '#a6d96a',  // 2 = Semi-humid (light green)
    '#1a9850'   // 3 = Humid (dark green)
  ]
};

// Display on map
Map.setCenter(-96, 38, 5);
Map.addLayer(aridity, viz, '4-Zone Aridity (Köppen-adjusted)', true, 0.5);
