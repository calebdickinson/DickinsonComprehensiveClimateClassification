// ================
// Europe thumbnail 
// ================

// 1) GAUL Europe country list

var europeCountries = [
  'Albania',
  'Andorra',
  'Austria',
  'Belarus',
  'Belgium',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Kosovo',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Moldova, Republic of',
  'Monaco','Montenegro',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'San Marino',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'The former Yugoslav Republic of Macedonia',
  'Ukraine',
  'U.K. of Great Britain and Northern Ireland',
  'Vatican City'
];

// 2) Admin-0 Europe

var admin0_Europe = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', europeCountries));

// 3) Add Kaliningrad only

var kaliningrad = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', 'Russian Federation'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Kaliningradskaya Oblast'));
  
// 4) Merge geometry

var europeFull = admin0_Europe.merge(kaliningrad);

// 5) Admin-1 borders (include Kaliningrad)

var admin1_Europe = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(
    ee.Filter.or(
      ee.Filter.inList('ADM0_NAME', europeCountries),
      ee.Filter.and(
        ee.Filter.eq('ADM0_NAME', 'Russian Federation'),
        ee.Filter.eq('ADM1_NAME', 'Kaliningrad')
      )
    )
  );

// 6) Land mask (this removes Russia visually)

var europeMask = ee.Image()
  .byte()
  .paint(europeFull, 1)
  .selfMask();

// 7) Climate overlay

var climateRGB_Europe = discreteLand
  .updateMask(europeMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 8) Borders

var admin1RGB_Europe = ee.Image()
  .byte()
  .paint(admin1_Europe, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

var admin0RGB_Europe = ee.Image()
  .byte()
  .paint(europeFull, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite

var compositeEurope = ee.ImageCollection([
  climateRGB_Europe,
  admin1RGB_Europe,
  admin0RGB_Europe
]).mosaic();

// 10) Europe projection (LAEA)

var europeLAEA = ee.Projection(
'PROJCS["Europe_LAEA_Custom",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Lambert_Azimuthal_Equal_Area"],PARAMETER["latitude_of_center",52],PARAMETER["longitude_of_center",10],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["meter",1]]'
);

// 11) Reproject

var compositeProjected_Europe = compositeEurope.reproject({
  crs: europeLAEA,
  scale: 2000
});

// 12) Bounding box

var europeRegion = ee.Geometry.Rectangle(
  [-8.8, 35.2, 34.0, 70.8],
  null,
  false
);

// 13) Thumbnail

var thumbUrlEurope = compositeProjected_Europe.getThumbURL({
  region: europeRegion,
  dimensions: 2400,
  format: 'png',
  crs: europeLAEA
});

print('Europe thumbnail URL (LAEA):', thumbUrlEurope);