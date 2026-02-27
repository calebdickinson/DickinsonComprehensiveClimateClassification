// =======================================================================
// East Asia thumbnail: climate + admin-0 + admin-1
// (China, Taiwan, Japan, Mongolia, North & South Korea)
// =======================================================================

// 1) East Asia bounding box
var eastAsiaFull = ee.Geometry.Rectangle(
  [73, 18, 146, 54],
  null,
  false
);

// 2) GAUL 2015 ADM0 names (exact)
var eastAsiaCountriesFull = [
  'China',
  'Taiwan',
  'Japan',
  'Mongolia',
  'Dem People\'s Rep of Korea', // North Korea
  'Republic of Korea'          // South Korea
];

// 3) Admin-0
var admin0_EA = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', eastAsiaCountriesFull))
  .filterBounds(eastAsiaFull);

// 4) Admin-1
var admin1_EA = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', eastAsiaCountriesFull))
  .filterBounds(eastAsiaFull);

// 5) Land mask (paint admin0 so islands + small units render cleanly)
var eaMask = ee.Image()
  .byte()
  .paint(admin0_EA, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_EA = discreteLand
  .updateMask(eaMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_EA = ee.Image()
  .byte()
  .paint(admin1_EA, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black, thicker)
var admin0RGB_EA = ee.Image()
  .byte()
  .paint(admin0_EA, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeEA = ee.ImageCollection([
  climateRGB_EA,
  admin1RGB_EA,
  admin0RGB_EA
]).mosaic();

// 10) Thumbnail
var thumbUrlEA = compositeEA.getThumbURL({
  region: eastAsiaFull,
  dimensions: '3362',
  format: 'png'
});

print('East Asia thumbnail URL:', thumbUrlEA);

// Preview
Map.addLayer(compositeEA, {}, 'East Asia', true);
Map.centerObject(eastAsiaFull, 4);