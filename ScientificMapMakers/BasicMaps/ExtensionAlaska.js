// =======================================================================
// Alaska thumbnail (GAUL FULL — Level 1 + Level 2)
// Projection: Alaska Albers (EPSG:3338)
// =======================================================================

// 1) GAUL Level-1 (Alaska state boundary)
var alaskaL1 = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Alaska'));

// 2) GAUL Level-2 (Alaska boroughs / census areas)
var alaskaL2 = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Alaska'));

// 3) Alaska Albers projection
var alaskaAlbers = ee.Projection('EPSG:3338');

// 4) Simplified projected geometry (prevents URL overflow)
var alaskaRegion = alaskaL1
  .geometry()
  .transform(alaskaAlbers, 1000)
  .simplify(2000);   // 2 km tolerance ≈ pixel scale

// 5) Strict land mask
var alaskaMask = ee.Image()
  .byte()
  .paint(alaskaL1, 1)
  .selfMask();

// 6) Climate overlay (already defined as discreteLand)
var climateRGB_Alaska = discreteLand
  .updateMask(alaskaMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Level-2 borders (subtle gray)
var level2RGB = ee.Image()
  .byte()
  .paint(alaskaL2, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Level-1 border (strong black)
var level1RGB = ee.Image()
  .byte()
  .paint(alaskaL1, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeAlaska = ee.ImageCollection([
  climateRGB_Alaska,
  level2RGB,
  level1RGB
]).mosaic();

// 10) Reproject to Alaska Albers (good visual scale)
var compositeAlaska_Albers = compositeAlaska.reproject({
  crs: alaskaAlbers,
  scale: 2000   // 2 km per pixel
});

// 11) Generate thumbnail (max safe resolution you discovered)
var thumbUrlAlaska = compositeAlaska_Albers.getThumbURL({
  region: alaskaRegion,
  dimensions: 2964,   // experimentally safe maximum
  format: 'png',
  crs: 'EPSG:3338'
});

print('Alaska thumbnail URL (Albers):', thumbUrlAlaska);

// Optional preview
Map.addLayer(compositeAlaska_Albers, {}, 'Alaska (Albers)', true);
Map.centerObject(alaskaL1, 4);