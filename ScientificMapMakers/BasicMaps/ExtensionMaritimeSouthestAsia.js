// =======================================================================
// Maritime Southeast Asia thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) Bounding box
var maritimeSEAFull = ee.Geometry.Rectangle(
  [94.5, -12.5, 163.0, 21.5],
  null,
  false
);

// 2) GAUL 2015 ADM0 names
var maritimeSEACountriesFull = [
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Philippines',
  'Papua New Guinea',
  'Solomon Islands',
  'Brunei Darussalam',
  'Timor-Leste'
];

// 3) Admin-0
var admin0_MSEA = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', maritimeSEACountriesFull))
  .filterBounds(maritimeSEAFull);

// 4) Admin-1
var admin1_MSEA = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', maritimeSEACountriesFull))
  .filterBounds(maritimeSEAFull);

// 5) Land mask
var mseaMask = ee.Image()
  .byte()
  .paint(admin0_MSEA, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_MSEA = discreteLand
  .updateMask(mseaMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders
var admin1RGB_MSEA = ee.Image()
  .byte()
  .paint(admin1_MSEA, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders
var admin0RGB_MSEA = ee.Image()
  .byte()
  .paint(admin0_MSEA, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeMSEA = ee.ImageCollection([
  climateRGB_MSEA,
  admin1RGB_MSEA,
  admin0RGB_MSEA
]).mosaic();

// 10) Thumbnail
var thumbUrlMSEA = compositeMSEA.getThumbURL({
  region: maritimeSEAFull,
  dimensions: '4110',
  format: 'png'
});

print('Maritime Southeast Asia thumbnail URL:', thumbUrlMSEA);

// Preview
Map.addLayer(compositeMSEA, {}, 'Maritime Southeast Asia', true);
Map.centerObject(maritimeSEAFull, 4);