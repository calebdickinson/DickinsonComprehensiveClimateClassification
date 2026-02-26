// =======================================================================
// New Zealand thumbnail: climate + admin-1 + admin-2
// =======================================================================

// 1) New Zealand bounding box (North + South + Stewart Island)
var newZealandFull = ee.Geometry.Rectangle(
  [166, -47.5, 184.2, -34],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Country name exactly as in GAUL 2015
var newZealandCountriesFull = [
  'New Zealand'
];

// 3) Admin-1
var admin1NZ_Full = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', newZealandCountriesFull));

// 4) Admin-2
var admin2NZ_Full = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.inList('ADM0_NAME', newZealandCountriesFull))
  .filterBounds(newZealandFull);

// 5) Land mask (clip climate strictly to NZ land)
var nzMask_Full = ee.Image()
  .byte()
  .paint(admin1NZ_Full, 1)
  .selfMask();

// 6) Climate overlay clipped to NZ land
var climateRGB_NZ_Full = discreteLand
  .updateMask(nzMask_Full)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-2 borders (gray)
var admin2RGB_NZ_Full = ee.Image()
  .byte()
  .paint(admin2NZ_Full, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-1 borders (black)
var admin1RGB_NZ_Full = ee.Image()
  .byte()
  .paint(admin1NZ_Full, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite layers
var compositeNZ_Full = ee.ImageCollection([
  climateRGB_NZ_Full,
  admin2RGB_NZ_Full,
  admin1RGB_NZ_Full
]).mosaic();

// 10) High-resolution thumbnail
var thumbUrlNZ_Full = compositeNZ_Full.getThumbURL({
  region: newZealandFull,
  dimensions: '3362',
  format: 'png'
});

print('New Zealand thumbnail URL:', thumbUrlNZ_Full);

// Optional preview
Map.addLayer(compositeNZ_Full, {}, 'New Zealand', true);
Map.centerObject(newZealandFull, 5);