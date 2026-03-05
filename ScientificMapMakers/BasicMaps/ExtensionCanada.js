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

// 4) Climate overlay
var climateRGB_Canada =
  discreteLand
    .updateMask(canadaMask)
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

// ======================================================
// EXPORT GAUL LEVEL-1 BORDERS FOR MANUAL SEAM CORRECTION
//
// Purpose:
//   Export a raster version of GAUL admin-1 boundaries
//   so seam artifacts can be removed manually in GIMP.
//   The edited raster will later be re-imported as an EE asset.
//
// Notes:
//   • Borders exported in black (#000000)
//   • Background transparent
//   • Pixel grid matches the final map projection
// ======================================================

// 1) GAUL level-1 boundaries for Canada
var canadaAdmin1 =
  ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Canada'));

// 2) Rasterize borders (1-pixel width)
var admin1Export =
  ee.Image().byte()
    .paint(canadaAdmin1, 1, 1)
    .visualize({
      palette: ['#000000']   // black borders for editing
    });

// 3) Region (same region used for the final map)
var canadaRegion = ee.Geometry.Rectangle(
  [-124, 42, -57, 83],
  null,
  false
);

// 4) Canada Albers projection
var canadaAlbers = ee.Projection('EPSG:3978');

// 5) Generate download URL
var thumbAdmin1 = admin1Export.getThumbURL({
  region: canadaRegion,
  dimensions: 3124,   // same resolution as final map
  format: 'png',
  crs: canadaAlbers
});

print('Download GAUL level-1 borders for editing:', thumbAdmin1);