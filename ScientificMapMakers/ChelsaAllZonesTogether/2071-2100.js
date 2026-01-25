// === CHELSA UKESM ssp858 (2071–2100)

// ---------- Assets & constants ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID  = ASSET_PREFIX + 'CHELSA_pet_penman_mean_2071-2100'; // u16 mean PET

var NODATA_U16 = 65535;
var SCALE_PR   = 0.1;  // CHELSA pr_u16: 0.1 → mm/month
var SCALE_PET  = 1;  // Should be 1 for projections and 0.1 in baseline due to unit conversion mistake during preprocessing

// ---------- Months helper ----------
var months = ee.List.sequence(1, 12);

// ---------- Monthly mean temperature (°C) from CHELSA tas_u16 (0.1 K) ----------
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2071_2100_norm';

  var raw = ee.Image(id);
  var tempC = raw
    .updateMask(raw.neq(NODATA_U16)) // mask UInt16 NoData
    .multiply(0.1)                   // 0.1 K
    .subtract(273.15)                // → °C
    .rename('tmeanC')
    .set('month', m);

  tasImgs.push(tempC);
}
var monthlyClim = ee.ImageCollection(tasImgs);

// ---------- Hottest & coldest (°C) ----------
var hottestC = monthlyClim
  .qualityMosaic('tmeanC')
  .select('tmeanC')
  .rename('hottestC');

var coldestC = monthlyClim
  .map(function (img) { return img.select('tmeanC').multiply(-1).copyProperties(img); })
  .qualityMosaic('tmeanC')
  .multiply(-1)
  .select('tmeanC')
  .rename('coldestC');

// Aridity not evaluated due to cold
var coldCond = hottestC.lt(15).or(coldestC.lt(-20));

// ---------- Monthly precipitation from CHELSA pr_u16 (0.1 → mm/month) ----------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn  = (n < 10 ? '0' + n : '' + n);
  var pid = ASSET_PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' + nn + '_2071_2100_norm';

  var rawPr = ee.Image(pid);
  var pr = rawPr
    .updateMask(rawPr.neq(NODATA_U16))
    .multiply(SCALE_PR)   // → mm/month
    .rename('pr')
    .set('month', n);

  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ---------- PET mean (mm/month) from CHELSA uploaded asset ----------
var petRaw    = ee.Image(PET_MEAN_ID);
var petMasked = petRaw.updateMask(petRaw.neq(NODATA_U16));
var petMeanMm = petMasked.multiply(SCALE_PET).rename('pet_mean_mm_per_month');

// ---------- Annual sums / ratios (CHELSA method) ----------
var P_ann   = prMonthly.sum().rename('P_ann');                  // mm/year
var P_hs    = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
                       .sum().rename('P_highSun');              // Apr–Sep total
var PET_ann = petMeanMm.multiply(12).rename('PET_ann');         // mm/year
var AI      = P_ann.divide(PET_ann).rename('AI');               // UNEP-style ratio

// Treat masked AI (from PET mask) as ocean
var oceanMask = AI.mask().not();

// ---------- Latitude zones (±23.43594°) ----------
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(23.43594);
var tropic    = pixelLat.abs().lte(23.43594);
var southMask = pixelLat.lt(-23.43594);

// ---------- Base aridity classes ----------
// Start as Humid(6); special ocean-ish guard at AI<=0.01; then SH/S/Desert
var aridBase = ee.Image(6)       // 6 = Humid
  .where(AI.lte(0.01), 8)        // 8 = ("ocean-ish" placeholder; real oceans set later)
  .where(AI.lt(0.075), 5)        // 5 = Semihumid
  .where(AI.lt(0.050), 2)        // 2 = Semiarid
  .where(AI.lt(0.025), 1)        // 1 = Arid Desert
  .rename('aridity');

// ---------- HS ratio (Apr–Sep share) ----------
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---------- Rolling 6-month precipitation dominance (global) ----------
var prList = prMonthly.sort('month').toList(12);

var sixMonthSums = ee.List.sequence(0, 11).map(function(start){
  start = ee.Number(start);

  var idx = ee.List.sequence(start, start.add(5))
    .map(function(i){ return ee.Number(i).mod(12); });

  return ee.ImageCollection(
    idx.map(function(i){ return ee.Image(prList.get(i)); })
  ).sum();
});

var P6ratio = ee.ImageCollection.fromImages(sixMonthSums)
  .max()
  .divide(P_ann)
  .rename('P6ratio');

// ---------- Final climate class: Med first, then global monsoon, then oceans, then cold ----------
var clim = aridBase
  // Mediterranean
  .where(
    northMask.and(HS.lt(0.4))
      .or(southMask.and(HS.gt(0.6)))
      .and(aridBase.neq(1))
      .and(aridBase.neq(8)),
    3
  )

  // Global monsoon: ≥80% precip in ANY 6 consecutive months,
  // not Mediterranean, not Arid Desert, not ocean
  .where(
    P6ratio.gte(0.8)
      .and(aridBase.neq(1))
      .and(aridBase.neq(8))
      .and(
        northMask.and(HS.lt(0.4))
          .or(southMask.and(HS.gt(0.6)))
          .not()
      ),
    4
  )

  // Oceans, then cold override (unchanged)
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// ===========================
// Special rule:
// Temperate rainforest with Mediterranean percipitation seasonality ratio → reclassified as humid
// ===========================

// Driest-month precipitation (mm/month)
var P_driest = prMonthly.min();
clim = clim.where(
  clim.eq(3) // Mediterranean only
    .and(P_driest.gte(PET_ann.divide(240))),
  6          // Reclassify as Humid
);

// ===========================
// Temperature class functions
// ===========================
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where( tC.gte(40).and(tC.lt(50)),  1) // X
    .where( tC.gte(35).and(tC.lt(40)),  2) // Z2
    .where( tC.gte(30).and(tC.lt(35)),  3) // Z1
    .where( tC.gte(25).and(tC.lt(30)),  4) // A2
    .where( tC.gte(20).and(tC.lt(25)),  5) // A1
    .where( tC.gte(15).and(tC.lt(20)),  6) // B2
    .where( tC.gte(10).and(tC.lt(15)),  7) // B1 
    .where( tC.gte(5).and(tC.lt(10)),   8) // C2
    .where( tC.gte(0).and(tC.lt(5)),    9) // C1
    .where( tC.lt(0),                  10) // Y
    .rename('warmZone');
}
function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),   1) // X
    .where(tC.gte(30).and(tC.lt(40)),   2) // Z
    .where(tC.gte(20).and(tC.lt(30)),   3) // A
    .where(tC.gte(10).and(tC.lt(20)),   4) // B
    .where(tC.gte(0).and(tC.lt(10)),    5) // C
    .where(tC.gte(-10).and(tC.lt(0)),   6) // D
    .where(tC.gte(-20).and(tC.lt(-10)), 7) // E
    .where(tC.gte(-30).and(tC.lt(-20)), 8) // F
    .where(tC.gte(-40).and(tC.lt(-30)), 9) // G
    .where(tC.lt(-40),                 10) // Y
    .rename('coldZone');
}

var warmComb = classifySummer(hottestC),
    coldComb = classifyCold(coldestC);

// --------------------------------------------------
// Combined code (match the “good” logic): cold*100 + climate*10 + summer
// --------------------------------------------------
var combined = coldComb.multiply(100).add(clim.multiply(10)).add(warmComb).rename('combinedZone');

// ---------- Aridity domain mask for UI click ----------
// In aridity domain when NOT coldCond and NOT ocean
var aridityDomain = coldCond.not().and(oceanMask.not());

// ==================
// === UI & TABLE ===
// ==================

// HSL→HEX helper
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

// Even-contrast color sequence
function hueAt(i){ return (i * 137.508) % 360; } 
function lightAt(i){ return 50; }                // Keep full vibrancy

// Build code list & matching palette
var codes=[], palette=[], hueI=0;
for (var w=1; w<=11; w++){
  for (var c=2; c<=10; c++){
    // temperature-only code
    var codeNoA = w*10 + c;
    codes.push(codeNoA);
    palette.push(hslToHex(hueAt(hueI), 100, lightAt(hueI)));
    hueI++;

    // aridity codes 0–5
    for (var a=0; a<=5; a++){
      var codeA = w*100 + c*10 + a;
      codes.push(codeA);
      palette.push(hslToHex(hueAt(hueI), 100, lightAt(hueI)));
      hueI++;
    }
  }
}

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

// ————————————————————————
// LABEL LOOKUPS 
// ————————————————————————
var summerLetters = {
  1:'X',
  2:'z2',
  3:'z1',
  4:'a2',
  5:'a1',
  6:'b2',
  7:'b1',
  8:'c2',
  9:'c1',
  10:'Y'
};

var coldLetters = {
  1:'X',
  2:'Z',
  3:'A',
  4:'B',
  5:'C',
  6:'D',
  7:'E',
  8:'F',
  9:'G',
  10:'Y'
};

var aridityLetters = {
  6:'h',
  5:'g',
  2:'s',
  1:'d',
  4:'w',
  3:'m',
  7:'', // Cold override
  8:'(nodata)', // Ocean or nodata area
  null:''
};

// ————————————————————————
// 4. DISPLAY & UI
// ————————————————————————

var info = ui.Panel({
  style: {
    position:        'bottom-left',
    padding:         '5px',
    backgroundColor: 'rgba(255,255,255,0.85)'
  }
});
info.add(ui.Label('Click map for classification:', {
  fontWeight: 'bold',
  fontSize:   '14px'
}));

// Single large bold label for the result
var codeLbl = ui.Label({
  value: '',
  style: {
    fontWeight: 'bold',
    fontSize:   '30px',
    textAlign:  'center',
    stretch:    'horizontal',
    margin:     '8px 0 0 0'
  }
});
info.add(codeLbl);
ui.root.add(info);

// Map Click Handler
Map.onClick(function(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);

  var cold = coldComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 500
  }).get('coldZone');

  var warm = warmComb.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 500
  }).get('warmZone');

  var aridity = clim.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 500
  }).get('climateClass');

  // Evaluate together client-side
  ee.Dictionary({cold: cold, warm: warm, aridity: aridity}).evaluate(function(vals) {
    if (!vals || vals.cold === null || vals.warm === null) {
      codeLbl.setValue('');
      return;
    }

    var coldLetter = (coldLetters[vals.cold] || '').split(' ')[0];
    var warmLetter = (summerLetters[vals.warm] || '').split(' ')[0];
    var aridLetter = (aridityLetters[vals.aridity] || '').split(' ')[0] || '';

    var finalCode = coldLetter + aridLetter + warmLetter;
    codeLbl.setValue(finalCode);
  });
});
