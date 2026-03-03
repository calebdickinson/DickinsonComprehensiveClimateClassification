// ====================================
// Canada Albers Projection (EPSG:3978)
// ====================================

// 1) Canadian ADM2 units
var canadaADM2 = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'Canada'))
  .map(function(f){
    return f.simplify({maxError: 2000}); // meters
  });
  
// 2) Admin-1 border
var canadaAdmin1 =
  ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'Canada'))
  .map(function(f){
    return f.simplify({maxError: 2000}); // meters
  });
    
// 3) Stable Canada land mask
var canadaMask =
  ee.Image.constant(1)
    .clip(canadaAdmin1)
    .selfMask();
    
// 3b) Latitude mask (≤ 71.5°N only)
var latImg = ee.Image.pixelLonLat().select('latitude');
var latMask = latImg.lte(71.5);

// 4) Climate overlay
var climateRGB_Canada =
  discreteLand
    .updateMask(canadaMask)
    .updateMask(latMask)   // <-- mask north of 71.5°N
    .visualize({
      min: 0,
      max: indices.length - 1,
      palette: palette
    });

// 5) Borders
var admin2RGB_Canada =
  ee.Image().byte()
    .paint(canadaADM2, 1, 1)
    .visualize({
      palette: ['#888888'],
      opacity: 0.5
    });

var admin1RGB_Canada =
  ee.Image().byte()
    .paint(canadaAdmin1, 1, 2)
    .visualize({
      palette: ['#000000']
    });

// 6) Composite
var compositeCanada =
  ee.ImageCollection([
    climateRGB_Canada,
    admin2RGB_Canada,
    admin1RGB_Canada
  ]).mosaic();

// 7) Use built-in Albers
var canadaAlbers = ee.Projection('EPSG:3978');

var canadaRegion = ee.Geometry.Rectangle(
  [-124, 42, -57, 83],
  null,
  false
);

// 8) Thumbnail
var thumbCanada = compositeCanada.getThumbURL({
  region: canadaRegion,
  dimensions: 3124,
  format: 'png',
  crs: canadaAlbers
});

print('Canada thumbnail (Stable Albers):', thumbCanada);