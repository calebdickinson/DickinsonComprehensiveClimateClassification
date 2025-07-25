// paste this in address bar and paste this code in new script box
// https://code.earthengine.google.com/

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
                     .where(aridBase.neq(0).and(HS2000.lt(0.4)),5)
                     .rename('climateClass'),
    clim2000_flip= clim2000
                     .where(ee.Image.pixelLonLat().select('latitude').lt(5).and(clim2000.eq(4)),5)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(5).and(clim2000.eq(5)),4);

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
  { name: 'Tokyo–Yokohama, Japan',                       lon: 139.6917,  lat: 35.6895 },
  { name: 'Jakarta, Indonesia',                          lon: 106.8456,  lat: -6.2088 },
  { name: 'Delhi, India',                                lon: 77.1025,   lat: 28.7041 },
  { name: 'Guangzhou–Foshan, China',                     lon: 113.2644,  lat: 23.1291 },
  { name: 'Mumbai, India',                               lon: 72.8777,   lat: 19.0760 },
  { name: 'Manila, Philippines',                         lon: 120.9842,  lat: 14.5995 },
  { name: 'Shanghai, China',                             lon: 121.4737,  lat: 31.2304 },
  { name: 'Seoul–Incheon, South Korea',                  lon: 126.9780,  lat: 37.5665 },
  { name: 'Cairo, Egypt',                                lon: 31.2357,   lat: 30.0444 },
  { name: 'Mexico City, Mexico',                         lon: -99.1332,  lat: 19.4326 },
  { name: 'Kolkata, India',                              lon: 88.3639,   lat: 22.5726 },
  { name: 'São Paulo, Brazil',                           lon: -46.6333,  lat: -23.5505 },
  { name: 'New York, United States',                     lon: -74.0060,  lat: 40.7128 },
  { name: 'Karachi, Pakistan',                           lon: 67.0011,   lat: 24.8607 },
  { name: 'Dhaka, Bangladesh',                           lon: 90.4125,   lat: 23.8103 },
  { name: 'Bangkok, Thailand',                           lon: 100.5018,  lat: 13.7563 },
  { name: 'Beijing, China',                              lon: 116.4074,  lat: 39.9042 },
  { name: 'Moscow, Russia',                              lon: 37.6173,   lat: 55.7558 },
  { name: 'Shenzhen, China',                             lon: 114.0579,  lat: 22.5431 },
  { name: 'Buenos Aires, Argentina',                     lon: -58.3816,  lat: -34.6037 },
  { name: 'Los Angeles, United States',                  lon: -118.2437, lat: 34.0522 },
  { name: 'Johannesburg–Pretoria, South Africa',         lon: 28.0473,   lat: -26.2041 },
  { name: 'Bangalore, India',                            lon: 77.5946,   lat: 12.9716 },
  { name: 'Chengdu, China',                              lon: 104.0668,  lat: 30.5728 },
  { name: 'Ho Chi Minh City, Vietnam',                   lon: 106.6297,  lat: 10.8231 },
  { name: 'Osaka–Kobe–Kyoto, Japan',                     lon: 135.5023,  lat: 34.6937 },
  { name: 'Lagos, Nigeria',                              lon: 3.3792,    lat: 6.5244 },
  { name: 'Istanbul, Turkey',                            lon: 28.9784,   lat: 41.0082 },
  { name: 'Lahore, Pakistan',                            lon: 74.3587,   lat: 31.5204 },
  { name: 'Kinshasa, DR Congo',                          lon: 15.2663,   lat: -4.4419 },
  { name: 'Tehran, Iran',                                lon: 51.3890,   lat: 35.6892 },
  { name: 'Chongqing, China',                            lon: 106.9123,  lat: 29.4316 },
  { name: 'Rio de Janeiro, Brazil',                      lon: -43.1729,  lat: -22.9068 },
  { name: 'Xi’an, China',                                lon: 108.9398,  lat: 34.3416 },
  { name: 'Chennai, India',                              lon: 80.2707,   lat: 13.0827 },
  { name: 'Paris, France',                               lon: 2.3522,    lat: 48.8566 },
  { name: 'Zhengzhou, China',                            lon: 113.6254,  lat: 34.7466 },
  { name: 'Luanda, Angola',                              lon: 13.2894,   lat: -8.8390 },
  { name: 'London, United Kingdom',                      lon: -0.1278,   lat: 51.5074 },
  { name: 'Dongguan, China',                             lon: 113.7518,  lat: 23.0207 },
  { name: 'Lima, Peru',                                  lon: -77.0428,  lat: -12.0464 },
  { name: 'Wuhan, China',                                lon: 114.3055,  lat: 30.5928 },
  { name: 'Bogotá, Colombia',                            lon: -74.0721,  lat: 4.7110 },
  { name: 'Tianjin, China',                              lon: 117.3616,  lat: 39.3434 },
  { name: 'Hyderabad, India',                            lon: 78.4867,   lat: 17.3850 },
  { name: 'Taipei, Taiwan',                              lon: 121.5654,  lat: 25.0330 },
  { name: 'Hangzhou, China',                             lon: 120.1551,  lat: 30.2741 },
  { name: 'Nagoya, Japan',                               lon: 136.9066,  lat: 35.1815 },
  { name: 'Kuala Lumpur, Malaysia',                      lon: 101.6869,  lat: 3.1390 },
  { name: 'Chicago, United States',                      lon: -87.6298,  lat: 41.8781 },
  { name: 'Miami–Fort Lauderdale, FL',                   lon: -80.1918,  lat: 25.7617 },
  { name: 'Houston, TX',                                 lon: -95.3698,  lat: 29.7604 },
  { name: 'Dallas–Fort Worth–Arlington, TX',             lon: -96.7970,  lat: 32.7767 },
  { name: 'Philadelphia, PA–NJ–DE–MD',                   lon: -75.1652,  lat: 39.9526 },
  { name: 'Washington–Arlington, DC–VA–MD',              lon: -77.0369,  lat: 38.9072 },
  { name: 'Atlanta, GA',                                 lon: -84.3880,  lat: 33.7490 },
  { name: 'Boston, MA–NH',                               lon: -71.0589,  lat: 42.3601 },
  { name: 'Phoenix–Mesa–Scottsdale, AZ',                 lon: -112.0740, lat: 33.4484 },
  { name: 'Detroit, MI',                                 lon: -83.0458,  lat: 42.3314 },
  { name: 'Seattle–Tacoma, WA',                          lon: -122.3321, lat: 47.6062 },
  { name: 'San Francisco–Oakland, CA',                   lon: -122.4194, lat: 37.7749 },
  { name: 'San Diego, CA',                               lon: -117.1611, lat: 32.7157 },
  { name: 'Minneapolis–St. Paul, MN',                    lon: -93.2650,  lat: 44.9778 },
  { name: 'Tampa–St. Petersburg, FL',                    lon: -82.4572,  lat: 27.9506 },
  { name: 'Denver–Aurora, CO',                           lon: -104.9903, lat: 39.7392 },
  { name: 'Riverside–San Bernardino, CA',                lon: -117.3962, lat: 33.9533 },
  { name: 'Baltimore, MD',                               lon: -76.6122,  lat: 39.2904 },
  { name: 'Las Vegas–Henderson–Paradise, NV',            lon: -115.1398, lat: 36.1699 },
  { name: 'St. Louis, MO–IL',                            lon: -90.1994,  lat: 38.6270 },
  { name: 'Portland, OR–WA',                             lon: -122.6765, lat: 45.5231 },
  { name: 'San Antonio, TX',                             lon: -98.4936,  lat: 29.4241 },
  { name: 'Sacramento, CA',                              lon: -121.4944, lat: 38.5816 },
  { name: 'Orlando, FL',                                 lon: -81.3792,  lat: 28.5383 },
  { name: 'San Juan, PR',                                lon: -66.1057,  lat: 18.4655 },
  { name: 'San Jose, CA',                                lon: -121.8863, lat: 37.3382 },
  { name: 'Austin, TX',                                  lon: -97.7431,  lat: 30.2672 },
  { name: 'Pittsburgh, PA',                              lon: -79.9959,  lat: 40.4406 },
  { name: 'Cleveland, OH',                               lon: -81.6944,  lat: 41.4993 },
  { name: 'Indianapolis, IN',                            lon: -86.1581,  lat: 39.7684 },
  { name: 'Cincinnati, OH–KY',                           lon: -84.5120,  lat: 39.1031 },
  { name: 'Kansas City, MO–KS',                          lon: -94.5786,  lat: 39.0997 },
  { name: 'Columbus, OH',                                lon: -82.9988,  lat: 39.9612 },
  { name: 'Virginia Beach–Norfolk, VA',                  lon: -75.9779,  lat: 36.8529 },
  { name: 'Charlotte, NC–SC',                            lon: -80.8431,  lat: 35.2271 },
  { name: 'Milwaukee, WI',                               lon: -87.9065,  lat: 43.0389 },
  { name: 'Providence, RI–MA',                           lon: -71.4128,  lat: 41.8240 },
  { name: 'Jacksonville, FL',                            lon: -81.6557,  lat: 30.3322 },
  { name: 'Salt Lake City, UT',                          lon: -111.8910, lat: 40.7608 },
  { name: 'Nashville–Davidson, TN',                      lon: -86.7816,  lat: 36.1627 },
  { name: 'Raleigh, NC',                                 lon: -78.6382,  lat: 35.7796 },
  { name: 'Richmond, VA',                                lon: -77.4360,  lat: 37.5407 },
  { name: 'Memphis, TN–MS–AR',                           lon: -90.0490,  lat: 35.1495 },
  { name: 'Oklahoma City, OK',                           lon: -97.5164,  lat: 35.4676 },
  { name: 'Hartford, CT',                                lon: -72.6851,  lat: 41.7637 },
  { name: 'Louisville/Jefferson County, KY–IN',          lon: -85.7585,  lat: 38.2527 },
  { name: 'New Orleans, LA',                             lon: -90.0715,  lat: 29.9511 },
  { name: 'Buffalo, NY',                                 lon: -78.8784,  lat: 42.8864 },
  { name: 'Montgomery, AL',                              lon: -86.3000,  lat: 32.3668 },
  { name: 'Juneau, AK',                                  lon: -134.4197, lat: 58.3019 },
  { name: 'Little Rock, AR',                             lon: -92.2896,  lat: 34.7465 },
  { name: 'Dover, DE',                                   lon: -75.5244,  lat: 39.1582 },
  { name: 'Tallahassee, FL',                             lon: -84.2807,  lat: 30.4383 },
  { name: 'Honolulu, HI',                                lon: -157.8583, lat: 21.3069 },
  { name: 'Boise, ID',                                   lon: -116.2023, lat: 43.6150 },
  { name: 'Springfield, IL',                             lon: -89.6501,  lat: 39.7817 },
  { name: 'Des Moines, IA',                              lon: -93.6091,  lat: 41.6005 },
  { name: 'Topeka, KS',                                  lon: -95.6890,  lat: 39.0483 },
  { name: 'Frankfort, KY',                               lon: -84.8733,  lat: 38.2009 },
  { name: 'Baton Rouge, LA',                             lon: -91.1871,  lat: 30.4515 },
  { name: 'Augusta, ME',                                 lon: -69.7795,  lat: 44.3106 },
  { name: 'Annapolis, MD',                               lon: -76.4910,  lat: 38.9784 },
  { name: 'Lansing, MI',                                 lon: -84.5555,  lat: 42.7325 },
  { name: 'Jackson, MS',                                 lon: -90.2120,  lat: 32.2988 },
  { name: 'Jefferson City, MO',                          lon: -92.1735,  lat: 38.5767 },
  { name: 'Helena, MT',                                  lon: -112.0360, lat: 46.5884 },
  { name: 'Lincoln, NE',                                 lon: -96.6852,  lat: 40.8136 },
  { name: 'Carson City, NV',                             lon: -119.8164, lat: 39.1638 },
  { name: 'Concord, NH',                                 lon: -71.5376,  lat: 43.2081 },
  { name: 'Trenton, NJ',                                 lon: -74.7430,  lat: 40.2171 },
  { name: 'Santa Fe, NM',                                lon: -105.9378, lat: 35.6870 },
  { name: 'Albany, NY',                                  lon: -73.7562,  lat: 42.6526 },
  { name: 'Bismarck, ND',                                lon: -100.7837, lat: 46.8083 },
  { name: 'Salem, OR',                                   lon: -123.0351, lat: 44.9429 },
  { name: 'Harrisburg, PA',                              lon: -76.8867,  lat: 40.2732 },
  { name: 'Columbia, SC',                                lon: -81.0348,  lat: 34.0007 },
  { name: 'Pierre, SD',                                  lon: -100.3464, lat: 44.3683 },
  { name: 'Montpelier, VT',                              lon: -72.5754,  lat: 44.2601 },
  { name: 'Olympia, WA',                                 lon: -122.8931, lat: 47.0379 },
  { name: 'Charleston, WV',                              lon: -81.6326,  lat: 38.3498 },
  { name: 'Madison, WI',                                 lon: -89.4012,  lat: 43.0731 },
  { name: 'Cheyenne, WY',                                lon: -104.8202, lat: 41.1400 },
  { name: 'Kabul, Afghanistan',                          lon: 69.2075,   lat: 34.5553 },
  { name: 'Tirana, Albania',                             lon: 19.8170,   lat: 41.3275 },
  { name: 'Algiers, Algeria',                            lon: 3.0588,    lat: 36.7538 },
  { name: 'Andorra la Vella, Andorra',                   lon: 1.5218,    lat: 42.5063 },
  { name: 'St. John\'s, Antigua and Barbuda',            lon: -61.8468,  lat: 17.1274 },
  { name: 'Yerevan, Armenia',                            lon: 44.4991,   lat: 40.1792 },
  { name: 'Canberra, Australia',                         lon: 149.1300,  lat: -35.2809 },
  { name: 'Vienna, Austria',                             lon: 16.3738,   lat: 48.2082 },
  { name: 'Baku, Azerbaijan',                            lon: 49.8671,   lat: 40.4093 },
  { name: 'Nassau, Bahamas',                             lon: -77.3504,  lat: 25.0443 },
  { name: 'Manama, Bahrain',                             lon: 50.5861,   lat: 26.2285 },
  { name: 'Bridgetown, Barbados',                        lon: -59.6167,  lat: 13.0975 },
  { name: 'Minsk, Belarus',                              lon: 27.5590,   lat: 53.9006 },
  { name: 'Brussels, Belgium',                           lon: 4.3517,    lat: 50.8503 },
  { name: 'Belmopan, Belize',                            lon: -88.7590,  lat: 17.2514 },
  { name: 'Porto-Novo, Benin',                           lon: 2.6289,    lat: 6.4969 },
  { name: 'Thimphu, Bhutan',                             lon: 89.6390,   lat: 27.4728 },
  { name: 'Sucre, Bolivia',                              lon: -65.2619,  lat: -19.0196 },
  { name: 'Sarajevo, Bosnia and Herzegovina',            lon: 18.4131,   lat: 43.8563 },
  { name: 'Gaborone, Botswana',                          lon: 25.9231,   lat: -24.6282 },
  { name: 'Brasília, Brazil',                            lon: -47.8828,  lat: -15.7939 },
  { name: 'Bandar Seri Begawan, Brunei',                 lon: 114.9398,  lat: 4.9031 },
  { name: 'Sofia, Bulgaria',                             lon: 23.3219,   lat: 42.6977 },
  { name: 'Ouagadougou, Burkina Faso',                   lon: -1.5197,   lat: 12.3714 },
  { name: 'Gitega, Burundi',                             lon: 29.9246,   lat: -3.4264 },
  { name: 'Praia, Cabo Verde',                           lon: -23.5133,  lat: 14.9333 },
  { name: 'Phnom Penh, Cambodia',                        lon: 104.9282,  lat: 11.5564 },
  { name: 'Yaoundé, Cameroon',                           lon: 11.5021,   lat: 3.8480 },
  { name: 'Ottawa, Canada',                              lon: -75.6972,  lat: 45.4215 },
  { name: 'Bangui, Central African Republic',            lon: 18.5582,   lat: 4.3947 },
  { name: 'N\'Djamena, Chad',                            lon: 15.0557,   lat: 12.1348 },
  { name: 'Santiago, Chile',                             lon: -70.6693,  lat: -33.4489 },
  { name: 'Moroni, Comoros',                             lon: 43.2473,   lat: -11.7172 },
  { name: 'Brazzaville, Congo',                          lon: 15.2429,   lat: -4.2634 },
  { name: 'San José, Costa Rica',                        lon: -84.0907,  lat: 9.9281 },
  { name: 'Yamoussoukro, Côte d\'Ivoire',                lon: -5.2893,   lat: 6.8276 },
  { name: 'Zagreb, Croatia',                             lon: 15.9819,   lat: 45.8150 },
  { name: 'Havana, Cuba',                                lon: -82.3666,  lat: 23.1136 },
  { name: 'Nicosia, Cyprus',                             lon: 33.3823,   lat: 35.1856 },
  { name: 'Prague, Czech Republic',                      lon: 14.4378,   lat: 50.0755 },
  { name: 'Copenhagen, Denmark',                         lon: 12.5683,   lat: 55.6761 },
  { name: 'Djibouti, Djibouti',                          lon: 42.5903,   lat: 11.8251 },
  { name: 'Roseau, Dominica',                            lon: -61.3796,  lat: 15.3092 },
  { name: 'Santo Domingo, Dominican Republic',           lon: -69.9312,  lat: 18.4861 },
  { name: 'Quito, Ecuador',                              lon: -78.4678,  lat: -0.1807 },
  { name: 'San Salvador, El Salvador',                   lon: -89.2182,  lat: 13.6929 },
  { name: 'Malabo, Equatorial Guinea',                   lon: 8.7830,    lat: 3.7504 },
  { name: 'Asmara, Eritrea',                             lon: 38.9251,   lat: 15.3229 },
  { name: 'Tallinn, Estonia',                            lon: 24.7536,   lat: 59.4370 },
  { name: 'Mbabane, Eswatini',                           lon: 31.1367,   lat: -26.3054 },
  { name: 'Addis Ababa, Ethiopia',                       lon: 38.7578,   lat: 8.9806 },
  { name: 'Palikir, Federated States of Micronesia',     lon: 158.1610,  lat: 6.9147 },
  { name: 'Suva, Fiji',                                  lon: 178.4501,  lat: -18.1248 },
  { name: 'Helsinki, Finland',                           lon: 24.9384,   lat: 60.1699 },
  { name: 'Libreville, Gabon',                           lon: 9.4673,    lat: 0.4162 },
  { name: 'Banjul, Gambia',                              lon: -16.5790,  lat: 13.4549 },
  { name: 'Tbilisi, Georgia',                            lon: 44.8271,   lat: 41.7151 },
  { name: 'Berlin, Germany',                             lon: 13.4050,   lat: 52.5200 },
  { name: 'Accra, Ghana',                                lon: -0.1870,   lat: 5.6037 },
  { name: 'Athens, Greece',                              lon: 23.7275,   lat: 37.9838 },
  { name: 'St. George\'s, Grenada',                      lon: -61.7488,  lat: 12.0561 },
  { name: 'Guatemala City, Guatemala',                   lon: -90.5069,  lat: 14.6349 },
  { name: 'Conakry, Guinea',                             lon: -13.5784,  lat: 9.6412 },
  { name: 'Bissau, Guinea-Bissau',                       lon: -15.5980,  lat: 11.8590 },
  { name: 'Georgetown, Guyana',                          lon: -58.1553,  lat: 6.8013 },
  { name: 'Port-au-Prince, Haiti',                       lon: -72.3074,  lat: 18.5944 },
  { name: 'Tegucigalpa, Honduras',                       lon: -87.1921,  lat: 14.0723 },
  { name: 'Budapest, Hungary',                           lon: 19.0402,   lat: 47.4979 },
  { name: 'Reykjavík, Iceland',                          lon: -21.9426,  lat: 64.1466 },
  { name: 'Baghdad, Iraq',                               lon: 44.3615,   lat: 33.3128 },
  { name: 'Dublin, Ireland',                             lon: -6.2603,   lat: 53.3498 },
  { name: 'Jerusalem, Israel',                           lon: 35.2137,   lat: 31.7683 },
  { name: 'Rome, Italy',                                 lon: 12.4964,   lat: 41.9028 },
  { name: 'Kingston, Jamaica',                           lon: -76.7936,  lat: 17.9712 },
  { name: 'Amman, Jordan',                               lon: 35.9284,   lat: 31.9454 },
  { name: 'Astana, Kazakhstan',                          lon: 71.4704,   lat: 51.1605 },
  { name: 'Nairobi, Kenya',                              lon: 36.8219,   lat: -1.2921 },
  { name: 'Tarawa, Kiribati',                            lon: 172.9717,  lat: 1.4518 },
  { name: 'Pristina, Kosovo',                            lon: 21.1655,   lat: 42.6629 },
  { name: 'Kuwait City, Kuwait',                         lon: 47.9774,   lat: 29.3759 },
  { name: 'Bishkek, Kyrgyzstan',                         lon: 74.5698,   lat: 42.8746 },
  { name: 'Vientiane, Laos',                             lon: 102.6331,  lat: 17.9757 },
  { name: 'Riga, Latvia',                                lon: 24.1052,   lat: 56.9496 },
  { name: 'Beirut, Lebanon',                             lon: 35.5018,   lat: 33.8938 },
  { name: 'Maseru, Lesotho',                             lon: 27.4869,   lat: -29.3139 },
  { name: 'Monrovia, Liberia',                           lon: -10.8074,  lat: 6.3156 },
  { name: 'Tripoli, Libya',                              lon: 13.1913,   lat: 32.8872 },
  { name: 'Vaduz, Liechtenstein',                        lon: 9.5209,    lat: 47.1410 },
  { name: 'Vilnius, Lithuania',                          lon: 25.2797,   lat: 54.6872 },
  { name: 'Luxembourg, Luxembourg',                      lon: 6.1319,    lat: 49.6116 },
  { name: 'Antananarivo, Madagascar',                    lon: 47.5079,   lat: -18.8792 },
  { name: 'Lilongwe, Malawi',                            lon: 33.7741,   lat: -13.9626 },
  { name: 'Malé, Maldives',                              lon: 73.5093,   lat: 4.1755 },
  { name: 'Bamako, Mali',                                lon: -8.0029,   lat: 12.6392 },
  { name: 'Valletta, Malta',                             lon: 14.5146,   lat: 35.8989 },
  { name: 'Majuro, Marshall Islands',                    lon: 171.1856,  lat: 7.1164 },
  { name: 'Nouakchott, Mauritania',                      lon: -15.9582,  lat: 18.0735 },
  { name: 'Port Louis, Mauritius',                       lon: 57.5020,   lat: -20.1669 },
  { name: 'Chișinău, Moldova',                           lon: 28.8638,   lat: 47.0105 },
  { name: 'Monaco, Monaco',                              lon: 7.4246,    lat: 43.7384 },
  { name: 'Podgorica, Montenegro',                       lon: 19.2594,   lat: 42.4304 },
  { name: 'Rabat, Morocco',                              lon: -6.8361,   lat: 34.0259 },
  { name: 'Maputo, Mozambique',                          lon: 32.5732,   lat: -25.9692 },
  { name: 'Naypyidaw, Myanmar',                          lon: 96.0785,   lat: 19.7633 },
  { name: 'Windhoek, Namibia',                           lon: 17.0658,   lat: -22.5609 },
  { name: 'Yaren, Nauru',                                lon: 166.9209,  lat: -0.5477 },
  { name: 'Kathmandu, Nepal',                            lon: 85.3240,   lat: 27.7172 },
  { name: 'Amsterdam, Netherlands',                      lon: 4.9041,    lat: 52.3676 },
  { name: 'Wellington, New Zealand',                     lon: 174.7762,  lat: -41.2865 },
  { name: 'Managua, Nicaragua',                          lon: -86.2514,  lat: 12.1364 },
  { name: 'Niamey, Niger',                               lon: 2.1254,    lat: 13.5116 },
  { name: 'Abuja, Nigeria',                              lon: 7.3986,    lat: 9.0765 },
  { name: 'Pyongyang, North Korea',                      lon: 125.7625,  lat: 39.0392 },
  { name: 'Skopje, North Macedonia',                     lon: 21.4280,   lat: 41.9973 },
  { name: 'Oslo, Norway',                                lon: 10.7522,   lat: 59.9139 },
  { name: 'Muscat, Oman',                                lon: 58.4059,   lat: 23.5859 },
  { name: 'Islamabad, Pakistan',                         lon: 73.0479,   lat: 33.6844 },
  { name: 'Ngerulmud, Palau',                            lon: 134.6234,  lat: 7.5000 },
  { name: 'Panama City, Panama',                         lon: -79.5199,  lat: 8.9824 },
  { name: 'Port Moresby, Papua New Guinea',              lon: 147.1803,  lat: -9.4438 },
  { name: 'Asunción, Paraguay',                          lon: -57.5759,  lat: -25.2637 },
  { name: 'Warsaw, Poland',                              lon: 21.0122,   lat: 52.2297 },
  { name: 'Lisbon, Portugal',                            lon: -9.1393,   lat: 38.7223 },
  { name: 'Doha, Qatar',                                 lon: 51.5310,   lat: 25.2854 },
  { name: 'Bucharest, Romania',                          lon: 26.1025,   lat: 44.4268 },
  { name: 'Kigali, Rwanda',                              lon: 30.1044,   lat: -1.9706 },
  { name: 'Basseterre, Saint Kitts and Nevis',           lon: -62.7177,  lat: 17.3026 },
  { name: 'Castries, Saint Lucia',                       lon: -60.9875,  lat: 14.0101 },
  { name: 'Kingstown, Saint Vincent and the Grenadines', lon: -61.2240,  lat: 13.1600 },
  { name: 'Apia, Samoa',                                 lon: -171.7656, lat: -13.8314 },
  { name: 'San Marino, San Marino',                      lon: 12.4578,   lat: 43.9424 },
  { name: 'São Tomé, São Tomé and Príncipe',             lon: 6.7273,    lat: 0.3403 },
  { name: 'Riyadh, Saudi Arabia',                        lon: 46.6753,   lat: 24.7136 },
  { name: 'Dakar, Senegal',                              lon: -17.4677,  lat: 14.7167 },
  { name: 'Belgrade, Serbia',                            lon: 20.4489,   lat: 44.7866 },
  { name: 'Victoria, Seychelles',                        lon: 55.4513,   lat: -4.6191 },
  { name: 'Freetown, Sierra Leone',                      lon: -13.2317,  lat: 8.4657 },
  { name: 'Singapore, Singapore',                        lon: 103.8198,  lat: 1.3521 },
  { name: 'Bratislava, Slovakia',                        lon: 17.1077,   lat: 48.1486 },
  { name: 'Ljubljana, Slovenia',                         lon: 14.5058,   lat: 46.0569 },
  { name: 'Honiara, Solomon Islands',                    lon: 159.9729,  lat: -9.4456 },
  { name: 'Mogadishu, Somalia',                          lon: 45.3182,   lat: 2.0469 },
  { name: 'Cape Town, South Africa',                     lon: 18.4241,   lat: -33.9249 },
  { name: 'Bloemfontein, South Africa',                  lon: 26.1596,   lat: -29.0850 },
  { name: 'Juba, South Sudan',                           lon: 31.5825,   lat: 4.8517 },
  { name: 'Madrid, Spain',                               lon: -3.7038,   lat: 40.4168 },
  { name: 'Sri Jayawardenepura Kotte, Sri Lanka',        lon: 79.9167,   lat: 6.9020 },
  { name: 'Khartoum, Sudan',                             lon: 32.5599,   lat: 15.5007 },
  { name: 'Paramaribo, Suriname',                        lon: -55.2038,  lat: 5.8520 },
  { name: 'Stockholm, Sweden',                           lon: 18.0686,   lat: 59.3293 },
  { name: 'Bern, Switzerland',                           lon: 7.4474,    lat: 46.9479 },
  { name: 'Damascus, Syria',                             lon: 36.2765,   lat: 33.5138 },
  { name: 'Dushanbe, Tajikistan',                        lon: 68.7870,   lat: 38.5598 },
  { name: 'Dodoma, Tanzania',                            lon: 35.7516,   lat: -6.1630 },
  { name: 'Dili, Timor-Leste',                           lon: 125.5603,  lat: -8.5569 },
  { name: 'Lomé, Togo',                                  lon: 1.2314,    lat: 6.1725 },
  { name: 'Nukuʻalofa, Tonga',                           lon: -175.2010, lat: -21.1394 },
  { name: 'Port of Spain, Trinidad and Tobago',          lon: -61.5167,  lat: 10.6667 },
  { name: 'Tunis, Tunisia',                              lon: 10.1815,   lat: 36.8065 },
  { name: 'Ankara, Turkey',                              lon: 32.8541,   lat: 39.9208 },
  { name: 'Ashgabat, Turkmenistan',                      lon: 58.3261,   lat: 37.9601 },
  { name: 'Funafuti, Tuvalu',                            lon: 179.2167,  lat: -8.5167 },
  { name: 'Kampala, Uganda',                             lon: 32.5825,   lat: 0.3476 },
  { name: 'Kyiv, Ukraine',                               lon: 30.5234,   lat: 50.4501 },
  { name: 'Dubai, United Arab Emirates',                 lon: 55.2744,   lat: 25.1972 },
  { name: 'Montevideo, Uruguay',                         lon: -56.1645,  lat: -34.9011 },
  { name: 'Tashkent, Uzbekistan',                        lon: 69.2401,   lat: 41.2995 },
  { name: 'Port Vila, Vanuatu',                          lon: 168.3333,  lat: -17.7333 },
  { name: 'Vatican City, Vatican City',                  lon: 12.4534,   lat: 41.9029 },
  { name: 'Caracas, Venezuela',                          lon: -66.9036,  lat: 10.4806 },
  { name: 'Hanoi, Vietnam',                              lon: 105.8342,  lat: 21.0278 },
  { name: 'Sana\'a, Yemen',                              lon: 44.1910,   lat: 15.3694 },
  { name: 'Lusaka, Zambia',                              lon: 28.3228,   lat: -15.3875 },
  { name: 'Harare, Zimbabwe',                            lon: 31.0335,   lat: -17.8252 },
  { name: 'The Valley, Anguilla (UK)',                   lat: 18.2179,   lon: -63.0534 },
  { name: 'Hamilton, Bermuda (UK)',                      lat: 32.2948,   lon: -64.7831 },
  { name: 'Road Town, British Virgin Islands (UK)',      lat: 18.4167,   lon: -64.6167 },
  { name: 'George Town, Cayman Islands (UK)',            lat: 19.3000,   lon: -81.3833 },
  { name: 'Stanley, Falkland Islands (UK)',              lat: -51.6997,  lon: -57.8515 },
  { name: 'Gibraltar, Gibraltar (UK)',                   lat: 36.1408,   lon: -5.3536 },
  { name: 'Brades, Montserrat (UK)',                     lat: 16.7568,   lon: -62.2110 },
  { name: 'Adamstown, Pitcairn Islands (UK)',            lat: -25.0655,  lon: -130.1000 },
  { name: 'Jamestown, St Helena (UK)',                   lat: -15.9360,  lon: -5.7166 },
  { name: 'Cockburn Town, Turks & Caicos (UK)',          lat: 21.4647,   lon: -71.1384 },
  { name: 'Pago Pago, American Samoa (US)',              lat: -14.2756,  lon: -170.7020 },
  { name: 'Hagåtña, Guam (US)',                          lat: 13.4750,   lon: 144.7500 },
  { name: 'Saipan, Northern Mariana Islands (US)',       lat: 15.1778,   lon: 145.7500 },
  { name: 'Charlotte Amalie, U.S. Virgin Islands (US)',  lat: 18.3419,   lon: -64.9307 },
  { name: 'San Juan, Puerto Rico (US)',                  lat: 18.4655,   lon: -66.1057 },
  { name: 'Papeete, French Polynesia (FR)',              lat: -17.5516,  lon: -149.5585 },
  { name: 'Nouméa, New Caledonia (FR)',                  lat: -22.2711,  lon: 166.4489 },
  { name: 'Saint-Pierre, Saint-Pierre & Miquelon (FR)',  lat: 46.7792,   lon: -56.1778 },
  { name: 'Mata-Utu, Wallis & Futuna (FR)',              lat: -13.2815,  lon: -176.1736 },
  { name: 'Nuuk, Greenland (DK)',                        lat: 64.1835,   lon: -51.7216 },
  { name: 'Tórshavn, Faroe Islands (DK)',                lat: 62.0090,   lon: -6.7717 },
  { name: 'Oranjestad, Aruba (NL)',                      lat: 12.5211,   lon: -70.0411 },
  { name: 'Willemstad, Curaçao (NL)',                    lat: 12.1696,   lon: -68.9900 },
  { name: 'Philipsburg, Sint Maarten (NL)',              lat: 18.0265,   lon: -63.0465 },
  { name: 'Kralendijk, Bonaire (NL)',                    lat: 12.1357,   lon: -68.2700 },
  { name: 'The Bottom, Saba (NL)',                       lat: 17.6362,   lon: -63.2260 },
  { name: 'Oranjestad, Sint Eustatius (NL)',             lat: 17.4910,   lon: -62.9734 },
  { name: 'Longyearbyen, Svalbard & Jan Mayen (NO)',     lat: 78.2232,   lon: 15.6267 },
  { name: 'Kingston, Norfolk Island (AU)',               lat: -29.0555,  lon: 167.9611 },
  { name: 'Avarua, Cook Islands (NZ)',                   lat: -21.2125,  lon: -159.7750 },
  { name: 'Alofi, Niue (NZ)',                            lat: -19.0582,  lon: -169.9185 },
  { name: 'Nukunonu, Tokelau (NZ)',                      lat: -9.2167,   lon: -171.8333 },
  { name: 'Ceuta, Ceuta (ES)',                           lat: 35.8882,   lon: -5.3160 },
  { name: 'Melilla, Melilla (ES)',                       lat: 35.1740,   lon: -2.9215 },
  { name: 'Ponta Delgada, Azores (PT)',                  lat: 37.7412,   lon: -25.6756 },
  { name: 'Funchal, Madeira (PT)',                       lat: 32.6669,   lon: -16.9241 },
  { name: 'Hanga Roa, Easter Island (CL)',               lat: -27.1506,  lon: -109.4330 },
  { name: 'Toronto, ON',                                 lon: -79.3832,  lat: 43.6532 },
  { name: 'Ottawa, ON',                                  lon: -75.6972,  lat: 45.4215 },
  { name: 'Mississauga, ON',                             lon: -79.6475,  lat: 43.5890 },
  { name: 'Brampton, ON',                                lon: -79.7576,  lat: 43.7315 },
  { name: 'Hamilton, ON',                                lon: -79.8711,  lat: 43.2557 },
  { name: 'Montreal, QC',                                lon: -73.5673,  lat: 45.5017 },
  { name: 'Quebec City, QC',                             lon: -71.2080,  lat: 46.8139 },
  { name: 'Laval, QC',                                   lon: -73.7454,  lat: 45.6066 },
  { name: 'Gatineau, QC',                                lon: -75.6648,  lat: 45.4765 },
  { name: 'Longueuil, QC',                               lon: -73.5180,  lat: 45.5312 },
  { name: 'Vancouver, BC',                               lon: -123.1207, lat: 49.2827 },
  { name: 'Surrey, BC',                                  lon: -122.8490, lat: 49.1044 },
  { name: 'Burnaby, BC',                                 lon: -122.9805, lat: 49.2488 },
  { name: 'Richmond, BC',                                lon: -123.1360, lat: 49.1666 },
  { name: 'Abbotsford, BC',                              lon: -122.2817, lat: 49.0504 },
  { name: 'Calgary, AB',                                 lon: -114.0719, lat: 51.0447 },
  { name: 'Edmonton, AB',                                lon: -113.4909, lat: 53.5444 },
  { name: 'Red Deer, AB',                                lon: -113.8112, lat: 52.2681 },
  { name: 'Lethbridge, AB',                              lon: -112.8411, lat: 49.6956 },
  { name: 'St. Albert, AB',                              lon: -113.6346, lat: 53.6305 },
  { name: 'Winnipeg, MB',                                lon: -97.1384,  lat: 49.8951 },
  { name: 'Brandon, MB',                                 lon: -99.9537,  lat: 49.8485 },
  { name: 'Steinbach, MB',                               lon: -96.6846,  lat: 49.5215 },
  { name: 'Thompson, MB',                                lon: -97.8558,  lat: 55.7430 },
  { name: 'Portage la Prairie, MB',                      lon: -98.2915,  lat: 49.9728 },
  { name: 'Saskatoon, SK',                               lon: -106.6702, lat: 52.1332 },
  { name: 'Regina, SK',                                  lon: -104.6189, lat: 50.4452 },
  { name: 'Prince Albert, SK',                           lon: -105.7531, lat: 53.2033 },
  { name: 'Moose Jaw, SK',                               lon: -105.5516, lat: 50.3940 },
  { name: 'Swift Current, SK',                           lon: -107.7972, lat: 50.2853 },
  { name: 'Halifax, NS',                                 lon: -63.5752,  lat: 44.6488 },
  { name: 'Cape Breton Regional Municipality, NS',       lon: -60.8964,  lat: 46.2468 },
  { name: 'Truro, NS',                                   lon: -63.2625,  lat: 45.3648 },
  { name: 'New Glasgow, NS',                             lon: -62.6450,  lat: 45.5866 },
  { name: 'Amherst, NS',                                 lon: -64.2048,  lat: 45.8371 },
  { name: 'Moncton, NB',                                 lon: -64.7782,  lat: 46.0878 },
  { name: 'Saint John, NB',                              lon: -66.0590,  lat: 45.2733 },
  { name: 'Fredericton, NB',                             lon: -66.6431,  lat: 45.9636 },
  { name: 'Dieppe, NB',                                  lon: -64.7035,  lat: 46.0893 },
  { name: 'Miramichi, NB',                               lon: -65.5031,  lat: 47.0031 },
  { name: 'St. John\'s, NL',                             lon: -52.7126,  lat: 47.5615 },
  { name: 'Conception Bay South, NL',                    lon: -52.8667,  lat: 47.5333 },
  { name: 'Mount Pearl, NL',                             lon: -52.8190,  lat: 47.5218 },
  { name: 'Paradise, NL',                                lon: -52.8285,  lat: 47.5080 },
  { name: 'Corner Brook, NL',                            lon: -57.9140,  lat: 48.9359 },
  { name: 'Charlottetown, PE',                           lon: -63.1307,  lat: 46.2382 },
  { name: 'Yellowknife, NT',                             lon: -114.3718, lat: 62.4539 },
  { name: 'Hay River, NT',                               lon: -115.7978, lat: 60.8394 },
  { name: 'Inuvik, NT',                                  lon: -133.7168, lat: 68.3601 },
  { name: 'Fort Smith, NT',                              lon: -112.4181, lat: 60.0238 },
  { name: 'Behchoko, NT',                                lon: -114.3813, lat: 62.8032 },
  { name: 'Fort Simpson, NT',                            lon: -122.7271, lat: 61.7488 },
  { name: 'Fort Providence, NT',                         lon: -117.7656, lat: 61.3718 },
  { name: 'Tuktoyaktuk, NT',                             lon: -133.0358, lat: 69.4447 },
  { name: 'Norman Wells, NT',                            lon: -126.8043, lat: 65.2820 },
  { name: 'Fort Good Hope, NT',                          lon: -128.6504, lat: 66.2405 },
  { name: 'Iqaluit, NU',                                 lon: -68.5150,  lat: 63.7467 },
  { name: 'Rankin Inlet, NU',                            lon: -92.0966,  lat: 62.8192 },
  { name: 'Arviat, NU',                                  lon: -94.0608,  lat: 61.1099 },
  { name: 'Cambridge Bay, NU',                           lon: -105.0667, lat: 69.1167 },
  { name: 'Baker Lake, NU',                              lon: -96.0010,  lat: 64.2986 },
  { name: 'Pangnirtung, NU',                             lon: -65.7131,  lat: 66.1440 },
  { name: 'Pond Inlet, NU',                              lon: -70.7439,  lat: 72.6961 },
  { name: 'Igloolik, NU',                                lon: -81.7890,  lat: 69.3648 },
  { name: 'Coral Harbour, NU',                           lon: -83.3680,  lat: 64.1380 },
  { name: 'Qikiqtarjuaq, NU',                            lon: -64.0305,  lat: 67.5459 },
  { name: 'Anchorage, AK',                               lon: -149.8936, lat: 61.21667 },
  { name: 'Fairbanks, AK',                               lon: -147.7231, lat: 64.84361 },
  { name: 'Knik-Fairview, AK',                           lon: -149.5981, lat: 61.52750 },
  { name: 'Badger, AK',                                  lon: -147.4103, lat: 64.80528 },
  { name: 'College, AK',                                 lon: -147.8272, lat: 64.84833 },
  { name: 'North Lakes, AK',                             lon: -149.3019, lat: 61.60750 },
  { name: 'Meadow Lakes, AK',                            lon: -149.6161, lat: 61.59972 },
  { name: 'Wasilla, AK',                                 lon: -149.4525, lat: 61.58167 },
  { name: 'Tanaina, AK',                                 lon: -149.4328, lat: 61.62417 },
  { name: 'Kalifornsky, AK',                             lon: -151.2014, lat: 60.47333 },
  { name: 'Sitka, AK',                                   lon: -135.3347, lat: 57.05333 },
  { name: 'Ketchikan, AK',                               lon: -131.6480, lat: 55.34200 },
  { name: 'Kenai, AK',                                   lon: -151.2297, lat: 60.55861 },
  { name: 'Steele Creek, AK',                            lon: -147.5077, lat: 64.89241 },
  { name: 'Bethel, AK',                                  lon: -161.7558, lat: 60.79222 },
  { name: 'Chena Ridge, AK',                             lon: -147.9283, lat: 64.83167 },
  { name: 'Sterling, AK',                                lon: -150.7978, lat: 60.52972 },
  { name: 'Palmer, AK',                                  lon: -149.1172, lat: 61.60194 },
  { name: 'Gateway, AK',                                 lon: -149.2525, lat: 61.57639 },
  { name: 'Novosibirsk, Russia',                         lon: 82.950,    lat: 55.050 },
  { name: 'Krasnoyarsk, Russia',                         lon: 92.87194,  lat: 56.00889 },
  { name: 'Omsk, Russia',                                lon: 73.36859,  lat: 54.99244 },
  { name: 'Eureka Research Station, NU',                 lon: -85.9500,  lat:  79.98300 },
  { name: 'Primavera Research Station, Antarctica',      lon: -60.95518, lat: -64.155766 },
  { name: 'McMurdo Research Station, Antarctica',        lon: 166.66824, lat: -77.846323 },
  { name: 'Rexburg, ID',                                 lon: -111.7839, lat:  43.82611 },
  { name: 'Carbondale, IL',                              lon:  -89.2203, lat:  37.72640 },
  { name: 'Champaign, IL',                               lon:  -88.2436, lat:  40.11639 },
  { name: 'Ushuaia, Argentina',                          lon:  -68.3031, lat: -54.80194 },
  { name: 'Macquarie Island Research Station',           lon: 158.93889, lat: -54.498889 },
  { name: 'Bird Island Research Station',                lon: -38.04972, lat: -54.000000 },
  { name: 'Duluth, MN',                                  lon: -92.10658, lat: 46.7832722 },
  { name: 'Lutsen, MN',                                  lon: -90.67472, lat: 47.64722   },
  { name: 'Edinburgh of the Seven Seas',                 lon: -12.3116,  lat: -37.0676 },
  { name: 'Adak, AK',                                    lon: -176.636,  lat: 51.872 },
  { name: 'Davis Research Station, Antarctica',          lon: 77.9688,   lat: -68.5763 },
  { name: 'Concordia Research Station, Antarctica',      lon: 123.35,    lat: -75.10   },
  { name: 'Casey Research Station, Antarctica',          lon: 110.52708, lat: -66.28258 },
  { name: 'Ulaanbaatar, Mongolia',                       lon: 106.91856, lat: 47.921230 },
  { name: 'Thunder Bay, ON',                             lon: -89.24611, lat: 48.382221 },
  { name: 'Isachsen Research Station, NU',               lon: -103.4932, lat: 78.776497 },
  { name: 'Tuktoyaktuk, NT',                             lon: -133.0264, lat:  69.43333 },
  { name: 'Prudhoe Bay, AK',                             lon: -148.4614, lat:  70.200523 },
  { name: 'Wainwright, AK',                              lon: -160.0097, lat:  70.6417 },
  { name: 'Utqiagvik, AK',                               lon: -156.7886, lat:  71.290558 },
  { name: 'Yakutsk, Russia',                             lon:  129.7331, lat:  62.0339 },
  { name: 'Ust-Nera, Russia',                            lon: 143.2000,  lat: 64.5667 },
  { name: 'Verkhoyansk, Russia',                         lon: 133.3833,  lat: 67.5500 },
  { name: 'Hulunbuir, China',                            lon: 119.7667,  lat: 49.2167 },
  { name: 'Heard Island and McDonald Islands',           lon: 73.5167,   lat: -53.1000 },
  { name: 'Bourem, Mali',                                lon: -0.3497,   lat: 16.9667 },
  { name: 'Salango Island, Ecuador',                     lon: -80.8583,  lat: -1.5833 },
  { name: 'Sharmokhiya, Iraq',                           lon: 44.7167,   lat: 35.1167 },
  { name: 'Coronado Islands, Mexico',                    lon: -117.3000, lat: 32.4167 },
  { name: 'El Menia, Algeria',                           lon: 3.5333,    lat: 30.5667 },
  { name: 'Comodoro Rivadavia, Argentina',               lon: -67.4975,  lat: -45.8642 },
  { name: 'Aksu City, China',                            lon: 80.2600,   lat: 41.1700 },
  { name: 'Shoshoni, WY',                                lon: -108.1109, lat: 43.2355 },
  { name: 'Yakima, WA',                                  lon: -120.5059, lat: 46.6021 },
  { name: 'Meeteetse, WY',                               lon: -108.8679, lat: 44.1569 },
  { name: 'Bulgan, Mongolia',                            lon: 103.5333,  lat: 48.8167 },
  { name: 'Mandalgovi, Mongolia',                        lon: 106.2667,  lat: 45.7500 },
  { name: 'West Taijinar Lake, China',                   lon: 90.4167,   lat: 37.0667 },
  { name: 'Trincomalee, Sri Lanka',                      lon: 81.2333,   lat: 8.5667 },
  { name: 'Chandrapur, India',                           lon: 79.297,    lat: 19.950 },    
  { name: 'Gujrat, Pakistan',                            lon: 74.0744,   lat: 32.5728 },  
  { name: 'Crystal City, TX',                            lon: -99.82778, lat: 28.68444 }, 
  { name: 'Barcelona, Spain',                            lon: 2.1734,    lat: 41.3851 },  
  { name: 'Sedona, AZ',                                  lon: -111.7611, lat: 34.86972 }, 
  { name: 'Ushmola, Kazakhstan',                         lon: 77.58,     lat: 45.57 }, 
  { name: 'Zhetikara, Kazakhstan',                       lon: 61.2006,   lat: 52.1908 },  
  { name: 'Santo Domingo, Ecuador',                      lon: -79.17194, lat: -0.25417 }, 
  { name: 'Fuzhou, China',                               lon: 119.2964,  lat: 26.0743 },  
  { name: 'Lompoc, CA',                                  lon: -120.4603, lat: 34.64611 }, 
  { name: 'Borujerd, Iran',                              lon: 48.75222,  lat: 33.91111 }, 
  { name: 'Sharistan, Afghanistan',                      lon: 66.47000,  lat: 33.71000 }, 
  { name: 'Kota, India',                                 lon: 75.83,     lat: 25.18 },   
  { name: 'Phungling, Nepal',                            lon: 87.6667,   lat: 27.3500 },  
  { name: 'Longnan, China',                              lon: 104.92184, lat: 33.400685 },
  { name: 'Shenyang, China',                             lon: 123.40000, lat: 41.799999 },
  { name: 'Hengyang, China',                             lon: 112.61888, lat: 26.88946 }, 
  { name: 'Grand Forks, ND',                             lon: -97.08834, lat: 47.9212639 },
  { name: 'Svea Research Station, Antarctica',           lon: -11.21667, lat: -74.583333 },
  { name: 'San José de la Joya, Mexico',                 lon: -101.1357, lat: 25.30750 },
  { name: 'Batman, Turkey',                              lon: 41.1320, lat: 37.8870 },
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
