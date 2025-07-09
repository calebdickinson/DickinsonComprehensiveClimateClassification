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
    AI2100       = P_ann2100.divide(PET_ann2100).rename('AI'),
    aridBase     = ee.Image(6)
                     .where(AI2100.lt(0.0036),5)
                     .where(AI2100.lt(0.0024), 2)
                     .where(AI2100.lt(0.0012), 1)
                     .rename('aridity'),
    P_hs2100     = monthlyClim2100
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2100       = P_hs2100.divide(P_ann2100).rename('HS_ratio'),
    clim2100     = aridBase
                     .where(aridBase.neq(0).and(HS2100.gte(0.8)),4)
                     .where(aridBase.neq(0).and(HS2100.lt(0.4)),3)
                     .rename('climateClass'),
    clim2100_flip= clim2100
                     .where(ee.Image.pixelLonLat().select('latitude').lt(3).and(clim2100.eq(4)),3)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(4).and(clim2100.eq(3)),4);


function classifySummer(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(45)),  9) // X1: Extreme Hyperthermal Summer
    .where(tC.gte(35).and(tC.lt(40)),  8) // Z2: Hyperthermal Summer
    .where(tC.gte(30).and(tC.lt(35)),  7) // Z1: Scorching Hot Summer
    .where(tC.gte(25).and(tC.lt(30)),  6) // A2: Very Hot Summer
    .where(tC.gte(20).and(tC.lt(25)),  5) // A1: Hot Summer
    .where(tC.gte(15).and(tC.lt(20)),  4) // B2: Mild Summer
    .where(tC.gte(10).and(tC.lt(15)),  3) // B1: Cold Summer
    .where(tC.gte(5).and(tC.lt(10)),   2) // C2: Very Cold Summer
    .where(tC.gte(0).and(tC.lt(5)),    1) // C1: Freezing Summer
    .where(tC.lt(0),                   0) // Y: Frigid Summer
}

function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(20).and(tC.lt(30)),   8) // A: Supertropical
    .where(tC.gte(10).and(tC.lt(20)),   7) // B: Tropical
    .where(tC.gte(0).and(tC.lt(10)),    6) // C: Subtropical
    .where(tC.gte(-10).and(tC.lt(0)),   5) // D: Temperate
    .where(tC.gte(-20).and(tC.lt(-10)), 4) // E: Continental
    .where(tC.gte(-30).and(tC.lt(-20)), 3) // F: Subarctic
    .where(tC.gte(-40).and(tC.lt(-30)), 2) // G: Arctic
    .where(tC.lt(-40),                  1) // Y: Superarctic
}

// classify highest‐month temps
var summerClass = classifySummer(hottestC_future);

// classify lowest‐month temps
var coldClass   = classifyCold(coldestC_future);

// combine (and note: use clim2100_flip, not the undefined clim2000_flip)
var combined = summerClass
  .multiply(100)                
  .add(clim2100_flip.multiply(10))
  .add(coldClass)    
  .rename('combined');
var codeColorMap = {
  
  866: "#339966", //AHA2
  865: "#339966", //AHA1

  766: "#339966", //BHA2
  765: "#339966", //BHA1
  764: "#00FFCC", //BHB2
  
  667: "#009900", //CHZ1
  666: "#33CC33", //CHA2
  665: "#33CC33", //CHA1
  664: "#00FFFF", //CHB2
  
  566: "#00FF00", //DHA2
  565: "#00FF00", //DHA1
  564: "#00FF00", //DHB2
  
  465: "#00FF00", //EHA1
  464: "#06402B", //EHB2
  
  857: "#339966", //AGZ1
  856: "#00CC66", //AGA2
  855: "#00CC66", //AGA1
  
  756: "#00CC66", //BGA2
  755: "#00CC66", //BGA1
  754: "#00FFCC", //BGB2
  
  657: "#009900", //CGZ1
  656: "#33CC33", //CGA2
  655: "#33CC33", //CGA1
  654: "#00FFFF", //CGB2
  
  556: "#88FF88", //DGA2
  555: "#88FF88", //DGA1
  554: "#88FF88", //DGB2
  
  455: "#88FF88", //EGA1
  454: "#06402B", //EGB2
  
  848: "#FF99CC", //AWZ2
  847: "#FF99CC", //AWZ1
  846: "#FF99CC", //AWA2
  845: "#FF99FF", //AWA1
  
  748: "#FF99CC", //BWZ2
  747: "#FF99CC", //BWZ1
  746: "#FF99CC", //BWA2
  745: "#FF99FF", //BWA1
  744: "#FF99FF", //BWB2
  
  646: "#CC66FF", //CWA2
  645: "#CC66FF", //CWA1
  644: "#CC66FF", //CWB2
  
  546: "#AA44CC", //DWA2
  545: "#CBC3E3", //DWA1
  544: "#CBC3E3", //DWB2
  
  446: "#AA44CC", //EWA2
  445: "#CBC3E3", //EWA1
  444: "#CBC3E3", //EWB2
  
  836: "#CCCC00", //AMA2
  
  736: "#CCCC00", //BMA2
  735: "#FFFF00", //BMA1
  734: "#FFFF00", //BMB2
  
  637: "#CCCC00", //CMZ1
  636: "#CCCC00", //CMA2
  635: "#FFFF00", //CMA1
  634: "#FFFF00", //CMB2
  
  536: "#FFDD00", //DMA2
  535: "#DDFF00", //DMA1
  534: "#DDFF00", //DMB2
  
  434: "#DDFF00", //EMB2

  827: "#994D00", //ASZ1
  826: "#994D00", //ASA2
  825: "#FFCC00", //ASA1
  
  728: "#994D00", //BSZ2
  727: "#994D00", //BSZ1
  726: "#994D00", //BSA2
  725: "#FFCC00", //BSA1
  724: "#FFCC00", //BSB2

  627: "#994D00", //CSZ1
  626: "#994D00", //CSA2
  625: "#FFCC00", //CSA1
  624: "#FFCC00", //CSB2
  
  526: "#FF9933", //DSA2
  525: "#FFCC66", //DSA1
  524: "#FFCC66", //DSB2
  
  426: "#FF9933", //ESA2
  425: "#FFCC66", //ESA1
  424: "#FFCC66", //ESB2
  
  818: "#FF0000", //ADZ2
  817: "#FF0000", //ADZ1
  816: "#FF0000", //ADA2
  815: "#FF4444", //ADA1
  
  719: "#000000", //BDX1
  718: "#FF0000", //BDZ2
  717: "#FF0000", //BDZ1
  716: "#FF0000", //BDA2
  715: "#FF4444", //BDA1
  714: "#FF4444", //BDB2
  
  618: "#FF0000", //CDZ2
  617: "#FF0000", //CDZ1
  616: "#FF0000", //CDA2
  615: "#FF4444", //CDA1
  614: "#FF4444", //CDB2
  
  517: "#990000", //DDZ1
  516: "#990000", //DDA2
  515: "#888888", //DDA1
  514: "#888888", //DDB2
  
  416: "#990000", //EDA2
  415: "#888888", //EDA1
  414: "#888888", //EDB2
  
  713: "#00FFCC", //B_B1
  723: "#00FFCC", //B_B1
  733: "#00FFCC", //B_B1
  743: "#00FFCC", //B_B1
  753: "#00FFCC", //B_B1
  763: "#00FFCC", //B_B1
  
  613: "#00FFFF", //C_B1
  623: "#00FFFF", //C_B1
  633: "#00FFFF", //C_B1
  643: "#00FFFF", //C_B1
  653: "#00FFFF", //C_B1
  663: "#00FFFF", //C_B1
  612: "#0D98BA", //C_C2
  622: "#0D98BA", //C_C2
  632: "#0D98BA", //C_C2
  642: "#0D98BA", //C_C2
  652: "#0D98BA", //C_C2
  662: "#0D98BA", //C_C2
  611: "#0D98BA", //C_C1
  621: "#0D98BA", //C_C1
  631: "#0D98BA", //C_C1
  641: "#0D98BA", //C_C1
  651: "#0D98BA", //C_C1
  661: "#0D98BA", //C_C1
  
  513: "#00FFFF", //D_B1
  523: "#00FFFF", //D_B1
  533: "#00FFFF", //D_B1
  543: "#00FFFF", //D_B1
  553: "#00FFFF", //D_B1
  563: "#00FFFF", //D_B1
  512: "#0D98BA", //D_C2
  522: "#0D98BA", //D_C2
  532: "#0D98BA", //D_C2
  542: "#0D98BA", //D_C2
  552: "#0D98BA", //D_C2
  562: "#0D98BA", //D_C2
  511: "#0D98BA", //D_C1
  521: "#0D98BA", //D_C1
  531: "#0D98BA", //D_C1
  541: "#0D98BA", //D_C1
  551: "#0D98BA", //D_C1
  561: "#0D98BA", //D_C1
  510: "#FFC0CB", //D_Y
  520: "#FFC0CB", //D_Y
  530: "#FFC0CB", //D_Y
  540: "#FFC0CB", //D_Y
  550: "#FFC0CB", //D_Y
  560: "#FFC0CB", //D_Y
  
  413: "#06402B", //E_B1
  423: "#06402B", //E_B1
  433: "#06402B", //E_B1
  443: "#06402B", //E_B1
  453: "#06402B", //E_B1
  463: "#06402B", //E_B1
  412: "#808080", //E_C2
  422: "#808080", //E_C2
  432: "#808080", //E_C2
  442: "#808080", //E_C2
  452: "#808080", //E_C2
  462: "#808080", //E_C2
  411: "#808080", //E_C1
  421: "#808080", //E_C1
  431: "#808080", //E_C1
  441: "#808080", //E_C1
  451: "#808080", //E_C1
  461: "#808080", //E_C1
  410: "#FFC0CB", //E_Y
  420: "#FFC0CB", //E_Y
  430: "#FFC0CB", //E_Y
  440: "#FFC0CB", //E_Y
  450: "#FFC0CB", //E_Y
  460: "#FFC0CB", //E_Y
  
  315: "#88FF88", //F_A1
  325: "#88FF88", //F_A1
  335: "#88FF88", //F_A1
  345: "#88FF88", //F_A1
  355: "#88FF88", //F_A1
  365: "#88FF88", //F_A1
  314: "#06402B", //F_B2
  324: "#06402B", //F_B2
  334: "#06402B", //F_B2
  344: "#06402B", //F_B2
  354: "#06402B", //F_B2
  364: "#06402B", //F_B2
  313: "#06402B", //F_B1
  323: "#06402B", //F_B1
  333: "#06402B", //F_B1
  343: "#06402B", //F_B1
  353: "#06402B", //F_B1
  363: "#06402B", //F_B1
  312: "#808080", //F_C2
  322: "#808080", //F_C2
  332: "#808080", //F_C2
  342: "#808080", //F_C2
  352: "#808080", //F_C2
  362: "#808080", //F_C2
  311: "#808080", //F_C1
  321: "#808080", //F_C1
  331: "#808080", //F_C1
  341: "#808080", //F_C1
  351: "#808080", //F_C1
  361: "#808080", //F_C1
  310: "#FFC0CB", //F_Y
  320: "#FFC0CB", //F_Y
  330: "#FFC0CB", //F_Y
  340: "#FFC0CB", //F_Y
  350: "#FFC0CB", //F_Y
  360: "#FFC0CB", //F_Y
  
  214: "#06402B", //G_B2
  224: "#06402B", //G_B2
  234: "#06402B", //G_B2
  244: "#06402B", //G_B2
  254: "#06402B", //G_B2
  264: "#06402B", //G_B2
  213: "#06402B", //G_B1
  223: "#06402B", //G_B1
  233: "#06402B", //G_B1
  243: "#06402B", //G_B1
  253: "#06402B", //G_B1
  263: "#06402B", //G_B1
  212: "#808080", //G_C2
  222: "#808080", //G_C2
  232: "#808080", //G_C2
  242: "#808080", //G_C2
  252: "#808080", //G_C2
  262: "#808080", //G_C2
  211: "#808080", //G_C1
  221: "#808080", //G_C1
  231: "#808080", //G_C1
  241: "#808080", //G_C1
  251: "#808080", //G_C1
  261: "#808080", //G_C1
  210: "#FFC0CB", //G_Y
  220: "#FFC0CB", //G_Y
  230: "#FFC0CB", //G_Y
  240: "#FFC0CB", //G_Y
  250: "#FFC0CB", //G_Y
  260: "#FFC0CB", //G_Y
  
  114: "#06402B", //Y_B2
  124: "#06402B", //Y_B2
  134: "#06402B", //Y_B2
  144: "#06402B", //Y_B2
  154: "#06402B", //Y_B2
  164: "#06402B", //Y_B2
  113: "#06402B", //Y_B1
  123: "#06402B", //Y_B1
  133: "#06402B", //Y_B1
  143: "#06402B", //Y_B1
  153: "#06402B", //Y_B1
  163: "#06402B", //Y_B1
  110: "#FFC0CB", //Y_Y
  120: "#FFC0CB", //Y_Y
  130: "#FFC0CB", //Y_Y
  140: "#FFC0CB", //Y_Y
  150: "#FFC0CB", //Y_Y
  160: "#FFC0CB", //Y_Y

  };

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = combined
  .remap(codes, indices, -1)  // any code not in `codes` → -1 (transparent)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    min:     0,
    max:     indices.length - 1,
    palette: palette
  },
  'Climate',
  true,   // show layer
  0.7     // 70% opacity
);
