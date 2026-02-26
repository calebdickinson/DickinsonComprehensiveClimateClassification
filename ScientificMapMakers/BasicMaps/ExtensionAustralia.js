// =======================================================================
// Australia thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) Australia bounding box (includes Tasmania)
var australiaFull = ee.Geometry.Rectangle(
  [112.5, -44, 154, -10],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Country name exactly as in GAUL 2015
var australiaCountriesFull = [
  'Australia'
];

// 3) Admin-1
var admin1AU_Full = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', australiaCountriesFull));

// 4) Admin-2
var admin2AU_Full = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level2')
  .filter(ee.Filter.inList('ADM0_NAME', australiaCountriesFull))
  .filterBounds(australiaFull);

// 5) Land mask (clip climate strictly to AU land)
var auMask_Full = ee.Image()
  .byte()
  .paint(admin1AU_Full, 1)
  .selfMask();

// 6) Climate overlay clipped to AU land
var climateRGB_AU_Full = discreteLand
  .updateMask(auMask_Full)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin2RGB_AU_Full = ee.Image()
  .byte()
  .paint(admin2AU_Full, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin1RGB_AU_Full = ee.Image()
  .byte()
  .paint(admin1AU_Full, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite layers
var compositeAU_Full = ee.ImageCollection([
  climateRGB_AU_Full,
  admin2RGB_AU_Full,
  admin1RGB_AU_Full
]).mosaic();

// 10) High-resolution thumbnail (balanced aspect)
var thumbUrlAU_Full = compositeAU_Full.getThumbURL({
  region: australiaFull,
  dimensions: '3199',
  format: 'png'
});

print('Australia FULL GAUL thumbnail URL:', thumbUrlAU_Full);

// Optional preview
Map.addLayer(compositeAU_Full, {}, 'Australia', true);
Map.centerObject(australiaFull, 4);