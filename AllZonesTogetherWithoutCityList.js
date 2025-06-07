// ----------------------------------------------------
// 1. LOAD & PREP 2000–2005 HISTORICAL DATA
// ----------------------------------------------------

// a) ERA5 for warm/cold
var era5 = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .filterDate('2000-01-01','2005-12-31')
  .select('mean_2m_air_temperature')
  .map(function(img){
    return img.subtract(273.15)
              .rename('tempC')
              .set('system:time_start', img.get('system:time_start'));
  });
var months = ee.List.sequence(1,12);
var monthlyMeans = ee.ImageCollection(
  months.map(function(m){
    var mImg = era5.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    return mImg.set('month',m).rename('tempC');
  })
);
var hottestC_global = monthlyMeans
  .qualityMosaic('tempC')
  .select('tempC').rename('hottestC');
var coldestC_global = monthlyMeans
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('tempC')
  .multiply(-1)
  .select('tempC').rename('coldestC');

// b) NEX-GDDP for aridity
var hist2000 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario','historical'))
  .filter(ee.Filter.eq('model','ACCESS1-0'))
  .filter(ee.Filter.calendarRange(2000,2005,'year'));
var prDaily   = hist2000.select('pr'),
    tmaxDaily = hist2000.select('tasmax'),
    tminDaily = hist2000.select('tasmin'),
    daysList  = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim2000 = ee.ImageCollection(
  months.map(function(m){
    m = ee.Number(m);
    var prM   = prDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        tmaxM = tmaxDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        tminM = tminDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean(),
        days  = ee.Number(daysList.get(m.subtract(1))),
        rainM = prM.multiply(days).rename('pr'),
        tmeanC= tmaxM.add(tminM).divide(2).subtract(273.15).rename('tmeanC'),
        es    = tmeanC.expression(
                  '0.6108 * exp(17.27 * T / (T + 237.3))',{T:tmeanC}
                ),
        Ra    = ee.Image.constant(12 * 0.0820),
        petM  = es.multiply(Ra).multiply(0.1651).rename('pet');
    return rainM.addBands(petM).addBands(tmeanC).set('month',m);
  })
);

var P_ann2000    = monthlyClim2000.select('pr' ).sum().rename('P_ann'),
    PET_ann2000  = monthlyClim2000.select('pet').sum().rename('PET_ann'),
    histHottest  = monthlyClim2000.qualityMosaic('tmeanC').select('tmeanC').rename('histHottest'),
    histColdest  = monthlyClim2000
                     .map(function(img){return img.select('tmeanC').multiply(-1);})
                     .qualityMosaic('tmeanC')
                     .select('tmeanC').multiply(-1).rename('histColdest'),
    validMask    = histColdest.gte(-20).and(histHottest.gte(15)),
    AI2000       = P_ann2000.divide(PET_ann2000).rename('AI'),
    aridBase     = ee.Image(3)
                     .where(AI2000.lt(0.0036),2)
                     .where(AI2000.lt(0.0024), 1)
                     .where(AI2000.lt(0.0012), 0)
                     .rename('aridity')
                     .updateMask(AI2000.mask())
                     .updateMask(validMask),
    P_hs2000     = monthlyClim2000
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2000       = P_hs2000.divide(P_ann2000).rename('HS_ratio'),
    clim2000     = aridBase
                     .where(aridBase.neq(0).and(HS2000.gte(0.8)),4)
                     .where(aridBase.neq(0).and(HS2000.lt(0.35)),5)
                     .rename('climateClass'),
    clim2000_flip= clim2000
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2000.eq(4)),5)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2000.eq(5)),4);

// --------------------------------------------------
// 2. CLASSIFY CLIMATE AND SUMMER ZONES
// --------------------------------------------------
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

var warmComb = classifySummer(hottestC_global),
    coldComb = classifyCold(coldestC_global);

// --------------------------------------------------
// 3. BUILD COMBINED ZONE (with aridity) + PALETTE
// --------------------------------------------------

// Combined: where validMask, use 100×warm + 10×cold + aridity; else fall back to 10×warm + cold
var combined = ee.Image(0)
  .where(validMask,
         warmComb.multiply(100)
                 .add(coldComb.multiply(10))
                 .add(clim2000_flip))
  .where(validMask.not(),
         warmComb.multiply(10).add(coldComb))
  .rename('combinedZone');

// HSL→HEX helper & 7-step rainbow
function hslToHex(h,s,l){
  s/=100; l/=100;
  var c=(1-Math.abs(2*l-1))*s,
      x=c*(1-Math.abs((h/60)%2-1)),
      m=l-c/2,
      r1,g1,b1;
  if(h<60){r1=c; g1=x; b1=0;}
  else if(h<120){r1=x; g1=c; b1=0;}
  else if(h<180){r1=0; g1=c; b1=x;}
  else if(h<240){r1=0; g1=x; b1=c;}
  else if(h<300){r1=x; g1=0; b1=c;}
  else{r1=c; g1=0; b1=x;}
  var r=Math.round((r1+m)*255),
      g=Math.round((g1+m)*255),
      b=Math.round((b1+m)*255);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
var rainbowHues = [];
for(var i=0;i<7;i++) rainbowHues.push(i*(360/7));

// Build code list & matching palette
var codes=[], palette=[], hueI=0;
for(var w=1; w<=11; w++){
  for(var c=2; c<=10; c++){
    // temperature-only code
    var codeNoA = w*10 + c;
    codes.push(codeNoA);
    palette.push(hslToHex(rainbowHues[hueI%7],100,50));
    hueI++;
    // aridity codes 0–5
    for(var a=0; a<=5; a++){
      var codeA = w*100 + c*10 + a;
      codes.push(codeA);
      palette.push(hslToHex(rainbowHues[hueI%7],100,50));
      hueI++;
    }
  }
}

// ————————————————————————
// LABEL LOOKUPS
// ————————————————————————
var summerLetters = {
  1: 'X4 (Extreme Hyperthermal Summer)',
  2: 'X3 (Extreme Hyperthermal Summer)',
  3:'X2 (Extreme Hyperthermal Summer)',
  4:'X1 (Extreme Hyperthermal Summer)',
  5:'Z2 (Hyperthermal Summer)',
  6:'Z1 (Scorching Hot Summer)',
  7:'A2 (Very Hot Summer)',
  8:'A1 (Hot Summer)',
  9:'B2 (Mild Summer)',
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

var aridityLetters = {
  3:'H (Humid)',
  2:'G (Semihumid)',
  1:'S (Semiarid)',
  5:'M (Mediterranean)',
  4:'W (Monsoon)', 
  0:'D (Arid Desert)',
  null:''
};


// ————————————————————————
// 4. DISPLAY & UI
// ————————————————————————

Map.setCenter(0, 20, 2);

// Dropdown filter
var combinedAlpha = {};
Object.keys(summerLetters).forEach(function(wKey) {
  var w = parseInt(wKey, 10);
  if (w === 0) return;
  var wLetter = summerLetters[w].split(' ')[0];
  Object.keys(coldLetters).forEach(function(cKey) {
    var c = parseInt(cKey, 10);
    if (c === 0) return;
    var cLetter = coldLetters[c].split(' ')[0];
    // fallback (no aridity)
    combinedAlpha[w * 10 + c] = cLetter + wLetter;
    // full (with aridity)
    Object.keys(aridityLetters).forEach(function(aKey) {
      var a = parseInt(aKey, 10);
      if (isNaN(a)) return;
      var aLetter = aridityLetters[a].split(' ')[0];
      combinedAlpha[w * 100 + c * 10 + a] = cLetter + aLetter + wLetter;
    });
  });
});
// Reverse lookup map: alpha → numeric code
var alphaToNumber = {};
Object.keys(combinedAlpha).forEach(function(code) {
  alphaToNumber[combinedAlpha[code]] = parseInt(code, 10);
});

// Build dropdown items using alpha codes
var dropdown = ui.Select({
  items: ['All'].concat(Object.keys(combinedAlpha).map(function(code) {
    return combinedAlpha[code];
  })),
  value: 'All',
  onChange: function(val) {
    var layer = Map.layers().get(0);
    if (val === 'All') {
      layer.setEeObject(combined).setOpacity(0.6);
    } else {
      var num = alphaToNumber[val];
      layer.setEeObject(
        combined.updateMask(combined.eq(num))
      ).setOpacity(0.9);
    }
  }
});

var menu = ui.Panel(
  [ui.Label('Filter by climate code'), dropdown],
  ui.Panel.Layout.flow('vertical')
);
menu.style().set({
  position:        'top-right',
  padding:         '8px',
  backgroundColor: 'rgba(255,255,255,0.8)'
});
ui.root.add(menu);


// Add layer
Map.addLayer(
  combined,
  {
    min: Math.min.apply(null,codes),
    max: Math.max.apply(null,codes),
    palette: palette
  },
  'Combined Zones',
  true, 0.5
);


// Build a proper info panel, adding one widget at a time
var info = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '8px',
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});
info.add(ui.Label('Click map for classification', {fontWeight: 'bold'}));

// Create the three value labels
var summerLbl  = ui.Label(''),
    winterLbl  = ui.Label(''),
    aridityLbl = ui.Label('');

// Add each to the panel in turn
info.add(ui.Label(''));           // spacer
info.add(winterLbl);
info.add(aridityLbl);
info.add(summerLbl);

ui.root.add(info);

// Patched click handler: write to those labels, only lookup aridity where validMask is true
Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);

  // 1) Summer lookup
  warmComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('warmZone').evaluate(function(w) {
    summerLbl.setValue(summerLetters[w] || '');
  });

  // 2) Winter lookup
  coldComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('coldZone').evaluate(function(c) {
    winterLbl.setValue(coldLetters[c] || '');
  });

  // 3) Aridity: first check validMask (renamed to "mask")
  validMask.rename('mask').reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('mask').evaluate(function(inZone) {
    if (inZone) {
      // a) inside aridity domain → fetch actual class
      clim2000_flip.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: pt,
        scale: 10000
      }).get('climateClass').evaluate(function(a) {
        aridityLbl.setValue(aridityLetters[a] || '');
      });
    } else {
      // b) outside aridity domain → clear or mark N/A
      aridityLbl.setValue('');
    }
  });
});

// ——————————————————————————
// 5. SAMPLE A LIST OF CITIES, ADD LABELS & SORT (VISUAL TABLE)
// ——————————————————————————

// (a) Define cities
var cityList = [
  
];

// (b) Build mapping of code → human-readable labels
var combinedLabels = {};
Object.keys(summerLetters).forEach(function(wKey) {
  var w = parseInt(wKey, 10);
  if (w === 0) return;
  Object.keys(coldLetters).forEach(function(cKey) {
    var c = parseInt(cKey, 10);
    if (c === 0) return;

    // ←— keep your original 2-digit fallback key
    combinedLabels[w * 10 + c] =
      coldLetters[c] + ', ' + summerLetters[w];

    // ←— ALSO add the forced 3-digit fallback key (aridity = 0)
    combinedLabels[w * 100 + c * 10 + 0] =
      coldLetters[c] + ', ' + summerLetters[w];

    // full codes with real aridity
    Object.keys(aridityLetters).forEach(function(aKey) {
      var a = parseInt(aKey, 10);
      if (isNaN(a)) return;
      combinedLabels[w * 100 + c * 10 + a] =
        coldLetters[c] + ', ' + aridityLetters[a] + ', ' + summerLetters[w];
    });
  });
});
var combinedDict = ee.Dictionary(combinedLabels);

var combinedDict = ee.Dictionary(combinedLabels);

// (c) Create FeatureCollection & sample combinedZone
var cities = ee.FeatureCollection(
  cityList.map(function(c) {
    return ee.Feature(ee.Geometry.Point([c.lon, c.lat]), { name: c.name });
  })
);
var cityClasses = combined
  .select('combinedZone')
  .sampleRegions({
    collection:  cities,
    properties:  ['name'],
    scale:       10000,
    geometries:  false
  })
  .filter(ee.Filter.notNull(['combinedZone']));

// (d) Attach labels + full sortKey
var MAX_COLD = ee.Number(Object.keys(coldLetters).length);
var MAX_WARM = ee.Number(Object.keys(summerLetters).length);
var MAX_ARID = ee.Number(Object.keys(aridityLetters).length).subtract(1);

var processed = cityClasses.map(function(f) {
  var code = ee.Number(f.get('combinedZone')).toInt();

  // detect 2-digit (no‐aridity) codes vs full 3-digit codes
  var isTwoDigit = code.lt(100);

  // summer = tens place for 2-digit, hundreds place for 3-digit
  var w = isTwoDigit
    .multiply(code.divide(10).floor())
    .add(code.gte(100).multiply(code.divide(100).floor()))
    .toInt();
  //  cold = ones place for 2-digit, tens place for 3-digit
  var c = isTwoDigit
    .multiply(code.mod(10))
    .add(code.gte(100).multiply(code.divide(10).mod(10)))
    .toInt();
  // aridity = 0 for 2-digit, ones place for 3-digit
  var a = isTwoDigit
    .multiply(0)
    .add(code.gte(100).multiply(code.mod(10)))
    .toInt();
  // full aridity ranking:
  var arRank = ee.Number(0)
    .add(a.eq(0).multiply(1)) //arid desert
    .add(a.eq(1).multiply(2)) //semiarid
    .add(a.eq(2).multiply(5)) //semihumid
    .add(a.eq(3).multiply(1006)) //humid.
    //1006 IS NOT A MISTAKE.
    //For unknown reasons the code only works correctly if this line is multiplied by 1006 or higher.
    .add(a.eq(4).multiply(4)) //monsoon
    .add(a.eq(5).multiply(3)); //mediterranean

  // composite key: cold is highest‐order, then summer, then aridity
  var sortKey = MAX_COLD.add(1).subtract(c).multiply(1e6)
    .add(MAX_WARM.add(1).subtract(w).multiply(1e3))
    .add(arRank);

  return f.set({
    classification: combinedDict.get(code), 
    sortKey:        sortKey
  });
});

// (e) Sort descending by that key
var sorted = processed.sort('sortKey', false);

// (f) Build and print a UI table for better visuals
var table = ui.Chart.feature.byFeature({
  features:  sorted,
  xProperty: 'name',
  yProperties: ['classification']
})
.setChartType('Table')
.setOptions({
  title:    'City Climate Classifications',
  pageSize: 455,
  hAxis:    { title: 'City' },
  vAxis:    { title: 'Classification' }
});

// (g) items in cityList marked on map
var cityMarkerStyle = {
  color: 'black',
  pointSize: 3,
  pointShape: 'circle'
};
var cityMarkers = cities.style(cityMarkerStyle);
Map.addLayer(cityMarkers, {}, 'City Markers');

print(table);
