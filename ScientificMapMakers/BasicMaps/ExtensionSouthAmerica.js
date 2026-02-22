// =======================================================================
// South America thumbnail: climate + admin-0 + admin-1
// =======================================================================

// 1) Tall South America bounding box
var southAmericaFull = ee.Geometry.Rectangle(
  [-82, -56, -34, 13],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Country names exactly as in your GAUL list
var southAmericaCountriesFull = [
  'Argentina',
  'Bolivia',
  'Brazil',
  'Chile',
  'Colombia',
  'Ecuador',
  'Guyana',
  'Paraguay',
  'Peru',
  'Suriname',
  'Uruguay',
  'Venezuela',
  'French Guiana',
  'Falkland Islands (Malvinas)'
];

// 3) Admin-0 (full GAUL)
var admin0SA_Full = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', southAmericaCountriesFull));

// 4) Admin-1 (full GAUL states)
var admin1SA_Full = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', southAmericaCountriesFull))
  .filterBounds(southAmericaFull);

// 5) Land mask (clip climate strictly to SA land)
var saMask_Full = ee.Image()
  .byte()
  .paint(admin0SA_Full, 1)
  .selfMask();

// 6) Climate overlay clipped to SA land
var climateRGB_SA_Full = discreteLand
  .updateMask(saMask_Full)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_SA_Full = ee.Image()
  .byte()
  .paint(admin1SA_Full, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_SA_Full = ee.Image()
  .byte()
  .paint(admin0SA_Full, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite layers
var compositeSA_Full = ee.ImageCollection([
  climateRGB_SA_Full,
  admin1RGB_SA_Full,
  admin0RGB_SA_Full
]).mosaic();

// 10) High-resolution tall thumbnail (safe size)
var thumbUrlSA_Full = compositeSA_Full.getThumbURL({
  region: southAmericaFull,
  dimensions: '2048x3072',
  format: 'png'
});

print('South America FULL GAUL thumbnail URL:', thumbUrlSA_Full);

// (Optional) Add to Map for quick preview
Map.addLayer(compositeSA_Full, {}, 'South America (FULL GAUL)', true);
Map.centerObject(southAmericaFull, 3);
