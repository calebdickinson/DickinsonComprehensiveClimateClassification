// ----------------------------------------------------
//1. LOAD & PREP 2100 RCP8.5 DATA
// ----------------------------------------------------

// a) NASA/NEX-GDDP for warm/cold
var future = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'rcp85'))
  .filter(ee.Filter.calendarRange(2100, 2100, 'year'));

// Convert tasmax and tasmin from Kelvin to Celsius
var tasmax = future.select('tasmax')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasmaxC')
      .copyProperties(img, ['system:time_start']);
  });
var tasmin = future.select('tasmin')
  .map(function(img) {
    return img
      .subtract(273.15)
      .rename('tasminC')
      .copyProperties(img, ['system:time_start']);
  });

// Build monthly means by averaging tasmax/tasmin
var months = ee.List.sequence(1, 12);
var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    var maxMean = tasmax
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    var minMean = tasmin
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean();
    // daily‐mean → monthly‐mean
    return maxMean.add(minMean)
                  .divide(2)
                  .rename('monthlyMean')
                  .set('month', m);
  })
);

// Extract hottest-month and coldest-month rasters

// Hottest‐month: pick the image with the highest monthlyMean at each pixel
var hottestC_future = monthlyMeans
  .qualityMosaic('monthlyMean')
  .select('monthlyMean')
  .rename('hottestC');

// Coldest‐month: invert, mosaic, then invert back
var coldestC_future = monthlyMeans
  .map(function(img) {
    return img.multiply(-1).copyProperties(img);
  })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// b) NEX-GDDP for aridity
var future2100 = ee.ImageCollection('NASA/NEX-GDDP')
    .filter(ee.Filter.eq('scenario','rcp85'))
    .filter(ee.Filter.calendarRange(2100,2100,'year'));
var prDaily   = future2100.select('pr');
var tmaxDaily = future2100.select('tasmax');
var tminDaily = future2100.select('tasmin');
var months   = ee.List.sequence(1,12);
var daysList = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);

var monthlyClim2100 = ee.ImageCollection(
  months.map(function(m) {
    m = ee.Number(m);
    var prM   = prDaily  .filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var tmaxM = tmaxDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var tminM = tminDaily.filter(ee.Filter.calendarRange(m,m,'month')).mean();
    var days  = ee.Number(daysList.get(m.subtract(1)));
    var rainM = prM.multiply(days).rename('pr');
    var tmeanC = tmaxM.add(tminM)
                      .divide(2)
                      .subtract(273.15)
                      .rename('tmeanC');
    var es   = tmeanC.expression(
      '0.6108 * exp(17.27 * T / (T + 237.3))',
      {T: tmeanC}
    );
    var Ra   = ee.Image.constant(12 * 0.0820);
    var petM = es.multiply(Ra)
                 .multiply(0.1651)
                 .rename('pet');
    return rainM
      .addBands(petM)
      .addBands(tmeanC)
      .set('month', m);
  })
);

var P_ann2100    = monthlyClim2100.select('pr' ).sum().rename('P_ann'),
    PET_ann2100  = monthlyClim2100.select('pet').sum().rename('PET_ann'),
    histHottest  = monthlyClim2100.qualityMosaic('tmeanC').select('tmeanC').rename('histHottest'),
    histColdest  = monthlyClim2100
                     .map(function(img){return img.select('tmeanC').multiply(-1);})
                     .qualityMosaic('tmeanC')
                     .select('tmeanC').multiply(-1).rename('histColdest'),
    validMask    = histColdest.gte(-20).and(histHottest.gte(15)),
    AI2100       = P_ann2100.divide(PET_ann2100).rename('AI'),
    aridBase     = ee.Image(3)
                     .where(AI2100.lt(0.0037),2)
                     .where(AI2100.lt(0.002), 1)
                     .where(AI2100.lt(0.001), 0)
                     .rename('aridity')
                     .updateMask(AI2100.mask())
                     .updateMask(validMask),
    P_hs2100     = monthlyClim2100
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2100       = P_hs2100.divide(P_ann2100).rename('HS_ratio'),
    clim2100     = aridBase
                     .where(aridBase.neq(0).and(HS2100.gte(0.8)),4)
                     .where(aridBase.neq(0).and(HS2100.lt(0.35)),5)
                     .rename('climateClass'),
    clim2100_flip= clim2100
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2100.eq(4)),5)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2100.eq(5)),4);

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

var warmComb = classifySummer(hottestC_future);
var coldComb = classifyCold(coldestC_future);

// --------------------------------------------------
// 3. BUILD COMBINED ZONE (with aridity) + PALETTE
// --------------------------------------------------

// Combined: where validMask, use 100×warm + 10×cold + aridity; else fall back to 10×warm + cold
var combined = ee.Image(0)
  .where(validMask,
         warmComb.multiply(100)
                 .add(coldComb.multiply(10))
                 .add(clim2100_flip))
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
// 4. DISPLAY & UI (patched click panel)
// ————————————————————————

Map.setCenter(0, 20, 2);

// Dropdown filter
var dropdown = ui.Select({
  items: ['All'].concat(codes.map(String)),
  value: 'All',
  onChange: function(v){
    var layer = Map.layers().get(0);
    if(v==='All'){
      layer.setEeObject(combined).setOpacity(0.6);
    } else {
      layer.setEeObject(combined.updateMask(combined.eq(+v))).setOpacity(0.9);
    }
  }
});
var menu = ui.Panel(
  [ui.Label('Filter Combined Code:'), dropdown],
  ui.Panel.Layout.flow('vertical')
);
menu.style().set({
  position:'top-right',
  padding:'8px',
  backgroundColor:'rgba(255,255,255,0.8)'
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
      clim2100_flip.reduceRegion({
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
