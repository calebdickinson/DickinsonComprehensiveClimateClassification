// ==== CHELSA v2.1 tas HOTTEST MONTH climatology (1981–2010) ====
// Your assets live here (must end with '/'):
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';

// CHELSA tas_u16 is in deci-Kelvin (0.1 K) → convert to °C: v*0.1 - 273.15
var imgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

  var raw = ee.Image(id);

  // Minimal: mask only NoData (65535), then convert to °C
  var tempC = raw.updateMask(raw.neq(65535))
                 .multiply(0.1)
                 .subtract(273.15)
                 .rename('monthlyMean')
                 .set('month', m);

  imgs.push(tempC);
}
var monthlyMeans = ee.ImageCollection(imgs);

///////////////////////////////////////////////////////////

// 3) Hottest & coldest month rasters from climatology
var hottestC = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC = monthlyMeans
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// 4) Your classification (unchanged thresholds; now mask-aware)
function classifySummer(tC) {
  // Start with a 0 image but keep only pixels where tC is valid
  var out = ee.Image(0).updateMask(tC.mask());

  // Apply your bins
  out = out.where(tC.gte(50), 10)  // H
           .where(tC.gte(40).and(tC.lt(50)),  9)   // X
           .where(tC.gte(35).and(tC.lt(40)),  8)   // Z2
           .where(tC.gte(30).and(tC.lt(35)),  7)   // Z1
           .where(tC.gte(25).and(tC.lt(30)),  6)   // A2
           .where(tC.gte(20).and(tC.lt(25)),  5)   // A1
           .where(tC.gte(15).and(tC.lt(20)),  4)   // B2
           .where(tC.gte(10).and(tC.lt(15)),  3)   // B1
           .where(tC.gte(5).and(tC.lt(10)),   2)   // C2
           .where(tC.gte(0).and(tC.lt(5)),    1)   // C1
           .where(tC.lt(0),                   0);  // Y

  return out.rename('warmZone');
}

var warmZone = classifySummer(hottestC);

// 5) Color map & display
var codeColorMap = {
  10:"#0000FF",// Hypercaneal Summer
  9:"#000000", // Extreme Hyperthermal Summer
  8:"#550000", // Hyperthermal Summer
  7:"#C71585", // Scorching Hot Summer
  6:"#FF0000", // Very Hot Summer
  5:"#FFA500", // Hot Summer
  4:"#FFFF00", // Mild Summer
  3:"#008000", // Cold Summer
  2:"#0000FF", // Very Cold Summer
  1:"#FF10F0", // Freezing Summer
  0:"#000000"  // Frigid Summer
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = warmZone.remap(codes, indices).rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (WorldClim normals)',
  true, 0.7
);

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