// ======================================
// 1. LOAD & PREP 2100 RCP8.5 GLOBAL DATA
// ======================================

var future = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2100, 2100, 'year'));

// Convert tasmax and tasmin from Kelvin to Celsius
var tasmax = future.select('tasmax')
                   .map(function(img) {
                     return img.subtract(273.15)
                               .rename('tasmaxC')
                               .copyProperties(img, ['system:time_start']);
                   });
var tasmin = future.select('tasmin')
                   .map(function(img) {
                     return img.subtract(273.15)
                               .rename('tasminC')
                               .copyProperties(img, ['system:time_start']);
                   });

// ===========================================
// 2. BUILD MONTHLY MEANS BY AVERAGING MONTHLY
//    TASMAX AND TASMIN
// ===========================================
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    // filter each month
    var maxMean = tasmax
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    var minMean = tasmin
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    // average the two
    return maxMean.add(minMean)
                  .divide(2)
                  .rename('monthlyMean')
                  .set('month', m);
  })
);

// ===========================================
// 3. EXTRACT HOTTEST & COLDEST MONTHLY MEANS
// ===========================================
var hottestC_global = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

var coldestC_global = monthlyMeans
  .map(function(img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// ===========================================
// 4. CLASSIFY WARM & COLD (Celsius bins)
// ===========================================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where( tC.gte(55).and(tC.lte(60)), 1)  // X4: 55-60 °C
    .where( tC.gte(50).and(tC.lte(55)), 2)  // X3: 50-55 °C
    .where( tC.gte(45).and(tC.lte(50)), 3)  // X2: 45–50 °C
    .where( tC.gte(40).and(tC.lt(45)),  4)  // X1: 40–45 °C
    .where( tC.gte(35).and(tC.lt(40)),  5)  // Z2: 35–40 °C
    .where( tC.gte(30).and(tC.lt(35)),  6)  // Z1: 30–35 °C
    .where( tC.gte(25).and(tC.lt(30)),  7)  // A2: 25–30 °C
    .where( tC.gte(20).and(tC.lt(25)),  8)  // A1: 20–25 °C
    .where( tC.gte(15).and(tC.lt(20)),  9)  // B2: 15–20 °C
    .where( tC.gte(10).and(tC.lt(15)), 10)  // B1: 10–15 °C
    .where( tC.gte(5).and(tC.lt(10)),  11)  // C2: 5–10 °C
    .where( tC.gte(0).and(tC.lt(5)),   12)  // C1: 0–5 °C
    .where( tC.lt(0),                  13)  // Y:  < 0 °C
    .rename('warmZone');
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),   1)  // Z2: 40–50 °C
    .where(tC.gte(30).and(tC.lt(40)),   2)  // Z: 30–40 °C
    .where(tC.gte(20).and(tC.lt(30)),   3)  // A: 20–30 °C
    .where(tC.gte(10).and(tC.lt(20)),   4)  // B: 10–20 °C
    .where(tC.gte(0).and(tC.lt(10)),    5)  // C: 0–10 °C
    .where(tC.gte(-10).and(tC.lt(0)),   6)  // D: –10–0 °C
    .where(tC.gte(-20).and(tC.lt(-10)), 7)  // E: –20––10 °C
    .where(tC.gte(-30).and(tC.lt(-20)), 8)  // F: –30––20 °C
    .where(tC.gte(-40).and(tC.lt(-30)), 9)  // G: –40––30 °C
    .where(tC.lt(-40),                 10)  // Y:  < –40 °C
    .rename('coldZone');
}

var warmComb = classifySummer(hottestC_global);
var coldComb = classifyCold(coldestC_global);


// ===========================================
// 5. BUILD COMBINED CODE & RAINBOW PALETTE
// ===========================================
var combined = warmComb.multiply(10)
    .add(coldComb)
    .rename('combinedZone');

// HSL→HEX converter
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  var c = (1 - Math.abs(2*l - 1)) * s;
  var x = c * (1 - Math.abs((h/60) % 2 - 1));
  var m = l - c/2;
  var r1,g1,b1;
  if      (h < 60)  { r1 = c;  g1 = x;  b1 = 0; }
  else if (h < 120) { r1 = x;  g1 = c;  b1 = 0; }
  else if (h < 180) { r1 = 0;  g1 = c;  b1 = x; }
  else if (h < 240) { r1 = 0;  g1 = x;  b1 = c; }
  else if (h < 300) { r1 = x;  g1 = 0;  b1 = c; }
  else              { r1 = c;  g1 = 0;  b1 = x; }
  var r = Math.round((r1 + m)*255);
  var g = Math.round((g1 + m)*255);
  var b = Math.round((b1 + m)*255);
  return '#' + ((1<<24) + (r<<16) + (g<<8) + b)
                 .toString(16).slice(1);
}

// Build 7-step rainbow hues
var rainbowHues = [];
for (var i = 0; i < 7; i++) {
  rainbowHues.push(i * (360/7));
}

// Generate codes (11×9=99 combinations) & palette
var codes = [], palette = [];
for (var w = 1; w <= 11; w++) {
  for (var c = 2; c <= 10; c++) {
    var code = w*10 + c;
    codes.push(code);
    var hue = rainbowHues[(codes.length - 1) % 7];
    palette.push(hslToHex(hue, 100, 50));
  }
}


// ===========================================
// 6. DISPLAY & UI
// ===========================================
Map.setCenter(0, 20, 2);
Map.addLayer(
  combined,
  {
    min: Math.min.apply(null, codes),
    max: Math.max.apply(null, codes),
    palette: palette
  },
  'Combined Zones',
  true,
  0.5
);

// ——— INFO PANEL & CLICK ———
var info = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '8px',
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});
info.add(ui.Label('Click map for classification'));
var wLbl = ui.Label(), cLbl = ui.Label(), combLbl = ui.Label();
info.add(wLbl).add(cLbl).add(combLbl);
ui.root.add(info);

var summerLetters = {
  1: 'X4 (Extreme Wasteland)',
  2: 'X3 (Extreme Wasteland)',
  3:'X2 (Extreme Wasteland)',
  4:'X1 (Wasteland)',
  5:'Z2 (Very Hot Summer)',
  6:'Z1 (Hot Summer)',
  7:'A2 (Very Warm Summer)',
  8:'A1 (Warm Summer)',
  9:'B2 (Cool Summer)',
  10:'B1 (Cold Summer)',
  11:'C2 (Very Cold Summer)',
  12:'C1 (Freezing Summer)',
  13:'Y (Frigid Summer)', 
  14:''
};
var coldLetters = {
  1: 'Z2 (Uninhabitable)',
  2:'Z (Ultratropical)',
  3:'A (Supertropical)',
  4:'B (Tropical)',
  5:'C (Subtropical)',
  6:'D (Temperate)',
  7:'E (Continental)',
  8:'F (Subarctic)',
  9:'G (Arctic)',
  10:'Y (Superarctic)'
};

Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  coldComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('coldZone').evaluate(function(c) {
    cLbl.setValue(coldLetters[c]||'');
  });
  warmComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('warmZone').evaluate(function(w) {
    wLbl.setValue(summerLetters[w]||'');
  });
});
