// =======================================================================
// Mexico + Central America + Caribbean thumbnail (FULL GAUL)
// =======================================================================

// 1) Region bounding box (tight but complete)
var mesoCarib = ee.Geometry.Rectangle(
  [-120, 5, -58, 33],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Countries in region (exact GAUL names from your list)
var mesoCaribCountries = [
  // Mexico + Central America
  'Mexico',
  'Guatemala',
  'Belize',
  'El Salvador',
  'Honduras',
  'Nicaragua',
  'Costa Rica',
  'Panama',

  // Caribbean islands
  'Bahamas',
  'Cuba',
  'Jamaica',
  'Haiti',
  'Dominican Republic',
  'Puerto Rico',
  'Trinidad and Tobago',
  'Barbados',
  'Antigua and Barbuda',
  'Dominica',
  'Grenada',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Guadeloupe',
  'Martinique',
  'Aruba',
  'Cayman Islands',
  'British Virgin Islands',
  'United States Virgin Islands',
  'Turks and Caicos islands'
];

// 3) Admin-0 (FULL GAUL)
var admin0_Meso = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', mesoCaribCountries));

// 4) Admin-1
var admin1_Meso = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', mesoCaribCountries))
  .filterBounds(mesoCarib);

// 5) Land mask
var mesoMask = ee.Image()
  .byte()
  .paint(admin0_Meso, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_Meso = discreteLand
  .updateMask(mesoMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_Meso = ee.Image()
  .byte()
  .paint(admin1_Meso, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_Meso = ee.Image()
  .byte()
  .paint(admin0_Meso, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeMeso = ee.ImageCollection([
  climateRGB_Meso,
  admin1RGB_Meso,
  admin0RGB_Meso
]).mosaic();

// 10) Thumbnail (wide-ish ratio works best here)
var thumbUrlMeso = compositeMeso.getThumbURL({
  region: mesoCarib,
  dimensions: '3072x1390',   // wider than tall
  format: 'png'
});

print('Mexico + Central America + Caribbean thumbnail URL:', thumbUrlMeso);

// Optional preview
Map.addLayer(compositeMeso, {}, 'Mesoamerica + Caribbean', true);
Map.centerObject(mesoCarib, 4);
