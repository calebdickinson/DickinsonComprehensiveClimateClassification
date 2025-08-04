// Precompute 1971–2000 hottest‐month and coldest‐month means
var data = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'historical'))
  .filter(ee.Filter.calendarRange(1971, 2000, 'year'));

// Convert tasmax/tasmin from K to °C
var tasmax = data.select('tasmax')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasmaxC')
      .copyProperties(img, ['system:time_start']);
  });
var tasmin = data.select('tasmin')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasminC')
      .copyProperties(img, ['system:time_start']);
  });

// Build monthly means = (tasmaxC + tasminC)/2
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    var maxMean = tasmax
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    var minMean = tasmin
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    return maxMean.add(minMean)
                  .divide(2)
                  .rename('monthlyMean')
                  .set('month', m);
  })
);

// Extract extremes
var hottestC = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyMeans
  .map(function(img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// Export parameters
var region = ee.Geometry.Rectangle([-180, -90, 180, 90]);
var scale  = 25000;
var maxPx  = 1e13;

// Export hottest‐month raster
Export.image.toAsset({
  image:       hottestC,
  description: 'HottestC_1971_2000',
  assetId:     'users/calebisaacdickinson/DickinsonComprehensiveClimateClassification/CurrentClimate/HottestC_1971_2000',
  region:      region,
  scale:       scale,
  maxPixels:   maxPx
});

// Export coldest‐month raster
Export.image.toAsset({
  image:       coldestC,
  description: 'ColdestC_1971_2000',
  assetId:     'users/calebisaacdickinson/DickinsonComprehensiveClimateClassification/CurrentClimate/ColdestC_1971_2000',
  region:      region,
  scale:       scale,
  maxPixels:   maxPx
});
