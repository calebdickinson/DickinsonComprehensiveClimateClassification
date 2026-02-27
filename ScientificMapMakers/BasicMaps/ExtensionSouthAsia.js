// =======================================================================
// South Asia thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) South Asia bounding box
var southAsiaFull = ee.Geometry.Rectangle(
  [68, 5.3, 109.7, 33.5],
  null,
  false
);

// 2) GAUL 2015 ADM0 names
var southAsiaCountriesFull = [
  'India',
  'Bangladesh',
  'Bhutan',
  'Nepal',
  'Sri Lanka',
  'Myanmar',
  'Thailand',
  'Lao People\'s Democratic Republic',
  'Cambodia',
  'Viet Nam'
];

// 3) Admin-0
var admin0_SA = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', southAsiaCountriesFull))
  .filterBounds(southAsiaFull);

// 4) Admin-1
var admin1_SA = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', southAsiaCountriesFull))
  .filterBounds(southAsiaFull);

// 5) Land mask
var saMask = ee.Image()
  .byte()
  .paint(admin0_SA, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_SA = discreteLand
  .updateMask(saMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_SA = ee.Image()
  .byte()
  .paint(admin1_SA, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_SA = ee.Image()
  .byte()
  .paint(admin0_SA, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeSA = ee.ImageCollection([
  climateRGB_SA,
  admin1RGB_SA,
  admin0RGB_SA
]).mosaic();

// 10) Thumbnail
var thumbUrlSA = compositeSA.getThumbURL({
  region: southAsiaFull,
  dimensions: '3521',
  format: 'png'
});

print('South Asia thumbnail URL:', thumbUrlSA);

// Preview
Map.addLayer(compositeSA, {}, 'South Asia', true);
Map.centerObject(southAsiaFull, 4);