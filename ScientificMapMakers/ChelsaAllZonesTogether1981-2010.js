// === CHELSA v2.1 (1981–2010) — Dickinson rules & your uploaded assets ===

// ---------- Assets & constants ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var PET_MEAN_ID  = ASSET_PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // u16 mean PET

var NODATA_U16 = 65535;
var SCALE_PR   = 0.1;  // CHELSA pr_u16: 0.1 → mm/month
var SCALE_PET  = 0.1;  // CHELSA pet_u16 mean: 0.1 → mm/month

// ---------- Months helper ----------
var months = ee.List.sequence(1, 12);

// ---------- Monthly mean temperature (°C) from CHELSA tas_u16 (0.1 K) ----------
var tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m); // "01".."12"
  var id = ASSET_PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';

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

// Dickinson “no-aridity due to cold” condition (same as your working code)
var coldCond = hottestC.lt(15).or(coldestC.lt(-20));

// ---------- Monthly precipitation from CHELSA pr_u16 (0.1 → mm/month) ----------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn  = (n < 10 ? '0' + n : '' + n);
  var pid = ASSET_PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16';

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

// Treat masked AI (from PET mask) as ocean (like your working code)
var oceanMask = AI.mask().not();

// ---------- Latitude zones (±23.43594°) ----------
var pixelLat = ee.Image.pixelLonLat().select('latitude');
var northMask = pixelLat.gt(23.43594);
var tropic    = pixelLat.abs().lte(23.43594);
var southMask = pixelLat.lt(-23.43594);

// ---------- Base aridity classes (your thresholds from the “good” code) ----------
// Start as Humid(6); special ocean-ish guard at AI<=0.01; then SH/S/Desert
var aridBase = ee.Image(6)       // 6 = Humid
  .where(AI.lte(0.01), 8)        // 8 = (we'll keep as "ocean-ish" placeholder; real oceans set later)
  .where(AI.lt(0.075), 5)        // 5 = Semihumid
  .where(AI.lt(0.050), 2)        // 2 = Semiarid
  .where(AI.lt(0.025), 1)        // 1 = Arid Desert
  .rename('aridity');

// ---------- HS ratio (Apr–Sep share) ----------
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---------- Final climate class: apply Med/Monsoon (non-desert, non-ocean-ish), then oceans(8), then cold(7) ----------
var clim = aridBase
  // Northern Hemisphere: Med <0.4; Monsoon >=0.8 (except Arid Desert(1) and ocean-ish(8))
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.4)),  3) // Mediterranean
  // Tropics: Monsoon at extremes
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.8)),    4) // Monsoon
  // Southern Hemisphere: Med >=0.6; Monsoon <0.2
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.6)), 3) // Mediterranean
  // Oceans (AI mask) as 8, then cold wins (7) everywhere regardless of AI
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// ===========================
// Temperature class functions
// ===========================
// (Keeping YOUR current binning from this file; if you want the other bins, paste them here.)
function classifySummer(tC) {
  return ee.Image.constant(0)
    .where( tC.gte(55).and(tC.lte(60)), 1)
    .where( tC.gte(50).and(tC.lte(55)), 2)
    .where( tC.gte(45).and(tC.lte(50)), 3)
    .where( tC.gte(40).and(tC.lt(45)),  4)
    .where( tC.gte(35).and(tC.lt(40)),  5)
    .where( tC.gte(30).and(tC.lt(35)),  6)
    .where( tC.gte(25).and(tC.lt(30)),  7)
    .where( tC.gte(20).and(tC.lt(25)),  8)
    .where( tC.gte(15).and(tC.lt(20)),  9)
    .where( tC.gte(10).and(tC.lt(15)), 10)
    .where( tC.gte(5).and(tC.lt(10)),  11)
    .where( tC.gte(0).and(tC.lt(5)),   12)
    .where( tC.lt(0),                  13)
    .rename('warmZone');
}
function classifyCold(tC) {
  return ee.Image.constant(0)
    .where(tC.gte(40).and(tC.lt(50)),   1)
    .where(tC.gte(30).and(tC.lt(40)),   2)
    .where(tC.gte(20).and(tC.lt(30)),   3)
    .where(tC.gte(10).and(tC.lt(20)),   4)
    .where(tC.gte(0).and(tC.lt(10)),    5)
    .where(tC.gte(-10).and(tC.lt(0)),   6)
    .where(tC.gte(-20).and(tC.lt(-10)), 7)
    .where(tC.gte(-30).and(tC.lt(-20)), 8)
    .where(tC.gte(-40).and(tC.lt(-30)), 9)
    .where(tC.lt(-40),                 10)
    .rename('coldZone');
}

var warmComb = classifySummer(hottestC),
    coldComb = classifyCold(coldestC);

// --------------------------------------------------
// Combined code (match the “good” logic): cold*100 + climate*10 + summer
// --------------------------------------------------
var combined = coldComb.multiply(100).add(clim.multiply(10)).add(warmComb).rename('combinedZone');

// ---------- Aridity domain mask for UI click (replace old validMask logic) ----------
// In aridity domain when NOT coldCond and NOT ocean
var aridityDomain = coldCond.not().and(oceanMask.not());

// ==================
// === UI & TABLE ===
// (everything below is your original UI/city logic, unchanged)
// ==================

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
    // aridity codes 0–5 (your UI assumes 0–5; our clim uses {1,2,3,4,5,6,7,8} where:
    // 1=Desert, 2=Semiarid, 3=Mediterranean, 4=Monsoon, 5=Semihumid, 6=Humid, 7=Cold-override, 8=Ocean)
    // We'll still generate entries 0–5 for the palette block; the map will render whatever codes actually occur.
    for(var a=0; a<=5; a++){
      var codeA = w*100 + c*10 + a;
      codes.push(codeA);
      palette.push(hslToHex(rainbowHues[hueI%7],100,50));
      hueI++;
    }
  }
}

// ————————————————————————
// LABEL LOOKUPS (unchanged)
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

// Update aridity label map to reflect actual classes used in this build
var aridityLetters = {
  6:'H (Humid)',
  5:'G (Semihumid)',
  2:'S (Semiarid)',
  1:'D (Arid Desert)',
  4:'W (Monsoon)',
  3:'M (Mediterranean)',
  7:'Cold override',
  8:'Ocean',
  null:''
};

// ————————————————————————
// 4. DISPLAY & UI (minor tweak: use aridityDomain instead of validMask)
// ————————————————————————

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
      var aLetter = aridityLetters[a].split(' ')[0] || '';
      combinedAlpha[w * 100 + c * 10 + a] = cLetter + (aLetter? aLetter : '') + wLetter;
    });
  });
});

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

// Click handler uses aridityDomain (not the old validMask)
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

  // 3) Aridity: inside domain? then show class; else blank
  aridityDomain.rename('mask').reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 10000
  }).get('mask').evaluate(function(inZone) {
    if (inZone) {
      clim.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: pt,
        scale: 10000
      }).get('climateClass').evaluate(function(a) {
        aridityLbl.setValue(aridityLetters[a] || '');
      });
    } else {
      aridityLbl.setValue('');
    }
  });
});
