// =======================================================================
// California thumbnail (GAUL FULL — Level 1 + Level 2)
// =======================================================================

// 1) GAUL Level-1 (California state boundary)
var californiaL1 = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'California'));

// 2) GAUL Level-2 (California counties)
var californiaL2 = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'California'));

// 3) Region geometry (simplified to prevent URL overflow)
var californiaRegion = californiaL1
  .geometry();

// 4) Land mask
var californiaMask = ee.Image()
  .byte()
  .paint(californiaL1, 1)
  .selfMask();

// 5) Climate overlay
var climateRGB_CA = combined
  .updateMask(oceanMask.not())
  .updateMask(californiaMask)
  .visualize({
    min: Math.min.apply(null, codes),
    max: Math.max.apply(null, codes),
    palette: palette
  });

// 6) County borders (subtle gray)
var countiesRGB_CA = ee.Image()
  .byte()
  .paint(californiaL2, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 7) State border (black)
var stateRGB_CA = ee.Image()
  .byte()
  .paint(californiaL1, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 8) Composite
var compositeCA = ee.ImageCollection([
  climateRGB_CA,
  countiesRGB_CA,
  stateRGB_CA
]).mosaic();

// 9) Thumbnail
var thumbUrlCA = compositeCA.getThumbURL({
  region: californiaRegion,
  dimensions: 3017,
  format: 'png'
});

print('California thumbnail URL:', thumbUrlCA);

Map.addLayer(compositeCA, {}, 'California', true);