// =======================================================================
// Africa thumbnail (Geographical Africa — FULL GAUL)
// =======================================================================

// 1) Expanded Africa bounding box (includes all surrounding islands)
var africa = ee.Geometry.Rectangle(
  [-26, -36, 58, 38],   // lon_min, lat_min, lon_max, lat_max
  null,
  false
);

// 2) Geographical Africa (GAUL 2015 exact names)
var africanCountries = [
  // Mainland
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Congo',
  "Côte d'Ivoire",
  'Democratic Republic of the Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Ethiopia',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Malawi',
  'Mali',
  'Mauritania',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Rwanda',
  'Senegal',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Swaziland',
  'Togo',
  'Tunisia',
  'Uganda',
  'United Republic of Tanzania',
  'Zambia',
  'Zimbabwe',
  'Western Sahara',

  // Major islands
  'Madagascar',
  'Cape Verde',
  'Mauritius',
  'Seychelles',
  'Comoros',
  'Sao Tome and Principe',
  'Mayotte',
  'Réunion',
  'Saint Helena',

  // French Indian Ocean micro-territories
  'Bassas da India',
  'Europa Island',
  'Glorioso Island',
  'Juan de Nova Island',
  'Tromelin Island',

  // ✅ Disputed areas (GAUL separate ADM0 features)
  'Abyei',
  'Hala\'ib triangle',
  'Ilemi triangle',
  "Ma'tan al-Sarra"
];

// 3) Admin-0 (FULL GAUL)
var admin0_Africa = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', africanCountries));

// 4) Admin-1
var admin1_Africa = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.inList('ADM0_NAME', africanCountries));

// 5) Land mask
var africaMask = ee.Image()
  .byte()
  .paint(admin0_Africa, 1)
  .selfMask();

// 6) Climate overlay
var climateRGB_Africa = discreteLand
  .updateMask(africaMask)
  .visualize({
    min: 0,
    max: indices.length - 1,
    palette: palette
  });

// 7) Admin-1 borders (gray)
var admin1RGB_Africa = ee.Image()
  .byte()
  .paint(admin1_Africa, 1, 1)
  .visualize({
    palette: ['#888888'],
    opacity: 0.5
  });

// 8) Admin-0 borders (black)
var admin0RGB_Africa = ee.Image()
  .byte()
  .paint(admin0_Africa, 1, 2)
  .visualize({
    palette: ['#000000']
  });

// 9) Composite
var compositeAfrica = ee.ImageCollection([
  climateRGB_Africa,
  admin1RGB_Africa,
  admin0RGB_Africa
]).mosaic();

// 10) Aspect-correct thumbnail
// Bounding box width ≈ 85°, height ≈ 80°
// Ratio ≈ 1.06 → nearly square
var thumbUrlAfrica = compositeAfrica.getThumbURL({
  region: africa,
  dimensions: '3085x2718',
  format: 'png'
});

print('Africa (Geographical) thumbnail URL:', thumbUrlAfrica);

// Optional preview
Map.addLayer(compositeAfrica, {}, 'Africa (Geographical)', true);
Map.centerObject(africa, 3);
