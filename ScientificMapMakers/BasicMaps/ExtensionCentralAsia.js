// =======================================================================
// Central Asia thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) Central Asia bounding box
var centralAsiaFull = ee.Geometry.Rectangle(
  [46.4, 35, 87.5, 55.5],
  null,
  false
);

// 2) GAUL 2015 ADM0 names (core Central Asia)
var centralAsiaCountriesFull = [
  'Kazakhstan',
  'Kyrgyzstan',
  'Tajikistan',
  'Turkmenistan',
  'Uzbekistan'
];

// 3) Admin-0
var admin0_CA = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', centralAsiaCountriesFull))
  .filterBounds(centralAsiaFull);

// 4) Admin-1
var admin1_CA = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', centralAsiaCountriesFull))
  .filterBounds(centralAsiaFull);

// 5) Land mask
var caMask = ee.Image()
  .byte()
  .paint(admin0_CA, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_CA = discreteLand
  .updateMask(caMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_CA = ee.Image()
  .byte()
  .paint(admin1_CA, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_CA = ee.Image()
  .byte()
  .paint(admin0_CA, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeCA = ee.ImageCollection([
  climateRGB_CA,
  admin1RGB_CA,
  admin0RGB_CA
]).mosaic();

// 10) Thumbnail
var thumbUrlCA = compositeCA.getThumbURL({
  region: centralAsiaFull,
  dimensions: '4100',
  format: 'png'
});

print('Central Asia thumbnail URL:', thumbUrlCA);

// Preview
Map.addLayer(compositeCA, {}, 'Central Asia', true);
Map.centerObject(centralAsiaFull, 4);