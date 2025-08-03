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
                     .where(ee.Image.pixelLonLat().select('latitude').lt(5).and(clim2000.eq(4)), 3)
                     .where(ee.Image.pixelLonLat().select('latitude').lt(5).and(clim2000.eq(3)), 4);

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
    
var landMask = ee.Image('NOAA/NGDC/ETOPO1')
  .select('bedrock')
  .gte(0);  // ≥0 m = land (includes ice & lakes)


var codeColorMap = {
  
  866: "#", //AHA2
  865: "#", //AHA1

  766: "#", //BHA2
  765: "#", //BHA1
  764: "#", //BHB2
  
  667: "#", //CHZ1
  666: "#", //CHA2
  665: "#", //CHA1
  664: "#", //CHB2
  
  566: "#", //DHA2
  565: "#", //DHA1
  564: "#", //DHB2
  
  465: "#", //EHA1
  464: "#", //EHB2
  
  857: "#", //AGZ1
  856: "#", //AGA2
  855: "#", //AGA1
  
  756: "#", //BGA2
  755: "#", //BGA1
  754: "#", //BGB2
  
  657: "#", //CGZ1
  656: "#", //CGA2
  655: "#", //CGA1
  654: "#", //CGB2
  
  556: "#", //DGA2
  555: "#", //DGA1
  554: "#", //DGB2
  
  455: "#", //EGA1
  454: "#", //EGB2
  
  848: "#", //AWZ2
  847: "#", //AWZ1
  846: "#", //AWA2
  845: "#", //AWA1
  
  748: "#", //BWZ2
  747: "#", //BWZ1
  746: "#", //BWA2
  745: "#", //BWA1
  744: "#", //BWB2
  
  646: "#", //CWA2
  645: "#", //CWA1
  644: "#", //CWB2
  
  546: "#", //DWA2
  545: "#", //DWA1
  544: "#", //DWB2
  
  446: "#", //EWA2
  445: "#", //EWA1
  444: "#", //EWB2
  
  836: "#", //AMA2
  
  736: "#", //BMA2
  735: "#", //BMA1
  734: "#", //BMB2
  
  636: "#", //CMA2
  635: "#", //CMA1
  634: "#", //CMB2
  
  536: "#", //DMA2
  535: "#", //DMA1
  534: "#", //DMB2
  
  434: "#", //EMB2

  827: "#", //ASZ1
  826: "#", //ASA2
  825: "#", //ASA1
  
  728: "#", //BSZ2
  727: "#", //BSZ1
  726: "#", //BSA2
  725: "#", //BSA1
  724: "#", //BSB2

  627: "#", //CSZ1
  626: "#", //CSA2
  625: "#", //CSA1
  624: "#", //CSB2
  
  526: "#", //DSA2
  525: "#", //DSA1
  524: "#", //DSB2
  
  426: "#", //ESA2
  425: "#", //ESA1
  424: "#", //ESB2
  
  818: "#", //ADZ2
  817: "#", //ADZ1
  816: "#", //ADA2
  815: "#", //ADA1
  
  719: "#", //BDX1
  718: "#", //BDZ2
  717: "#", //BDZ1
  716: "#", //BDA2
  715: "#", //BDA1
  714: "#", //BDB2
  
  618: "#", //CDZ2
  617: "#", //CDZ1
  616: "#", //CDA2
  615: "#", //CDA1
  614: "#", //CDB2
  
  517: "#", //DDZ1
  516: "#", //DDA2
  515: "#", //DDA1
  514: "#", //DDB2
  
  416: "#", //EDA2
  415: "#", //EDA1
  414: "#", //EDB2
  
  713: "#", //B_B1
  723: "#", //B_B1
  733: "#", //B_B1
  743: "#", //B_B1
  753: "#", //B_B1
  763: "#", //B_B1
  
  613: "#", //C_B1
  623: "#", //C_B1
  633: "#", //C_B1
  643: "#", //C_B1
  653: "#", //C_B1
  663: "#", //C_B1
  612: "#", //C_C2
  622: "#", //C_C2
  632: "#", //C_C2
  642: "#", //C_C2
  652: "#", //C_C2
  662: "#", //C_C2
  611: "#", //C_C1
  621: "#", //C_C1
  631: "#", //C_C1
  641: "#", //C_C1
  651: "#", //C_C1
  661: "#", //C_C1
  
  513: "#", //D_B1
  523: "#", //D_B1
  533: "#", //D_B1
  543: "#", //D_B1
  553: "#", //D_B1
  563: "#", //D_B1
  512: "#", //D_C2
  522: "#", //D_C2
  532: "#", //D_C2
  542: "#", //D_C2
  552: "#", //D_C2
  562: "#", //D_C2
  511: "#", //D_C1
  521: "#", //D_C1
  531: "#", //D_C1
  541: "#", //D_C1
  551: "#", //D_C1
  561: "#", //D_C1
  510: "#", //D_Y
  520: "#", //D_Y
  530: "#", //D_Y
  540: "#", //D_Y
  550: "#", //D_Y
  560: "#", //D_Y
  
  413: "#", //E_B1
  423: "#", //E_B1
  433: "#", //E_B1
  443: "#", //E_B1
  453: "#", //E_B1
  463: "#", //E_B1
  412: "#", //E_C2
  422: "#", //E_C2
  432: "#", //E_C2
  442: "#", //E_C2
  452: "#", //E_C2
  462: "#", //E_C2
  411: "#", //E_C1
  421: "#", //E_C1
  431: "#", //E_C1
  441: "#", //E_C1
  451: "#", //E_C1
  461: "#", //E_C1
  410: "#", //E_Y
  420: "#", //E_Y
  430: "#", //E_Y
  440: "#", //E_Y
  450: "#", //E_Y
  460: "#", //E_Y
  
  315: "#", //F_A1
  325: "#", //F_A1
  335: "#", //F_A1
  345: "#", //F_A1
  355: "#", //F_A1
  365: "#", //F_A1
  314: "#", //F_B2
  324: "#", //F_B2
  334: "#", //F_B2
  344: "#", //F_B2
  354: "#", //F_B2
  364: "#", //F_B2
  313: "#", //F_B1
  323: "#", //F_B1
  333: "#", //F_B1
  343: "#", //F_B1
  353: "#", //F_B1
  363: "#", //F_B1
  312: "#", //F_C2
  322: "#", //F_C2
  332: "#", //F_C2
  342: "#", //F_C2
  352: "#", //F_C2
  362: "#", //F_C2
  311: "#", //F_C1
  321: "#", //F_C1
  331: "#", //F_C1
  341: "#", //F_C1
  351: "#", //F_C1
  361: "#", //F_C1
  310: "#", //F_Y
  320: "#", //F_Y
  330: "#", //F_Y
  340: "#", //F_Y
  350: "#", //F_Y
  360: "#", //F_Y
  
  214: "#", //G_B2
  224: "#", //G_B2
  234: "#", //G_B2
  244: "#", //G_B2
  254: "#", //G_B2
  264: "#", //G_B2
  213: "#", //G_B1
  223: "#", //G_B1
  233: "#", //G_B1
  243: "#", //G_B1
  253: "#", //G_B1
  263: "#", //G_B1
  212: "#", //G_C2
  222: "#", //G_C2
  232: "#", //G_C2
  242: "#", //G_C2
  252: "#", //G_C2
  262: "#", //G_C2
  211: "#", //G_C1
  221: "#", //G_C1
  231: "#", //G_C1
  241: "#", //G_C1
  251: "#", //G_C1
  261: "#", //G_C1
  210: "#", //G_Y
  220: "#", //G_Y
  230: "#", //G_Y
  240: "#", //G_Y
  250: "#", //G_Y
  260: "#", //G_Y
  
  114: "#", //Y_B2
  124: "#", //Y_B2
  134: "#", //Y_B2
  144: "#", //Y_B2
  154: "#", //Y_B2
  164: "#", //Y_B2
  113: "#", //Y_B1
  123: "#", //Y_B1
  133: "#", //Y_B1
  143: "#", //Y_B1
  153: "#", //Y_B1
  163: "#", //Y_B1
  110: "#", //Y_Y
  120: "#", //Y_Y
  130: "#", //Y_Y
  140: "#", //Y_Y
  150: "#", //Y_Y
  160: "#", //Y_Y

  };

// 4) Turn map into parallel arrays
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

// 5) Remap → mask → display (one layer only)
var discreteLand = combined
  .remap(codes, indices, -1)  // any code not in `codes` → -1 (transparent)
  .updateMask(landMask)       // drop only true ocean
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {
    min:     0,
    max:     indices.length - 1,
    palette: palette
  },
  'Climate (land only, discrete)',
  true,   // show layer
  0.7     // 70% opacity
);
