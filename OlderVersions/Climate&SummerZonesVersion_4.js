// ===========================================
// 1. LOAD & PREP DATA
// ===========================================
var worldClim = ee.Image('WORLDCLIM/V1/BIO');
// Convert tenths °C → °C
var coldestC_global = worldClim.select('bio06').divide(10);
var hottestC_global = worldClim.select('bio05').divide(10);

var antarcticaFC = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na','Antarctica'));
var antarcticaMask = ee.Image.constant(1)
  .clip(antarcticaFC)
  .unmask(0);

// ERA5 monthly 2 m temps, K → °C
var era5 = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .select('mean_2m_air_temperature')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tempC')
      .set('system:time_start', img.get('system:time_start'));
  });

var hottestC_ant = era5.reduce(ee.Reducer.max()).rename('hottestC');
var coldestC_ant = era5.reduce(ee.Reducer.min()).rename('coldestC');


// ===========================================
// 2. CLASSIFY WARM & COLD (Celsius bins)
// ===========================================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where( tC.gte(45).and(tC.lte(50)), 1)  // X2: 45–50 °C
    .where( tC.gte(40).and(tC.lt(45)),  2)  // X1: 40–45 °C
    .where( tC.gte(35).and(tC.lt(40)),  3)  // Z2: 35–40 °C
    .where( tC.gte(30).and(tC.lt(35)),  4)  // Z1: 30–35 °C
    .where( tC.gte(25).and(tC.lt(30)),  5)  // A2: 25–30 °C
    .where( tC.gte(20).and(tC.lt(25)),  6)  // A1: 20–25 °C
    .where( tC.gte(15).and(tC.lt(20)),  7)  // B2: 15–20 °C
    .where( tC.gte(10).and(tC.lt(15)),  8)  // B1: 10–15 °C
    .where( tC.gte(5).and(tC.lt(10)),   9)  // C2: 5–10 °C
    .where( tC.gte(0).and(tC.lt(5)),   10)  // C1: 0–5 °C
    .where( tC.lt(0),                  11)  // Y:  < 0 °C
    .rename('warmZone');
}

function classifyCold(tC) {
  return ee.Image.constant(0)
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

var warmComb = classifySummer(hottestC_global)
  .updateMask(antarcticaMask.eq(0))
  .blend(classifySummer(hottestC_ant)
    .updateMask(antarcticaMask.eq(1)));

var coldComb = classifyCold(coldestC_global)
  .updateMask(antarcticaMask.eq(0))
  .blend(classifyCold(coldestC_ant)
    .updateMask(antarcticaMask.eq(1)));


// ===========================================
// 3. BUILD COMBINED CODE & RAINBOW PALETTE
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
// 4. DISPLAY & UI
// ===========================================
Map.setCenter(0, 20, 2);
// ——— FILTER MENU ———
var selectLabel = ui.Label('Show only one climate code:');
var codeList = ['All'].concat(codes.map(String));
var dropdown = ui.Select({
  items: codeList,
  value: 'All',
  onChange: function(val) {
    var layer = Map.layers().get(0);
    if (val === 'All') {
      layer.setOpacity(0.6);
      layer.setEeObject(combined);
    } else {
      var selectedCode = parseInt(val, 10);
      var filtered = combined.updateMask(combined.eq(selectedCode));
      layer.setOpacity(0.9);
      layer.setEeObject(filtered);
    }
  }
});
var menuPanel = ui.Panel([selectLabel, dropdown], ui.Panel.Layout.flow('vertical'));
menuPanel.style().set({
  position: 'top-right',
  padding: '8px',
  backgroundColor: 'rgba(255,255,255,0.8)'
});
ui.root.add(menuPanel);

Map.addLayer(
  combined,
  {
    min: Math.min.apply(null, codes),
    max: Math.max.apply(null, codes),
    palette: palette
  },
  'Combined Zones',
  true,
  0.6
);

// ——— LEGEND ———
function addLegend(palette, codes, title, position) {
  var legend = ui.Panel();
  legend.style().set({
    position:        position,
    padding:         '8px 15px',
    backgroundColor: 'rgba(255,255,255,0.8)'
  });
  legend.add(ui.Label(title, {fontWeight:'bold'}));
  codes.forEach(function(code, i) {
    var box   = ui.Label('', {
      backgroundColor: palette[i],
      padding:         '8px',
      margin:          '0 4px 0 0'
    });
    var label = ui.Label(code.toString(), {margin: '0 0 0 4px'});
    legend.add(ui.Panel([box, label], ui.Panel.Layout.Flow('horizontal')));
  });
  ui.root.add(legend);
}
addLegend(palette, codes, 'w*10 + c code', 'bottom-right');

// ——— INFO PANEL & CLICK ———
var info = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '8px',
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});
info.add(ui.Label('Click map → warm & cold codes'));
var wLbl = ui.Label(), cLbl = ui.Label(), combLbl = ui.Label();
info.add(wLbl).add(cLbl).add(combLbl);
ui.root.add(info);

var summerLetters = {
  1:'X2', 2:'X1', 3:'Z2', 4:'Z1',
  5:'A2', 6:'A1', 7:'B2', 8:'B1',
  9:'C2',10:'C1',11:'Y', 12:''
};
var coldLetters = {
  2:'Z',3:'A',4:'B',5:'C',
  6:'D',7:'E',8:'F',9:'G',10:'Y'
};

Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  warmComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('warmZone').evaluate(function(w) {
    wLbl.setValue('Warm: ' + (summerLetters[w]||'') + ' (' + w + ')');
  });
  coldComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('coldZone').evaluate(function(c) {
    cLbl.setValue('Cold: ' + (coldLetters[c]||'') + ' (' + c + ')');
  });
  combined.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('combinedZone').evaluate(function(x) {
    combLbl.setValue('Combined code: ' + x);
  });
});
