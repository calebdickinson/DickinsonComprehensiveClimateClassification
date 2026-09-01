Export.image.toDrive({
  image: discreteLand.toInt16(),       // classification codes fit in int16
  description: 'DickinsonClassification_winter_1981_2010',
  folder: 'GEE_exports',
  fileNamePrefix: 'dickinson_winter_1981_2010',
  region: ee.Geometry.Rectangle([-180, -60, 180, 85], null, false), // adjust to your extent
  scale: 1000,                     // meters/pixel — lower = bigger file. CHELSA native ~1km
  crs: 'EPSG:4326',
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});