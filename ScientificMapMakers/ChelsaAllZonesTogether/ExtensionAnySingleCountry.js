// =======================================================================
// Country thumbnail: climate + admin-0 + admin-1
// =======================================================================

// SET THIS
var countryName = 'Bhutan';

// 1) Admin-0
var admin0 = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', countryName));

var countryBounds = admin0.geometry();

// 2) Admin-1
var admin1 = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', countryName));

// 3) Land mask
var countryMask = ee.Image()
  .byte()
  .paint(admin0, 1)
  .selfMask();

// 4) Climate overlay
var climateRGB = combined
  .updateMask(countryMask)
  .visualize({
    min: Math.min.apply(null, codes),
    max: Math.max.apply(null, codes),
    palette: palette
  });

// 5) Admin-1 borders (gray)
var admin1RGB = ee.Image()
  .byte()
  .paint(admin1, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 6) Admin-0 border (black)
var admin0RGB = ee.Image()
  .byte()
  .paint(admin0, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 7) Composite
var composite = ee.ImageCollection([
  climateRGB,
  admin1RGB,
  admin0RGB
]).mosaic();

// 8) Thumbnail
var thumbUrl = composite.getThumbURL({
  region: countryBounds,
  dimensions: '4250',
  format: 'png'
});
print(countryName + ' thumbnail URL:', thumbUrl);

// Preview
Map.addLayer(composite, {}, countryName, true);
Map.centerObject(countryBounds, 8);
