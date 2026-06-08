// =======================================================================
// State thumbnail: climate + admin-1 + admin-2
// =======================================================================

var countryName = 'Canada';
var stateName = 'Quebec / Québec';

// 1) Admin-1 (state boundary)
var admin1 = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', countryName))
  .filter(ee.Filter.eq('ADM1_NAME', stateName));
var stateBounds = admin1.geometry();

// 2) Admin-2 (counties)
var admin2 = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', countryName))
  .filter(ee.Filter.eq('ADM1_NAME', stateName));

// 3) Land mask
var stateMask = ee.Image()
  .byte()
  .paint(admin1, 1)
  .selfMask();

// 4) Climate overlay
var climateRGB = combined
  .updateMask(stateMask)
  .visualize({
    min: Math.min.apply(null, codes),
    max: Math.max.apply(null, codes),
    palette: palette
  });

// 5) Admin-2 borders (counties, gray)
var admin2RGB = ee.Image()
  .byte()
  .paint(admin2, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 6) Admin-1 border (state, black)
var admin1RGB = ee.Image()
  .byte()
  .paint(admin1, 1, 3)
  .visualize({
    palette: ['#000000']
  });

// 7) Composite
var composite = ee.ImageCollection([
  climateRGB,
  admin2RGB,
  admin1RGB
]).mosaic();

// 8) Thumbnail
var thumbUrl = composite.getThumbURL({
  region: stateBounds,
  dimensions: '3250',
  format: 'png'
});
print(stateName + ' thumbnail URL:', thumbUrl);

// Preview
Map.addLayer(composite, {}, stateName, true);
Map.centerObject(stateBounds, 8);
