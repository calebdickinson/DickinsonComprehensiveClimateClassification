// === Aridity Map (CHELSA v2.1, 1981–2010) — Hargreaves PET (aridity-only) ===
// HARD RULE: Any pixel missing in Penman PET mean (CHELSA_pet_penman_mean_1981-2010_V2-1) is masked out.
// Additional ocean/pathology mask: AI > 100. Classes: {1,2,5,6} only.

var PREFIX     = 'projects/ordinal-crowbar-459807-m2/assets/';  // ends with '/'
var NODATA_U16 = 65535;

var SCALE_PR = 0.1;   // pr_u16: 0.1 → mm/month
var KHG      = 5;     // Hargreaves multiplier
var EPS      = 1e-6;  // safe divide

// -----------------------------
// 0) Build a strict "Penman-present" mask from your Penman PET mean asset
// -----------------------------
var penmanMean = ee.Image(PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1');
// We consider "present" where:
// - pixel is not the u16 sentinel,
// - pixel is > 0 (PET should be positive),
// - and the native mask is valid (covers any internal nodata)
var penmanMaskStrict = penmanMean.mask()
  .and(penmanMean.neq(NODATA_U16))
  .and(penmanMean.gt(0));

// Helper to enforce the Penman presence everywhere
function withPenmanMask(img) { return ee.Image(img).updateMask(penmanMaskStrict); }

// -----------------------------
// 1) Helpers: month metadata & FAO-56 Ra
// -----------------------------
var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
var Jmid = [15,46,75,105,135,162,198,228,258,288,318,344]; // mid-month DOY
var PI  = Math.PI;
var Gsc = 0.0820; // MJ m-2 min-1

var latRad = withPenmanMask(ee.Image.pixelLonLat().select('latitude').multiply(PI/180));

function extraterrestrialRadiationMJperDay(m) {
  var J = Jmid[m-1];
  var dr    = ee.Image(1).add(ee.Image(0.033).multiply(Math.cos((2*PI/365)*J)));
  var delta = ee.Image(0.409).multiply(Math.sin(((2*PI/365)*J) - 1.39));
  var x = latRad.tan().multiply(delta.tan()).multiply(-1).max(-1).min(1);
  var ws = x.acos();
  var term1 = ws.multiply(latRad.sin()).multiply(delta.sin());
  var term2 = latRad.cos().multiply(delta.cos()).multiply(ws.sin());
  var Ra = ee.Image((24*60)/PI).multiply(Gsc).multiply(dr).multiply(term1.add(term2));
  return withPenmanMask(Ra.max(0));
}

// -----------------------------
// 2) Monthly mean temperature (tas_u16 0.1 K → °C) for alignment
// -----------------------------
var tasByMonth = {};
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var id = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' + mm + '_2011_2040_norm';
  var base = ee.Image(id);
  var tasC = base.updateMask(base.neq(NODATA_U16))
                 .multiply(0.1).subtract(273.15)
                 .rename('tasC').set('month', m);
  tasByMonth[mm] = withPenmanMask(tasC);
}

// -----------------------------
// 3) tasmax/tasmin chooser (handles Kelvin/0.1K/°C variants), aligned to tas
// -----------------------------
function chooseTasXTmeanAligned(mm) {
  var idMax = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' + mm + '_2011_2040_norm';
  var idMin = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' + mm + '_2011_2040_norm';
  var rawMax = ee.Image(idMax);
  var rawMin = ee.Image(idMin);

  // candidates → °C
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

  var d_kel = tmean_kel.subtract(tasRef).abs();
  var d_u16 = tmean_u16.subtract(tasRef).abs();
  var d_cel = tmean_cel.subtract(tasRef).abs();

  var chooseU16 = d_u16.lt(d_kel).and(d_u16.lte(d_cel));
  var chooseCel = d_cel.lt(d_kel).and(d_cel.lt(d_u16));

  var tmaxC = tmax_kel.where(chooseU16, tmax_u16).where(chooseCel, tmax_cel).rename('tasmax');
  var tminC = tmin_kel.where(chooseU16, tmin_u16).where(chooseCel, tmin_cel).rename('tasmin');
  var tmeanC = tmean_kel.where(chooseU16, tmean_u16).where(chooseCel, tmean_cel).rename('tmean');

  var maskChosen = tmaxC.mask().and(tminC.mask()).and(tmeanC.mask());
  return {
    tmaxC: withPenmanMask(tmaxC.updateMask(maskChosen)),
    tminC: withPenmanMask(tminC.updateMask(maskChosen)),
    tmeanC: withPenmanMask(tmeanC.updateMask(maskChosen))
  };
}

// -----------------------------
// 4) Monthly precipitation (pr_u16 0.1 → mm/month)
// -----------------------------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' + nn + '_2011_2040_norm';
  var pbase = ee.Image(pid);
  var pr = pbase.updateMask(pbase.neq(NODATA_U16))
                .multiply(SCALE_PR)
                .rename('pr')
                .set('month', n);
  prImgs.push(withPenmanMask(pr));
}
var prMonthly = ee.ImageCollection(prImgs);

// -----------------------------
// 5) Hargreaves PET (mm/month) → annual PET
// ET0 = 0.0023 * KHG * Ra * (Tmean + 17.8) * sqrt(Tmax - Tmin)
// -----------------------------
var petMonthlyList = [];
for (var k = 1; k <= 12; k++) {
  var mm = (k < 10 ? '0' + k : '' + k);
  var chosen = chooseTasXTmeanAligned(mm);
  var tmaxC  = chosen.tmaxC;
  var tminC  = chosen.tminC;
  var tmean  = chosen.tmeanC;

  var Ra = extraterrestrialRadiationMJperDay(k); // MJ m-2 day-1
  var diurnal = tmaxC.subtract(tminC).max(0);

  var et0_mm_day = ee.Image(0.0023 * KHG)
      .multiply(Ra)
      .multiply(tmean.add(17.8))
      .multiply(diurnal.sqrt())
      .max(0)
      .rename('et0_mm_day');

  var pet_mm_month = et0_mm_day.multiply(daysInMonth[k-1])
                               .rename('pet_mm_month')
                               .set('month', k);

  var petMasked = withPenmanMask(
    pet_mm_month.updateMask(tmaxC.mask().and(tminC.mask()).and(tmean.mask()))
  );
  petMonthlyList.push(petMasked);
}
var petMonthly = ee.ImageCollection(petMonthlyList);

// -----------------------------
// 6) Annual sums & Aridity Index
// -----------------------------
var P_ann    = withPenmanMask(prMonthly.sum().rename('P_ann'));     // mm/year
var PET_ann  = withPenmanMask(petMonthly.sum().rename('PET_ann'));  // mm/year
var PET_safe = PET_ann.max(ee.Image.constant(EPS));
var AI       = withPenmanMask(P_ann.divide(PET_safe).rename('AI'));

// Additional ocean/pathology cut: AI > 100; also require positive P & PET
var keepWetMask = AI.lte(100).and(P_ann.gt(0)).and(PET_ann.gt(0));
var AI_masked   = withPenmanMask(AI.updateMask(keepWetMask));

// -----------------------------
// 7) Aridity classes (1,2,5,6) — reapply mask after remap
// -----------------------------
var clim = ee.Image(6)                 // Humid
  .where(AI_masked.lt(0.075), 5)       // Semihumid
  .where(AI_masked.lt(0.050), 2)       // Semiarid
  .where(AI_masked.lt(0.025), 1)       // Arid Desert
  .rename('climateClass');

var codes   = [1,2,5,6];
var palette = ['#FF0000','#FFA500','#00FF00','#006600'];
var indices = codes.map(function(_, i){ return i; });

// remap can drop masks; reapply strict mask afterward to be 100% safe
var discrete = clim.remap(codes, indices, -1).rename('classIndex');
discrete = withPenmanMask(discrete.updateMask(clim.mask()));

// -----------------------------
// 8) Visualization
// -----------------------------
Map.addLayer(
  withPenmanMask(AI_masked),
  {min: 0, max: 3, palette: ['#f7fbff','#6baed6','#08306b']},
  'Aridity Index (AI) — Penman-present only',
  false
);

Map.addLayer(
  discrete,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate (Hargreaves PET; Penman-present only; AI>100 masked)',
  true, 0.7
);

// View
Map.setOptions('SATELLITE');
Map.centerObject(ee.Geometry.Point([-98, 39]), 4);
