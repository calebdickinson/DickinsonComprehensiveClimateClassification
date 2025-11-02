// === Aridity Map (CHELSA v2.1, 1981–2010) — Calibrated Hargreaves→Penman (NO CLAMP) ===
// Spec: Cold area always blue (7) even if Penman PET is NoData.
//       Non-cold pixels with no Penman PET are hidden.
//       Aridity colors unchanged where Penman exists.

var PREFIX       = 'projects/ordinal-crowbar-459807-m2/assets/';
var PET_MEAN_ID  = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // u16 monthly mean PET (0.1 → mm/month)
var NODATA_U16   = 65535;

var SCALE_PR     = 0.1;  // pr_u16: 0.1 → mm/month
var SCALE_PET    = 0.1;  // penman_pet_mean u16: 0.1 → mm/month
var EPS          = 1e-6; // safe divide

// -----------------------------
// Helpers (Ra, calendar)
// -----------------------------
var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
var Jmid = [15,46,75,105,135,162,198,228,258,288,318,344];
var PI = Math.PI, Gsc = 0.0820;
var latRad = ee.Image.pixelLonLat().select('latitude').multiply(PI/180);

function extraterrestrialRadiationMJperDay(m) {
  var J = Jmid[m-1];
  var dr    = ee.Image(1).add(ee.Image(0.033).multiply(Math.cos((2*PI/365)*J)));
  var delta = ee.Image(0.409).multiply(Math.sin(((2*PI/365)*J) - 1.39));
  var x = latRad.tan().multiply(delta.tan()).multiply(-1).max(-1).min(1);
  var ws = x.acos();
  var term1 = ws.multiply(latRad.sin()).multiply(delta.sin());
  var term2 = latRad.cos().multiply(delta.cos()).multiply(ws.sin());
  return ee.Image((24*60)/PI).multiply(Gsc).multiply(dr).multiply(term1.add(term2)).max(0);
}

// -----------------------------
// tas (°C) monthly (0.1 K → °C) for cold override
// -----------------------------
var tasImgs = [];
var tasByMonth = {};
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? ('0'+m) : ''+m);
  var id = PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';
  var base = ee.Image(id);
  var tasC = base.updateMask(base.neq(NODATA_U16))
                 .multiply(0.1).subtract(273.15)
                 .rename('tasC')
                 .set('month', m);
  tasImgs.push(tasC);
  tasByMonth[mm] = tasC;
}
var tasMonthly = ee.ImageCollection(tasImgs);

var hottestC_global = tasMonthly.qualityMosaic('tasC').select('tasC').rename('hottestC');
var coldestC_global = tasMonthly.map(function(img){ return img.multiply(-1).copyProperties(img); })
                                .qualityMosaic('tasC').multiply(-1)
                                .select('tasC').rename('coldestC');

// Cold mask: true if hottest<15°C OR coldest<-20°C
var coldCond = hottestC_global.lt(15).or(coldestC_global.lt(-20));

// -----------------------------
// pr (mm/month) monthly
// -----------------------------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? ('0'+n) : ''+n);
  var pid = PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16';
  var pbase = ee.Image(pid);
  var pr = pbase.updateMask(pbase.neq(NODATA_U16))
                .multiply(SCALE_PR)
                .rename('pr')
                .set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// -----------------------------
// tasmax/tasmin loader aligned to tas mean (ids have no _u16 suffix)
// -----------------------------
function chooseTasXTmeanAligned(mm) {
  var idMax = PREFIX + 'CHELSA_tasmax_' + mm + '_1981-2010_V2-1';
  var idMin = PREFIX + 'CHELSA_tasmin_' + mm + '_1981-2010_V2-1';
  var rawMax = ee.Image(idMax);
  var rawMin = ee.Image(idMin);

  // Candidates: Kelvin float, 0.1K int, °C float
  var tmax_kel = rawMax.subtract(273.15), tmin_kel = rawMin.subtract(273.15);
  var tmean_kel = tmax_kel.add(tmin_kel).multiply(0.5);

  var tmax_u16 = rawMax.multiply(0.1).subtract(273.15), tmin_u16 = rawMin.multiply(0.1).subtract(273.15);
  var tmean_u16 = tmax_u16.add(tmin_u16).multiply(0.5);

  var tmax_cel = rawMax, tmin_cel = rawMin, tmean_cel = tmax_cel.add(tmin_cel).multiply(0.5);

  var tasRef = ee.Image(tasByMonth[mm]);
  var d_kel = tmean_kel.subtract(tasRef).abs();
  var d_u16 = tmean_u16.subtract(tasRef).abs();
  var d_cel = tmean_cel.subtract(tasRef).abs();

  var chooseU16 = d_u16.lt(d_kel).and(d_u16.lte(d_cel));
  var chooseCel = d_cel.lt(d_kel).and(d_cel.lt(d_u16));

  var tmaxC = tmax_kel.where(chooseU16, tmax_u16).where(chooseCel, tmax_cel).rename('tasmax');
  var tminC = tmin_kel.where(chooseU16, tmin_u16).where(chooseCel, tmin_cel).rename('tasmin');
  var tmeanC = tmean_kel.where(chooseU16, tmean_u16).where(chooseCel, tmean_cel).rename('tmean');

  var maskChosen = tmaxC.mask().and(tminC.mask());
  return {
    tmaxC: tmaxC.updateMask(maskChosen),
    tminC: tminC.updateMask(maskChosen),
    tmeanC: tmeanC.updateMask(maskChosen)
  };
}

// -----------------------------
// Build monthly Hargreaves PET (unscaled)
// -----------------------------
var petHgMonthlyUnscaled = [];
for (var k = 1; k <= 12; k++) {
  var mm = (k < 10 ? ('0'+k) : ''+k);

  var chosen = chooseTasXTmeanAligned(mm);
  var tmaxC  = chosen.tmaxC, tminC = chosen.tminC, tmean = chosen.tmeanC;

  var Ra = extraterrestrialRadiationMJperDay(k);
  var diurnal = tmaxC.subtract(tminC).max(0);

  var et0_mm_day = ee.Image(0.0023).multiply(Ra).multiply(tmean.add(17.8)).multiply(diurnal.sqrt()).max(0);
  var pet_mm_month = et0_mm_day.multiply(daysInMonth[k-1]).rename('pet_mm_month').set('month', k);

  petHgMonthlyUnscaled.push(pet_mm_month.updateMask(tmaxC.mask().and(tminC.mask()).and(tmean.mask())));
}
var petMonthlyHgUnscaled = ee.ImageCollection(petHgMonthlyUnscaled);
var PET_ann_HG_unscaled  = petMonthlyHgUnscaled.sum().rename('PET_ann_HG_unscaled');

// -----------------------------
// Penman mean PET → annual (target) + mask
// -----------------------------
var penmanMean  = ee.Image(PET_MEAN_ID);
var petMask     = penmanMean.neq(NODATA_U16); // where Penman mean exists
var PET_mean_mm = penmanMean.updateMask(petMask).multiply(SCALE_PET).rename('PET_mean_mm');
var PET_ann_PEN = PET_mean_mm.multiply(12).rename('PET_ann_PEN');

// Per-pixel calibration ratio (NO CLAMP)
var scaleField = PET_ann_PEN.divide(PET_ann_HG_unscaled.max(EPS)).updateMask(petMask);

// Apply ratio to each month
var petMonthlyHgCalibrated = petMonthlyHgUnscaled.map(function(img){
  return img.multiply(scaleField).updateMask(petMask).copyProperties(img).set('month', img.get('month'));
});
var PET_ann = ee.ImageCollection(petMonthlyHgCalibrated).sum().rename('PET_ann').updateMask(petMask);

// -----------------------------
// Annual P and HS ratio (only where Penman exists)
// -----------------------------
var P_ann = prMonthly.sum().rename('P_ann').updateMask(petMask);
var P_hs  = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9])).sum().rename('P_highSun').updateMask(petMask);
var AI    = P_ann.divide(PET_ann).rename('AI').updateMask(petMask);

// Latitude zones
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594), tropic = lat.abs().lte(23.43594), southMask = lat.lt(-23.43594);

// -----------------------------
// Aridity logic (unchanged where Penman exists)
// -----------------------------
var aridBase = ee.Image(6)
  .where(AI.gte(1).or(AI.lte(0.01)), 8)
  .where(AI.lt(0.075), 5)
  .where(AI.lt(0.050), 2)
  .where(AI.lt(0.025), 1)
  .rename('aridity');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

var aridSeasonal = aridBase
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.8)), 4)
  .where(northMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.4)),  3)
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),     4)
  .where(tropic.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.8)),    4)
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.lt(0.2)),  4)
  .where(southMask.and(aridBase.neq(1)).and(aridBase.neq(8)).and(HS.gte(0.6)), 3)
  .updateMask(petMask); // ensure aridity only where Penman exists

// -----------------------------
// Cold overlay + mask-safe compositing
// -----------------------------
// Cold pixels are blue (7), visible even if Penman is missing.
var coldOnly = ee.Image(7).rename('climateClass').updateMask(coldCond);

// Non-cold aridity part (unchanged colors), only where Penman exists.
var aridPart = aridSeasonal.rename('climateClass').updateMask(coldCond.not());

// Composite: cold on top; non-cold aridity under it.
// Non-cold & no Penman remains masked (hidden).
var clim = coldOnly.blend(aridPart); // mask-safe union

// -----------------------------
// Visualization
// -----------------------------
var codeColorMap = {
  1: "#FF0000", // D: Arid Desert
  2: "#FFA500", // S: Semiarid
  3: "#FFFF00", // M: Mediterranean
  4: "#FF00FF", // W: Monsoon
  5: "#00FF00", // G: Semihumid
  6: "#006600", // H: Humid
  7: "#0000FF", // Cold override (always visible)
  8: "#008888"  // Ocean-ish (only appears where Penman exists & AI rule triggers)
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k,10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_,i){ return i; });

var discrete = clim.remap(codes, indices, -1);

Map.addLayer(
  discrete, // already correctly masked by the composite
  {min:0, max:indices.length-1, palette:palette},
  'Climate (CHELSA, calibrated Hargreaves→Penman; cold shows, non-cold NoData hidden)',
  true, 0.7
);

// Optional QA
// Map.addLayer(coldCond.selfMask(), {min:0,max:1,palette:['#0000FF']}, 'Cold mask', false);
// Map.addLayer(petMask.not().and(coldCond.not()).selfMask(), {min:0,max:1,palette:['#000000']}, 'Hidden: non-cold & no Penman', false);
