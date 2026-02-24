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
var climateRGB = discreteLand
  .visualize({
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