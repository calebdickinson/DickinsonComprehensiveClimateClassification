var era5 = ee.ImageCollection('ECMWF/ERA5/MONTHLY')
  .filterDate('2000-01-01', '2005-12-31')
  .select('mean_2m_air_temperature')
  .map(function(img) {
    return img.subtract(273.15).rename('tempC')
              .set('system:time_start', img.get('system:time_start'));
  });

var months = ee.List.sequence(1, 12);

var monthlyMeans = ee.ImageCollection(
  months.map(function(m) {
    var mImg = era5.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
    return mImg.set('month', m).rename('tempC');
  })
);

var hottestC_global = monthlyMeans.qualityMosaic('tempC')
                                  .select('tempC').rename('hottestC');

var coldestC_global = monthlyMeans
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('tempC')
  .multiply(-1)
  .select('tempC').rename('coldestC');

var hist2000 = ee.ImageCollection('NASA/NEX-GDDP')
  .filter(ee.Filter.eq('scenario', 'historical'))
  .filter(ee.Filter.eq('model', 'ACCESS1-0'))
  .filter(ee.Filter.calendarRange(2000, 2005, 'year'));

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
                  '0.6108 * exp(17.27 * T / (T + 237.3))', {T: tmeanC}
                ),
        Ra    = ee.Image.constant(12 * 0.0820),
        petM  = es.multiply(Ra).multiply(0.1651).rename('pet');
    return rainM.addBands(petM).addBands(tmeanC).set('month', m);
  })
);

var P_ann2000    = monthlyClim2000.select('pr' ).sum().rename('P_ann'),
    PET_ann2000  = monthlyClim2000.select('pet').sum().rename('PET_ann'),
    AI2000       = P_ann2000.divide(PET_ann2000).rename('AI'),
    aridBase     = ee.Image(6) // H: Humid
                     .where(AI2000.lt(0.0036),5) // G: Semihumid
                     .where(AI2000.lt(0.0024),2) // S: Semiarid
                     .where(AI2000.lt(0.0012),1) // D: Arid Desert
                     .rename('aridity'),
    P_hs2000     = monthlyClim2000
                     .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
                     .select('pr').sum().rename('P_highSun'),
    HS2000       = P_hs2000.divide(P_ann2000).rename('HS_ratio'),
    clim2000     = aridBase
                     .where(aridBase.neq(1).and(HS2000.gte(0.8)), 4) // W: Monsoon
                     .where(aridBase.neq(1).and(HS2000.lt(0.4)), 3) // M: Mediterranean
                     .rename('climateClass'),
    clim2000_flip= clim2000
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2000.eq(4)), 3)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(0).and(clim2000.eq(3)), 4);

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
    .rename('warmZone');
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
    .rename('coldZone');
}

var warmComb = classifySummer(hottestC_global),
    coldComb = classifyCold(coldestC_global);

var combined = coldComb
    .multiply(100)                
    .add(clim2000_flip.multiply(10))
    .add(warmComb)    
    .rename('combined');
    
var waterMask = ee.ImageCollection('MODIS/006/MOD44W')
                  .select('water_mask')
                  .first();
var landMask = waterMask.eq(0);
var combinedLand = combined.updateMask(landMask);


var codeColorMap = {
  
  866: "#009090", //AHA2
  865: "#00CACA", //AHA1

  766: "#005500", //BHA2
  765: "#008800", //BHA1
  764: "#00BB00", //BHB2
  
  667: "#005050", //CHZ1
  666: "#009090", //CHA2
  665: "#00CACA", //CHA1
  664: "#00EEEE", //CHB2
  
  566: "#005500", //DHA2
  565: "#008800", //DHA1
  564: "#00BB00", //DHB2
  
  465: "#00CACA", //EHA1
  464: "#00EEEE", //EHB2
  
  857: "#90EE90", //AGZ1
  856: "#90EE90", //AGA2
  855: "#90EE90", //AGA1
  
  756: "#90EE90", //BGA2
  755: "#90EE90", //BGA1
  754: "#90EE90", //BGB2
  
  657: "#90EE90", //CGZ1
  656: "#90EE90", //CGA2
  655: "#90EE90", //CGA1
  654: "#90EE90", //CGB2
  
  556: "#90EE90", //DGA2
  555: "#90EE90", //DGA1
  554: "#90EE90", //DGB2
  
  455: "#90EE90", //EGA1
  454: "#90EE90", //EGB2
  
  848: "#800080", //AWZ2
  847: "#800080", //AWZ1
  846: "#800080", //AWA2
  845: "#800080", //AWA1
  
  748: "#800080", //BWZ2
  747: "#800080", //BWZ1
  746: "#800080", //BWA2
  745: "#800080", //BWA1
  744: "#800080", //BWB2
  
  646: "#800080", //CWA2
  645: "#800080", //CWA1
  644: "#800080", //CWB2
  
  546: "#800080", //DWA2
  545: "#800080", //DWA1
  544: "#800080", //DWB2
  
  446: "#800080", //EWA2
  445: "#800080", //EWA1
  444: "#800080", //EWB2
  
  836: "#FFFF00", //AMA2
  
  736: "#FFFF00", //BMA2
  735: "#FFFF00", //BMA1
  734: "#FFFF00", //BMB2
  
  636: "#FFFF00", //CMA2
  635: "#FFFF00", //CMA1
  634: "#FFFF00", //CMB2
  
  536: "#FFFF00", //DMA2
  535: "#FFFF00", //DMA1
  534: "#FFFF00", //DMB2
  
  434: "#FFFF00", //EMB2

  827: "#FFA500", //ASZ1
  826: "#FFA500", //ASA2
  825: "#FFA500", //ASA1
  
  728: "#FFA500", //BSZ2
  727: "#FFA500", //BSZ1
  726: "#FFA500", //BSA2
  725: "#FFA500", //BSA1
  724: "#FFA500", //BSB2

  627: "#FFA500", //CSZ1
  626: "#FFA500", //CSA2
  625: "#FFA500", //CSA1
  624: "#FFA500", //CSB2
  
  526: "#FFA500", //DSA2
  525: "#FFA500", //DSA1
  524: "#FFA500", //DSB2
  
  426: "#FFA500", //ESA2
  425: "#FFA500", //ESA1
  424: "#FFA500", //ESB2
  
  818: "#FF0000", //ADZ2
  817: "#FF0000", //ADZ1
  816: "#FF0000", //ADA2
  815: "#FF0000", //ADA1
  
  719: "#000000", //BDX1
  718: "#770000", //BDZ2
  717: "#FF0000", //BDZ1
  716: "#FF0000", //BDA2
  715: "#FF0000", //BDA1
  714: "#FF0000", //BDB2
  
  618: "#FF0000", //CDZ2
  617: "#FF0000", //CDZ1
  616: "#FF0000", //CDA2
  615: "#FF0000", //CDA1
  614: "#FF0000", //CDB2
  
  517: "#FF0000", //DDZ1
  516: "#FF0000", //DDA2
  515: "#FF0000", //DDA1
  514: "#FF0000", //DDB2
  
  416: "#FF0000", //EDA2
  415: "#FF0000", //EDA1
  414: "#FF0000", //EDB2
  
  713: "#0000FF", //B_B1
  723: "#0000FF", //B_B1
  733: "#0000FF", //B_B1
  743: "#0000FF", //B_B1
  753: "#0000FF", //B_B1
  763: "#0000FF", //B_B1
  
  613: "#3333FF", //C_B1
  623: "#3333FF", //C_B1
  633: "#3333FF", //C_B1
  643: "#3333FF", //C_B1
  653: "#3333FF", //C_B1
  663: "#3333FF", //C_B1
  612: "#AC6AC5", //C_C2
  622: "#AC6AC5", //C_C2
  632: "#AC6AC5", //C_C2
  642: "#AC6AC5", //C_C2
  652: "#AC6AC5", //C_C2
  662: "#AC6AC5", //C_C2
  611: "#DC5596", //C_C1
  621: "#DC5596", //C_C1
  631: "#DC5596", //C_C1
  641: "#DC5596", //C_C1
  651: "#DC5596", //C_C1
  661: "#DC5596", //C_C1
  
  513: "#5555FF", //D_B1
  523: "#5555FF", //D_B1
  533: "#5555FF", //D_B1
  543: "#5555FF", //D_B1
  553: "#5555FF", //D_B1
  563: "#5555FF", //D_B1
  512: "#C378E0", //D_C2
  522: "#C378E0", //D_C2
  532: "#C378E0", //D_C2
  542: "#C378E0", //D_C2
  552: "#C378E0", //D_C2
  562: "#C378E0", //D_C2
  511: "#FF69B4", //D_C1
  521: "#FF69B4", //D_C1
  531: "#FF69B4", //D_C1
  541: "#FF69B4", //D_C1
  551: "#FF69B4", //D_C1
  561: "#FF69B4", //D_C1
  510: "#888888", //D_Y
  520: "#888888", //D_Y
  530: "#888888", //D_Y
  540: "#888888", //D_Y
  550: "#888888", //D_Y
  560: "#888888", //D_Y
  
  413: "#7777FF", //E_B1
  423: "#7777FF", //E_B1
  433: "#7777FF", //E_B1
  443: "#7777FF", //E_B1
  453: "#7777FF", //E_B1
  463: "#7777FF", //E_B1
  412: "#DD88FF", //E_C2
  422: "#DD88FF", //E_C2
  432: "#DD88FF", //E_C2
  442: "#DD88FF", //E_C2
  452: "#DD88FF", //E_C2
  462: "#DD88FF", //E_C2
  411: "#FF90BB", //E_C1
  421: "#FF90BB", //E_C1
  431: "#FF90BB", //E_C1
  441: "#FF90BB", //E_C1
  451: "#FF90BB", //E_C1
  461: "#FF90BB", //E_C1
  410: "#AAAAAA", //E_Y
  420: "#AAAAAA", //E_Y
  430: "#AAAAAA", //E_Y
  440: "#AAAAAA", //E_Y
  450: "#AAAAAA", //E_Y
  460: "#AAAAAA", //E_Y
  
  315: "#5C4033", //F_A1
  325: "#5C4033", //F_A1
  335: "#5C4033", //F_A1
  345: "#5C4033", //F_A1
  355: "#5C4033", //F_A1
  365: "#5C4033", //F_A1
  314: "#964B00", //F_B2
  324: "#964B00", //F_B2
  334: "#964B00", //F_B2
  344: "#964B00", //F_B2
  354: "#964B00", //F_B2
  364: "#964B00", //F_B2
  313: "#9999FF", //F_B1
  323: "#9999FF", //F_B1
  333: "#9999FF", //F_B1
  343: "#9999FF", //F_B1
  353: "#9999FF", //F_B1
  363: "#9999FF", //F_B1
  312: "#EFBBFF", //F_C2
  322: "#EFBBFF", //F_C2
  332: "#EFBBFF", //F_C2
  342: "#EFBBFF", //F_C2
  352: "#EFBBFF", //F_C2
  362: "#EFBBFF", //F_C2
  311: "#FFB6C1", //F_C1
  321: "#FFB6C1", //F_C1
  331: "#FFB6C1", //F_C1
  341: "#FFB6C1", //F_C1
  351: "#FFB6C1", //F_C1
  361: "#FFB6C1", //F_C1
  310: "#CCCCCC", //F_Y
  320: "#CCCCCC", //F_Y
  330: "#CCCCCC", //F_Y
  340: "#CCCCCC", //F_Y
  350: "#CCCCCC", //F_Y
  360: "#CCCCCC", //F_Y
  
  214: "#AD7842", //G_B2
  224: "#AD7842", //G_B2
  234: "#AD7842", //G_B2
  244: "#AD7842", //G_B2
  254: "#AD7842", //G_B2
  264: "#AD7842", //G_B2
  213: "#BBBBFF", //G_B1
  223: "#BBBBFF", //G_B1
  233: "#BBBBFF", //G_B1
  243: "#BBBBFF", //G_B1
  253: "#BBBBFF", //G_B1
  263: "#BBBBFF", //G_B1
  212: "#E6CCFF", //G_C2
  222: "#E6CCFF", //G_C2
  232: "#E6CCFF", //G_C2
  242: "#E6CCFF", //G_C2
  252: "#E6CCFF", //G_C2
  262: "#E6CCFF", //G_C2
  211: "#FBD9ED", //G_C1
  221: "#FBD9ED", //G_C1
  231: "#FBD9ED", //G_C1
  241: "#FBD9ED", //G_C1
  251: "#FBD9ED", //G_C1
  261: "#FBD9ED", //G_C1
  210: "#EEEEEE", //G_Y
  220: "#EEEEEE", //G_Y
  230: "#EEEEEE", //G_Y
  240: "#EEEEEE", //G_Y
  250: "#EEEEEE", //G_Y
  260: "#EEEEEE", //G_Y
  
  114: "#C4A484", //Y_B2
  124: "#C4A484", //Y_B2
  134: "#C4A484", //Y_B2
  144: "#C4A484", //Y_B2
  154: "#C4A484", //Y_B2
  164: "#C4A484", //Y_B2
  113: "#DDDDFF", //Y_B1
  123: "#DDDDFF", //Y_B1
  133: "#DDDDFF", //Y_B1
  143: "#DDDDFF", //Y_B1
  153: "#DDDDFF", //Y_B1
  163: "#DDDDFF", //Y_B1
  110: "#FFFFFF", //Y_Y
  120: "#FFFFFF", //Y_Y
  130: "#FFFFFF", //Y_Y
  140: "#FFFFFF", //Y_Y
  150: "#FFFFFF", //Y_Y
  160: "#FFFFFF", //Y_Y

  };

var keys    = Object.keys(codeColorMap);                 
var codes   = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(code, idx){ return idx; }); 

// 1. Remap raw combined codes → [0…palette.length−1]
var combinedIndexed = combined.remap(
  /* from */ codes,
  /* to   */ indices,
  /* else */ -1
).rename('classIndex');

// 2. Mask out the oceans on the indexed image
var combinedIndexedLand = combinedIndexed.updateMask(landMask);

// 3. Draw it with palette _and_ 50% opacity
Map.addLayer(
  combinedIndexedLand,
  {
    min:     0,
    max:     indices.length - 1,
    palette: palette
  },
  'Climate (land only, discrete)',
  true,
  0.7   // opacity
);
