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
                     .where(AI2000.lt(0.0037),2)
                     .where(AI2000.lt(0.002), 1)
                     .where(AI2000.lt(0.001), 0)
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
    .where(tC.gte(45).and(tC.lte(50)),1)
    .where(tC.gte(40).and(tC.lt(45)), 2)
    .where(tC.gte(35).and(tC.lt(40)), 3)
    .where(tC.gte(30).and(tC.lt(35)), 4)
    .where(tC.gte(25).and(tC.lt(30)), 5)
    .where(tC.gte(20).and(tC.lt(25)), 6)
    .where(tC.gte(15).and(tC.lt(20)), 7)
    .where(tC.gte(10).and(tC.lt(15)), 8)
    .where(tC.gte( 5).and(tC.lt(10)), 9)
    .where(tC.gte( 0).and(tC.lt( 5)),10)
    .where(tC.lt(0),11)
    .rename('warmZone');
}
function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(30).and(tC.lt(40)),2)
    .where(tC.gte(20).and(tC.lt(30)),3)
    .where(tC.gte(10).and(tC.lt(20)),4)
    .where(tC.gte( 0).and(tC.lt(10)),5)
    .where(tC.gte(-10).and(tC.lt( 0)),6)
    .where(tC.gte(-20).and(tC.lt(-10)),7)
    .where(tC.gte(-30).and(tC.lt(-20)),8)
    .where(tC.gte(-40).and(tC.lt(-30)),9)
    .where(tC.lt(-40),10)
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
  1:'X2 (Extreme Hyperthermal Summer)',
  2:'X1 (Extreme Hyperthermal)',
  3:'Z2 (Hyperthermal Summer)',
  4:'Z1 (Scorching Hot Summer)',
  5:'A2 (Very Hot Summer)',
  6:'A1 (Hot Summer)',
  7:'B2 (Mild Summer)',
  8:'B1 (Cold Summer)',
  9:'C2 (Very Cold Summer)',
  10:'C1 (Freezing Summer)',
  11:'Y (Frigid Summer)',
  0:''
};

var coldLetters = {
   2:'Z (Ultratropical)',
   3:'A (Supertropical)',
   4:'B (Tropical)',
   5:'C (Subtropical)',
   6:'D (Temperate)',
   7:'E (Continental)',
   8:'F (Subarctic)',
   9:'G (Arctic)',
   10:'Y (Superarctic)',
   0:''
};

var aridityLetters = {
  3:'H (Humid)',  2:'G (Semihumid)', 1:'S (Semiarid)',
  5:'M (Mediterranean)', 4:'W (Monsoon)', 0:'D (Arid Desert)',
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

