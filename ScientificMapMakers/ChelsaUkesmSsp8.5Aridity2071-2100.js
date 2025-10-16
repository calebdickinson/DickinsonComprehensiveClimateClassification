/***********************
 CHELSA UKESM SSP585 (2071–2100) → UNEP-style AI = P / PET (4 classes)
 Assets like:
   CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_01_2071_2100_norm
   CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_01_2071_2100_norm
 PET = Thornthwaite (tas + latitude only). Thornthwaite returns PET in **cm/month** → convert to **mm/month**.
************************/

// ---------------- CONFIG ----------------
var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets/';
var STEM       = 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585';
var PERIOD     = '2071_2100_norm';

// Temperature format of tas tiles. Options: 'degC' | 'K' | 'deciC' | 'centiC' | 'deciK' | 'centiK'
var TAS_FORMAT = 'deciK';             // your tiles were deci-Kelvin → °C = value*0.1 - 273.15

// Precip units of pr tiles.
var PR_UNITS = 'mm_per_month';        // 'mm_per_month' | 'mm_per_day' | 'kg_m2_s'

// Optional dry/wet calibration (≥1.0 makes AI drier by increasing PET)
var PET_SCALE = 1.0;

// UNEP/UNCCD-style thresholds collapsed to 4 classes:
var CUT_DESERT     = 0.25;  // (hyper+arid)
var CUT_SEMIARID   = 0.50;
var CUT_DRYSUBHUM  = 0.75;  // humid ≥ 0.65

// ---------------- HELPERS ----------------
var months = ee.List.sequence(1, 12);
var daysInMonth = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]); // clim

// Safer latitude (avoid tan(±90°) blowups)
var latDeg = ee.Image.pixelLonLat().select('latitude').clamp(-89, 89);
var latRad = latDeg.multiply(Math.PI/180);

// Build monthly stack from asset names (client-side strings → ee.Image)
function fromMonthStack(varname) {
  var imgs = [];
  for (var m = 1; m <= 12; m++) {
    var mm = (m < 10 ? '0' + m : '' + m);  // '01'..'12'
    var id = ASSET_ROOT + STEM + '_' + varname + '_' + mm + '_' + PERIOD;
    imgs.push(ee.Image(id).rename(varname).set('month', m));
  }
  return ee.ImageCollection(imgs).sort('month');
}

// Convert tas to °C based on TAS_FORMAT
function tasToC(img) {
  var x = ee.Image(img);
  if (TAS_FORMAT === 'degC')   return x.rename('tas');
  if (TAS_FORMAT === 'K')      return x.subtract(273.15).rename('tas');
  if (TAS_FORMAT === 'deciC')  return x.multiply(0.1).rename('tas');
  if (TAS_FORMAT === 'centiC') return x.multiply(0.01).rename('tas');
  if (TAS_FORMAT === 'deciK')  return x.multiply(0.1).subtract(273.15).rename('tas');
  // default: 'centiK'
  return x.multiply(0.01).subtract(273.15).rename('tas');
}

// Convert pr to mm/month based on PR_UNITS and the month's day-count
function prToMmPerMonth(img, mIndex0) {
  var pr = ee.Image(img);
  if (PR_UNITS === 'mm_per_month') return pr;
  if (PR_UNITS === 'mm_per_day') {
    var days = ee.Number(daysInMonth.get(mIndex0));
    return pr.multiply(days);
  }
  if (PR_UNITS === 'kg_m2_s') {
    var secondsPerDay = 86400;
    var days = ee.Number(daysInMonth.get(mIndex0));
    return pr.multiply(secondsPerDay).multiply(days); // 1 kg m^-2 s^-1 == 1 mm/s
  }
  return pr; // fallback
}

// Monthly daylight-hours factor for Thornthwaite (dimensionless)
var midDOY = ee.List([15,46,75,105,135,162,198,228,258,288,318,344]);
function monthlyDaylightFactor() {
  var imgs = months.map(function (m) {
    m = ee.Number(m);
    var idx = m.subtract(1);
    var doy = ee.Number(midDOY.get(idx));

    // δ (radians): 0.409 * sin(2π/365 * DOY − 1.39)
    var B = doy.multiply(2 * Math.PI / 365.0).subtract(1.39);
    var delta = ee.Number(0.409).multiply(B.sin());

    // cos(ωs) = -tan(φ) tan(δ)
    var cosws = latRad.tan()
      .multiply(ee.Image.constant(delta.tan()))
      .multiply(-1)
      .max(-1).min(1);
    var ws = cosws.acos();
    var dayLen = ws.multiply(24 / Math.PI); // hours

    var L_over_12 = dayLen.divide(12.0);
    var N_over_30 = ee.Number(daysInMonth.get(idx)).divide(30.0);

    return L_over_12.multiply(N_over_30).rename('factor').set('month', m);
  });
  return ee.ImageCollection(imgs).sort('month');
}

// Thornthwaite PET (→ **cm/month**, then convert to **mm/month**)
function thornthwaitePET_mm(tasColC) {
  var Tpos = tasColC.map(function(im){
    return ee.Image(im).max(0).rename('Tpos').copyProperties(im, ['month']);
  });

  // Heat index I = Σ (T/5)^1.514
  var I = ee.ImageCollection(Tpos.map(function(im){
    var T = ee.Image(im).select('Tpos');
    return T.divide(5).pow(1.514).set('month', im.get('month'));
  })).sum().rename('I').max(1e-6); // avoid divide-by-zero

  // α = 6.75e-7 I^3 − 7.71e-5 I^2 + 1.792e-2 I + 0.49239
  var alpha = I.pow(3).multiply(6.75e-7)
    .add(I.pow(2).multiply(-7.71e-5))
    .add(I.multiply(1.792e-2))
    .add(0.49239)
    .rename('alpha');

  var factors = monthlyDaylightFactor();

  // PET_cm = 16 * factor * (10*T/I)^α   (cm/month, Thornthwaite 1948/1957)
  // Convert to mm: PET_mm = PET_cm * 10
  var petMonthly_mm = ee.ImageCollection(months.map(function(m){
    var Tm  = ee.Image(Tpos.filter(ee.Filter.eq('month', m)).first()).select('Tpos');
    var fac = ee.Image(factors.filter(ee.Filter.eq('month', m)).first()).select('factor');
    var PET_cm = ee.Image(10).multiply(Tm).divide(I).pow(alpha)
                  .multiply(16).multiply(fac);
    var PET_mm = PET_cm.multiply(10).multiply(PET_SCALE) // ← convert cm→mm, then optional scale
                  .rename('pet'); // mm/month
    return PET_mm.set('month', m);
  })).sort('month');

  return petMonthly_mm;
}

// ---------------- LOAD DATA ----------------
var prColRaw  = fromMonthStack('pr');
var tasColRaw = fromMonthStack('tas');

// tas → °C (handles deciK/centiK/etc.)
var tasColC = tasColRaw.map(function(im){
  return tasToC(im).copyProperties(im, ['month']);
}).sort('month');

// pr → mm/month with correct month lengths
var prCol = prColRaw.map(function(im){
  var m  = ee.Number(ee.Image(im).get('month'));
  var mm = prToMmPerMonth(im, m.subtract(1)).rename('pr');
  return mm.set('month', m);
}).sort('month');

// ---------------- PET & AI ----------------
var petCol_mm  = thornthwaitePET_mm(tasColC);
var P_ann      = prCol.sum().rename('P_mm');      // mm/yr
var PET_ann_mm = petCol_mm.sum().rename('PET_mm'); // mm/yr

var PET_safe = PET_ann_mm.max(1e-6);
var AI       = P_ann.divide(PET_safe).rename('AI'); // unitless (UNEP)

// ---------------- DISCRETE CLASSES (UNEP-style, 4 bins) ----------------
var finiteMask = AI.eq(AI).and(PET_safe.gt(0));

var classIdx = ee.Image(-1)
  .where(AI.lt(CUT_DESERT), 0)                                          // desert (<0.20)
  .where(AI.gte(CUT_DESERT).and(AI.lt(CUT_SEMIARID)), 1)                // semi-arid
  .where(AI.gte(CUT_SEMIARID).and(AI.lt(CUT_DRYSUBHUM)), 2)             // dry-subhumid
  .where(AI.gte(CUT_DRYSUBHUM), 3)                                      // humid
  .updateMask(finiteMask)
  .toInt16()
  .rename('AI_class_idx');

// Optional codes (1,2,5,6)
var classCode = ee.Image(0)
  .where(classIdx.eq(0), 1)
  .where(classIdx.eq(1), 2)
  .where(classIdx.eq(2), 5)
  .where(classIdx.eq(3), 6)
  .updateMask(finiteMask)
  .toInt16()
  .rename('AI_class_code');

// 4-color palette
var palette4 = ['#FF0000', '#FFA500', '#00FF00', '#006600'];

// ---------------- DISPLAY ----------------
Map.setOptions('SATELLITE');
var pt = ee.Geometry.Point([0, 20]);
Map.centerObject(pt, 3);

Map.addLayer(
  classIdx,
  {min: 0, max: 3, palette: palette4},
  'UNEP AI classes (4 bins)',
  true, 0.7
);

// Optional diagnostics (toggle last arg to true to view)
Map.addLayer(P_ann.updateMask(P_ann.eq(P_ann)),
  {min:0, max:2500, palette:['#f7fbff','#6baed6','#08306b']}, 'Annual P (mm)', false);
Map.addLayer(PET_safe.updateMask(PET_safe.eq(PET_safe)),
  {min:0, max:2500, palette:['#fff5f0','#fc9272','#67000d']}, 'Annual PET (mm)', false);

// ---------------- QUICK NUMERIC CHECK (optional) ----------------
function firstVal(img, band) {
  return ee.Image(img).select(band).reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt, scale: 50000, maxPixels: 1e13
  }).get(band);
}
print('tas_01 (°C)', firstVal(tasColC.filter(ee.Filter.eq('month', 1)).first(), 'tas'));
print('pr_01 (mm/month)', firstVal(prCol.filter(ee.Filter.eq('month', 1)).first(), 'pr'));
print('Annual P (mm)', firstVal(P_ann, 'P_mm'));
print('Annual PET (mm)', firstVal(PET_safe, 'PET_mm'));
print('AI at point', firstVal(AI, 'AI'));

// ---------------- EXPORT (optional) ----------------
// Export.image.toAsset({
//   image: classIdx, // or AI, or classCode
//   description: 'UNEP_AI_classes_CHELSA_UKESM_2071_2100',
//   assetId: ASSET_ROOT + 'UNEP_AI_classes_CHELSA_UKESM_2071_2100',
//   scale: 4638,
//   region: ee.Geometry.Rectangle([-180,-60,180,85], null, false),
//   maxPixels: 1e13
// });
