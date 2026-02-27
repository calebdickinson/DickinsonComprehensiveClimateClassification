// =======================================================================
// Hawaii thumbnail: climate + admin-1 + admin-2
// =======================================================================

// 1) Hawaii bounding box (covers entire island chain)
var hawaiiFull = ee.Geometry.Rectangle(
  [-160.26, 18.9, -154.8, 22.24],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Country name exactly as in GAUL 2015
var hawaiiCountriesFull = [
  'United States of America'
];

// 3) Admin-1 (State level — Hawaii)
var admin1HI_Full = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Hawaii'));

// 4) Admin-2 (County level)
var admin2HI_Full = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM1_NAME', 'Hawaii'))
  .filterBounds(hawaiiFull);

// 5) Land mask (clip climate strictly to Hawaii land)
var hiMask_Full = ee.Image()
  .byte()
  .paint(admin1HI_Full, 1)
  .selfMask();

// 6) Climate overlay clipped to Hawaii land
var climateRGB_HI_Full = discreteLand
  .updateMask(hiMask_Full)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-2 borders (gray)
var admin2RGB_HI_Full = ee.Image()
  .byte()
  .paint(admin2HI_Full, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-1 borders (black)
var admin1RGB_HI_Full = ee.Image()
  .byte()
  .paint(admin1HI_Full, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite layers
var compositeHI_Full = ee.ImageCollection([
  climateRGB_HI_Full,
  admin2RGB_HI_Full,
  admin1RGB_HI_Full
]).mosaic();

// 10) High-resolution thumbnail
var thumbUrlHI_Full = compositeHI_Full.getThumbURL({
  region: hawaiiFull,
  dimensions: '3702',
  format: 'png'
});

print('Hawaii thumbnail URL:', thumbUrlHI_Full);

// Optional preview
Map.addLayer(compositeHI_Full, {}, 'Hawaii', true);
Map.centerObject(hawaiiFull, 7);