// ===========================================
// 1. LOAD & PREP DATA
// ===========================================
var worldClim = ee.Image('WORLDCLIM/V1/BIO');
var coldestF_global = worldClim.select('bio06')
  .divide(10).multiply(9/5).add(32);
var hottestF_global = worldClim.select('bio05')
  .divide(10).multiply(9/5).add(32);

var antarcticaFC = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na','Antarctica'));
var antarcticaMask = ee.Image.constant(1).clip(antarcticaFC).unmask(0);

var era5 = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .select('mean_2m_air_temperature')
  .map(function(img){
    return img.subtract(273.15).multiply(9/5).add(32)
      .rename('tempF')
      .set('system:time_start', img.get('system:time_start'));
  });
var hottestF_ant = era5.reduce(ee.Reducer.max()).rename('hottestF');
var coldestF_ant = era5.reduce(ee.Reducer.min()).rename('coldestF');


// ===========================================
// 2. CLASSIFY WARM & COLD
// ===========================================
function classifySummer(tF) {
  return ee.Image.constant(12)
    .where(tF.gt(120),1).where(tF.gt(110).and(tF.lte(120)),2)
    .where(tF.gt(100).and(tF.lte(110)),3).where(tF.gt(90).and(tF.lte(100)),4)
    .where(tF.gt(80).and(tF.lte(90)),5).where(tF.gt(70).and(tF.lte(80)),6)
    .where(tF.gt(60).and(tF.lte(70)),7).where(tF.gt(50).and(tF.lte(60)),8)
    .where(tF.gt(40).and(tF.lte(50)),9).where(tF.gt(30).and(tF.lte(40)),10)
    .where(tF.lte(30),11)
    .rename('warmZone');
}
function classifyCold(tF) {
  return ee.Image.constant(0)
    .where(tF.gte(90),2).where(tF.gte(70).and(tF.lt(90)),3)
    .where(tF.gte(50).and(tF.lt(70)),4).where(tF.gte(30).and(tF.lt(50)),5)
    .where(tF.gte(10).and(tF.lt(30)),6).where(tF.gte(-10).and(tF.lt(10)),7)
    .where(tF.gte(-30).and(tF.lt(-10)),8).where(tF.gte(-50).and(tF.lt(-30)),9)
    .where(tF.lt(-50),10)
    .rename('coldZone');
}

var warmComb = classifySummer(hottestF_global)
  .updateMask(antarcticaMask.eq(0))
  .blend(classifySummer(hottestF_ant).updateMask(antarcticaMask.eq(1)));
var coldComb = classifyCold(coldestF_global)
  .updateMask(antarcticaMask.eq(0))
  .blend(classifyCold(coldestF_ant).updateMask(antarcticaMask.eq(1)));


// ===========================================
// 3. BUILD COMBINED CODE & RAINBOW PALETTE
// ===========================================
// Combined code = warm*10 + cold
var combined = warmComb.multiply(10).add(coldComb).rename('combinedZone');

// HSL→HEX converter
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  var c = (1 - Math.abs(2*l - 1)) * s;
  var x = c * (1 - Math.abs((h/60) % 2 - 1));
  var m = l - c/2;
  var r1,g1,b1;
  if      (h < 60)  {r1=c; g1=x; b1=0;}
  else if (h < 120) {r1=x; g1=c; b1=0;}
  else if (h < 180) {r1=0; g1=c; b1=x;}
  else if (h < 240) {r1=0; g1=x; b1=c;}
  else if (h < 300) {r1=x; g1=0; b1=c;}
  else              {r1=c; g1=0; b1=x;}
  var r = Math.round((r1 + m)*255);
  var g = Math.round((g1 + m)*255);
  var b = Math.round((b1 + m)*255);
  return '#' + ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
}

// Define 7 rainbow hues
var rainbowHues = [];
for (var i = 0; i < 7; i++) {
  rainbowHues.push(i * (360/7));
}

// Generate codes & palette
var codes = [], palette = [];
for (var w = 1; w <= 11; w++) {
  for (var c = 2; c <= 10; c++) {
    var code = w*10 + c;
    codes.push(code);
    // pick one of 7 rainbow hues in cycle
    var hue = rainbowHues[(codes.length - 1) % 7];
    // full saturation, mid lightness
    palette.push(hslToHex(hue, 100, 50));
  }
}


// ===========================================
// 4. DISPLAY & UI
// ===========================================
Map.setCenter(0, 20, 2);
Map.addLayer(
  combined,
  {min: Math.min.apply(null, codes),
   max: Math.max.apply(null, codes),
   palette: palette},
  'Combined Zones',
  true,
  0.6
);

// LEGEND
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

// INFO PANEL
var info = ui.Panel();
info.style().set({
  position:        'bottom-left',
  padding:         '8px',
  backgroundColor: 'rgba(255,255,255,0.8)'
});
info.add(ui.Label('Click map → warm & cold codes'));
var wLbl = ui.Label(), cLbl = ui.Label(), combLbl = ui.Label();
info.add(wLbl).add(cLbl).add(combLbl);
ui.root.add(info);

var summerLetters = {
  1:'X2',2:'X1',3:'Z2',4:'Z1',
  5:'A2',6:'A1',7:'B2',8:'B1',
  9:'C2',10:'C1',11:'Y',12:''
};
var coldLetters = {
  2:'Z',3:'A',4:'B',5:'C',
  6:'D',7:'E',8:'F',9:'G',10:'Y'
};

Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);

  warmComb.reduceRegion({reducer:ee.Reducer.first(),geometry:pt,scale:10000})
    .get('warmZone').evaluate(function(w){
      wLbl.setValue('Warm: ' + (summerLetters[w]||'') + ' (' + w + ')');
    });

  coldComb.reduceRegion({reducer:ee.Reducer.first(),geometry:pt,scale:10000})
    .get('coldZone').evaluate(function(c){
      cLbl.setValue('Cold: ' + (coldLetters[c]||'') + ' (' + c + ')');
    });

  combined.reduceRegion({reducer:ee.Reducer.first(),geometry:pt,scale:10000})
    .get('combinedZone').evaluate(function(x){
      combLbl.setValue('Combined code: ' + x);
    });
});
