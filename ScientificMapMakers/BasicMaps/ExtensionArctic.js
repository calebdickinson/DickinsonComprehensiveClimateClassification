// =======================================================================
// Arctic North Atlantic thumbnail (Greenland + Iceland + Svalbard)
// =======================================================================

// 1) Bounding box (balanced, minimal wasted space)
var arcticNA = ee.Geometry.Rectangle(
  [-75, 58, 35, 85],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) GAUL 2015 exact names
var arcticCountries = [
  'Greenland',
  'Iceland',
  'Svalbard and Jan Mayen Islands'
];

// 3) Admin-0
var admin0_Arctic = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', arcticCountries));
  
// --- Projection ---
var arcticStereo = ee.Projection(
'PROJCS["Arctic_Stereographic_Custom",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Stereographic"],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",-20],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["meter",1]]'
);

// --- Combined land geometry ---
var arcticGeometry = admin0_Arctic
  .geometry()
  .transform(arcticStereo, 1000)   // transform into polar meters
  .simplify(2000);                 // 2 km tolerance ≈ your pixel scale

// 4) Admin-1
var admin1_Arctic = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', arcticCountries));

// 5) Land mask
var arcticMask = ee.Image()
  .byte()
  .paint(admin0_Arctic, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_Arctic = discreteLand
  .updateMask(arcticMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_Arctic = ee.Image()
  .byte()
  .paint(admin1_Arctic, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_Arctic = ee.Image()
  .byte()
  .paint(admin0_Arctic, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeArctic = ee.ImageCollection([
  climateRGB_Arctic,
  admin1RGB_Arctic,
  admin0RGB_Arctic
]).mosaic();

var arcticStereo = ee.Projection(
'PROJCS["Arctic_Stereographic_Custom",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Stereographic"],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",-20],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["meter",1]]'
);

// --- Reproject composite ---
var compositeProjected = compositeArctic.reproject({
  crs: arcticStereo,
  scale: 2000
});

// --- Generate thumbnail using exact land boundary ---
var thumbUrlArctic = compositeProjected.getThumbURL({
  region: arcticGeometry,
  dimensions: 2400,
  format: 'png',
  crs: arcticStereo
});

print('Arctic thumbnail URL (EPSG:3413):', thumbUrlArctic);