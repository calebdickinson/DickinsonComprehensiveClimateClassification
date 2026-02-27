// =======================================================================
// Middle East thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) Middle East bounding box
var middleEastFull = ee.Geometry.Rectangle(
  [25.5, 11.5, 75.5, 44],
  null,
  false
);

// 2) GAUL 2015 ADM0 names
var middleEastCountriesFull = [
  'Turkey',
  'Cyprus',
  'Georgia',
  'Armenia',
  'Azerbaijan',
  'Syrian Arab Republic',
  'Lebanon',
  'Israel',
  'West Bank',
  'Gaza Strip',
  'Jordan',
  'Iraq',
  'Iran  (Islamic Republic of)',
  'Kuwait',
  'Saudi Arabia',
  'Bahrain',
  'Qatar',
  'United Arab Emirates',
  'Oman',
  'Yemen',
  'Afghanistan',
  'Pakistan'
];

// 3) Admin-0
var admin0_ME = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', middleEastCountriesFull))
  .filterBounds(middleEastFull);

// 4) Admin-1
var admin1_ME = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', middleEastCountriesFull))
  .filterBounds(middleEastFull);

// 5) Land mask (paint admin0 so micro-states render cleanly)
var meMask = ee.Image()
  .byte()
  .paint(admin0_ME, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_ME = discreteLand
  .updateMask(meMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_ME = ee.Image()
  .byte()
  .paint(admin1_ME, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black, thicker)
var admin0RGB_ME = ee.Image()
  .byte()
  .paint(admin0_ME, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeME = ee.ImageCollection([
  climateRGB_ME,
  admin1RGB_ME,
  admin0RGB_ME
]).mosaic();

// 10) Thumbnail
var thumbUrlWA = compositeME.getThumbURL({
  region: middleEastFull,
  dimensions: '3362',
  format: 'png'
});

print('Middle East thumbnail URL:', thumbUrlWA);

// Preview
Map.addLayer(compositeME, {}, 'Middle East', true);
Map.centerObject(middleEastFull, 4);