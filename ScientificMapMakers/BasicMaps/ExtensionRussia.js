// ====================================
// Russia Albers Projection (EPSG:3576)
// ====================================

// 1) Russian ADM1 units
var russiaADM1 = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'Russian Federation'));

// 2) Admin-0 border
var russiaAdmin0 =
  ee.FeatureCollection('FAO/GAUL/2015/level0')
    .filter(ee.Filter.eq('ADM0_NAME','Russian Federation'));
    
// 3) Stable Russia land mask
var russiaMask =
  ee.Image.constant(1)
    .clip(russiaADM1)
    .selfMask();

// 4) Climate overlay
var climateRGB_Russia =
  discreteLand
    .updateMask(russiaMask)
    .visualize({
      min: 0,
      max: indices.length - 1,
      palette: palette
    });

// 5) Borders
var admin1RGB_Russia =
  ee.Image().byte()
    .paint(russiaADM1, 1, 1)
    .visualize({
      palette: ['#888888'],
      opacity: 0.5
    });

var admin0RGB_Russia =
  ee.Image().byte()
    .paint(russiaAdmin0, 1, 2)
    .visualize({
      palette: ['#000000']
    });

// 6) Composite
var compositeRussia =
  ee.ImageCollection([
    climateRGB_Russia,
    admin1RGB_Russia,
    admin0RGB_Russia
  ]).mosaic();

// 7) Use built-in Albers

var russiaAlbers = ee.Projection('EPSG:3576');

var russiaRegion = ee.Geometry.Rectangle(
  [20, 49, 187, 85],
  null,
  false
);

// 8) Thumbnail

var thumbRussia = compositeRussia.getThumbURL({
  region: russiaRegion,
  dimensions: 2400,
  format: 'png',
  crs: russiaAlbers
});

print('Russia thumbnail (Stable Albers):', thumbRussia);