// === Aridity Map (CHELSA v2.1, 1981–2010) — Hargreaves PET (tasmax, tasmin, tas, pr) ===
// No ocean masking

var PREFIX     = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16 = 65535;

var SCALE_PR = 0.1;  // pr_u16: 0.1 → mm/month  (UNCHANGED)
var KHG = 5;      // ↑ raise PET ~50% vs KHG=0.60 to reduce global wet bias

// (Optional) latitude-dependent tweak (uncomment to try):
// var latDeg = ee.Image.pixelLonLat().select('latitude').abs();
// // Slightly higher PET outside the tropics
// var khgField = ee.Image(KHG)
//   .multiply( ee.Image(1).add(latDeg.subtract(23.5).max(0).divide(90-23.5).multiply(0.15)) );
// // Then replace "0.0023 * KHG" below with "0.0023" and multiply by khgField later.

// -----------------------------
// Helpers: month metadata & Ra
// -----------------------------
var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
var Jmid = [15,46,75,105,135,162,198,228,258,288,318,344]; // FAO-56 mid-month
var PI  = Math.PI;
var Gsc = 0.0820; // MJ m-2 min-1

// Latitude image in radians
var latRad = ee.Image.pixelLonLat().select('latitude').multiply(PI/180);

// Extraterrestrial radiation Ra (MJ m-2 day-1)
function extraterrestrialRadiationMJperDay(m) {
  var J = Jmid[m-1];
  var dr    = ee.Image(1).add(ee.Image(0.033).multiply(Math.cos((2*PI/365)*J)));
  var delta = ee.Image(0.409).multiply(Math.sin(((2*PI/365)*J) - 1.39));
  var x = latRad.tan().multiply(delta.tan()).multiply(-1).max(-1).min(1);
  var ws = x.acos();
  var term1 = ws.multiply(latRad.sin()).multiply(delta.sin());
  var term2 = latRad.cos().multiply(delta.cos()).multiply(ws.sin());
  var Ra = ee.Image((24*60)/PI).multiply(Gsc).multiply(dr).multiply(term1.add(term2));
  return Ra.max(0);
}

// -----------------------------
// tas (CHELSA_tas_*_u16) — 0.1 K ints → °C   (UNCHANGED)
// -----------------------------
var tasImgs = [];
var tasByMonth = {};
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2041_2070_norm';
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
var coldestC_global = tasMonthly
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('tasC')
  .multiply(-1).select('tasC').rename('coldestC');

var coldCond = hottestC_global.lt(15).or(coldestC_global.lt(-20));

// -----------------------------
// pr (mm/month) from monthly _u16  (UNCHANGED)
// -----------------------------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' + nn + '_2041_2070_norm';
  var pbase = ee.Image(pid);
  var pr = pbase.updateMask(pbase.neq(NODATA_U16))
                .multiply(SCALE_PR)
                .rename('pr')
                .set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ----------------------------------
// tasmax/tasmin — choose conversion that matches CHELSA tas mean
// ----------------------------------
function chooseTasXTmeanAligned(mm) {
  var idMax = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' + mm + '_2041_2070_norm';
  var idMin = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' + mm + '_2041_2070_norm';
  var rawMax = ee.Image(idMax);
  var rawMin = ee.Image(idMin);

  // Candidates: Kelvin float, 0.1 K integer, °C float
  var tmax_kel = rawMax.subtract(273.15);
  var tmin_kel = rawMin.subtract(273.15);
  var tmean_kel = tmax_kel.add(tmin_kel).multiply(0.5);

  var tmax_u16 = rawMax.multiply(0.1).subtract(273.15);
  var tmin_u16 = rawMin.multiply(0.1).subtract(273.15);
  var tmean_u16 = tmax_u16.add(tmin_u16).multiply(0.5);

  var tmax_cel = rawMax;
  var tmin_cel = rawMin;
  var tmean_cel = tmax_cel.add(tmin_cel).multiply(0.5);

  var tasRef = ee.Image(tasByMonth[mm]);

  // Differences to reference mean
  var d_kel = tmean_kel.subtract(tasRef).abs();
  var d_u16 = tmean_u16.subtract(tasRef).abs();
  var d_cel = tmean_cel.subtract(tasRef).abs();

  // Smallest difference per pixel
  var chooseU16 = d_u16.lt(d_kel).and(d_u16.lte(d_cel));
  var chooseCel = d_cel.lt(d_kel).and(d_cel.lt(d_u16));
  var chooseKel = chooseU16.not().and(chooseCel.not());

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

var petMonthlyList = [];
for (var k = 1; k <= 12; k++) {
  var mm = (k < 10 ? '0' + k : '' + k);

  var chosen = chooseTasXTmeanAligned(mm);
  var tmaxC  = chosen.tmaxC;
  var tminC  = chosen.tminC;
  var tmean  = chosen.tmeanC;

  var Ra = extraterrestrialRadiationMJperDay(k); // MJ m-2 day-1

  // FAO-56 Hargreaves (mm/day):
  // ET0 = 0.0023 * KHG * Ra * (Tmean + 17.8) * (Tmax - Tmin)^0.5
  var diurnal = tmaxC.subtract(tminC).max(0);
  var et0_mm_day = ee.Image(0.0023 * KHG)
      .multiply(Ra)
      .multiply(tmean.add(17.8))
      .multiply(diurnal.sqrt())
      .max(0)
      .rename('et0_mm_day');

  // If using lat scaler above:
  // et0_mm_day = et0_mm_day.multiply(khgField);

  var et0_mm_month = et0_mm_day.multiply(daysInMonth[k-1])
                               .rename('pet_mm_month')
                               .set('month', k);

  var petMasked = et0_mm_month.updateMask(
    tmaxC.mask().and(tminC.mask()).and(tmean.mask())
  );
  petMonthlyList.push(petMasked);
}
var petMonthly = ee.ImageCollection(petMonthlyList);

// -----------------------------
// Annual sums / ratios
// -----------------------------
var P_ann   = prMonthly.sum().rename('P_ann');                 // mm/year
var P_hs    = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9]))
                       .sum().rename('P_highSun');

var PET_ann = petMonthly.sum().rename('PET_ann');              // mm/year
var AI      = P_ann.divide(PET_ann).rename('AI');

// Ocean strictly from mask
var oceanMask = AI.mask().not();

// -----------------------------
// Latitude zones (unchanged thresholds/logic)
// -----------------------------
var lat = ee.Image.pixelLonLat().select('latitude');
var northMask = lat.gt(23.43594);
var tropic    = lat.abs().lte(23.43594);
var southMask = lat.lt(-23.43594);

// --- Aridity classes (no AI>=1→ocean) ---
var aridBase = ee.Image(6)                      // H: Humid
  .where(AI.lt(0.075), 5)                       // G: Semihumid
  .where(AI.lt(0.050), 2)                       // S: Semiarid
  .where(AI.lt(0.025), 1)                       // D: Arid Desert
  .rename('aridity');

var HS = P_hs.divide(P_ann).rename('HS_ratio');

var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4)
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3)
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4)
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4)
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4)
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3)
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

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
  7: "#0000FF", // no aridity (cold)
  8: "#008888"  // ocean
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discrete = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discrete.updateMask(clim.neq(8)),
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (CHELSA, Hargreaves PET; oceans included, cold wins)',
  true, 0.7
);

// -----------------------------
// Quick checks (toggle briefly)
// -----------------------------
// Map.addLayer(PET_ann, {min:0, max:2500}, 'PET_ann (mm/yr)', false);
// Map.addLayer(P_ann,   {min:0, max:3000}, 'P_ann (mm/yr)',   false);
// Map.addLayer(AI,      {min:0, max:3},    'AI',              false);

// var pt = ee.Geometry.Point([-60, -3]); // Amazon
// print('P_ann @ Amazon (mm/yr):',  P_ann.sample(pt, 10000).first().get('P_ann'));
// print('PET_ann @ Amazon (mm/yr):', PET_ann.sample(pt, 10000).first().get('PET_ann'));
// print('AI @ Amazon:',              AI.sample(pt, 10000).first().get('AI'));
