// ======================================================
// World thumbnail: climate + admin-0 and admin-1 borders
// ======================================================

// ---------- Non-geodesic world rectangle ----------
var world = ee.Geometry.Rectangle(
  [-180, -90, 180, 90],
  null,
  false
);

// ---------- Climate overlay ----------
var climateRGB = discreteLand.visualize({
  min: 0,
  max: indices.length - 1,
  palette: palette
});

// ---------- Admin-0 borders ----------
var admin0Clean = ee.Image(
  'projects/ordinal-crowbar-459807-m2/assets/gaul0_georef'
);

var admin0RGB = admin0Clean
  .select(['b1', 'b2', 'b3'])            // RGB
  .updateMask(admin0Clean.select('b4'))  // alpha
  .rename(['vis-red', 'vis-green', 'vis-blue']);
  
// ---------- Admin-1 borders (CLEAN raster asset) ----------
var admin1Clean = ee.Image(
  'projects/ordinal-crowbar-459807-m2/assets/gaul1_georef'
);

var admin1RGB = ee.Image(1)
  .updateMask(admin1Clean.select('b4')) // alpha
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// ---------- Composite ----------
var composite = ee.ImageCollection([
  climateRGB,
  admin1RGB,
  admin0RGB,
]).mosaic();

// ---------- PNG thumbnail ----------
var thumbUrl = composite.getThumbURL({
  region: world,
  dimensions: '4096x2048',
  format: 'png'
});

print('World thumbnail URL:', thumbUrl);

// =======================================================================
// Continental United States thumbnail: climate + counties + state borders
// =======================================================================

// ---------- CONUS rectangle ----------
var conus = ee.Geometry.Rectangle(
  [-125, 24, -66.5, 49.5],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// ---------- County borders ----------
var countiesFC = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filterBounds(conus);

var countiesRGB = ee.Image()
  .byte()
  .paint(countiesFC, 1, 1) 
  .visualize({
    palette: ['#888888'],
    opacity: 0.5            
  });

// ---------- State borders ----------
var statesFC = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filterBounds(conus);
  
var stateMask = ee.Image()
  .byte()
  .paint(statesFC, 1)
  .selfMask();

var statesRGB = ee.Image()
  .byte()
  .paint(statesFC, 1, 1)
  .visualize({
    palette: ['#000000'],
  });
  
// ---------- Climate overlay ----------
var climateRGB = discreteLand
  .updateMask(stateMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
});

// ---------- Composite ----------

var composite = ee.ImageCollection([
  climateRGB,
  countiesRGB,
  statesRGB,
]).mosaic();

// ---------- PNG thumbnail ----------

var thumbUrl = composite.getThumbURL({
  region: conus,
  dimensions: '4096x2048',
  format: 'png'
});

print('CONUS thumbnail URL:', thumbUrl);
