/***********************
 CHELSA UKESM SSP585 (2071–2100) → UNEP-style AI = P / PET (mm/yr)
 Data assets (monthly):
   CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_01_2071_2100_norm
   CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_01_2071_2100_norm
 PET = Thornthwaite (needs only tas + latitude).
************************/

/* ---------------- CONFIG ---------------- */
var ASSET_ROOT = 'projects/ordinal-crowbar-459807-m2/assets/';
var STEM       = 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585';
var PERIOD     = '2071_2100_norm';

// Temperature format of tas tiles:
// 'degC' | 'K' | 'deciC' | 'centiC' | 'deciK' | 'centiK'
var TAS_FORMAT = 'deciK';      // your CHELSA tas are deci-Kelvin

// Precip units of pr tiles: 'mm_per_month' | 'mm_per_day' | 'kg_m2_s'
var PR_UNITS = 'mm_per_month';

/* ---------------- HELPERS ---------------- */
var months = ee.List.sequence(1, 12);
var daysInMonth = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]); // climatological

// Safer latitude (avoid tan(±90°) issues)
var latDeg = ee.Image.pixelLonLat().select('latitude').clamp(-89, 89);
var latRad = latDeg.multiply(Math.PI/180);

// Build monthly stack from asset names (client-side → ee.Image)
function fromMonthStack(varname) {
  var imgs = [];
  for (var m = 1; m <= 12; m++) {
    var mm = (m < 10 ? '0' + m : '' + m);
    var id = ASSET_ROOT + STEM + '_' + varname + '_' + mm + '_' + PERIOD;
    imgs.push(ee.Image(id).rename(varname).set('month', m));
  }
  return ee.ImageCollection(imgs).sort('month');
}

// tas → °C based on TAS_FORMAT
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

// pr → mm/month based on PR_UNITS and month length
function prToMmPerMonth(img, mIndex0) {
  var pr = ee.Image(img);
  if (PR_UNITS === 'mm_per_month') return pr;
  if (PR_UNITS === 'mm_per_day') {
    var days = ee.Number(daysInMonth.get(mIndex0));
    return pr.multiply(days);
  }
  if (PR_UNITS === 'kg_m2_s') { // 1 kg m^-2 s^-1 == 1 mm/s of water
    var secondsPerDay = 86400;
    var days2 = ee.Number(daysInMonth.get(mIndex0));
    return pr.multiply(secondsPerDay).multiply(days2);
  }
  return pr;
}

// Monthly daylight-hours factor for Thornthwaite
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

// Thornthwaite PET (mm/month) from tas (°C) and daylight factor
function thornthwaitePET(tasColC) {
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

  // PET_m = 16 * factor_m * (10*T/I)^α
  var petMonthly = ee.ImageCollection(months.map(function(m){
    var Tm  = ee.Image(Tpos.filter(ee.Filter.eq('month', m)).first()).select('Tpos');
    var fac = ee.Image(factors.filter(ee.Filter.eq('month', m)).first()).select('factor');
    var PETm = ee.Image(10).multiply(Tm).divide(I).pow(alpha)
                 .multiply(16).multiply(fac)
                 .rename('pet'); // mm/month
    return PETm.set('month', m);
  })).sort('month');

  return petMonthly;
}

/* ---------------- LOAD DATA ---------------- */
var prColRaw  = fromMonthStack('pr');
var tasColRaw = fromMonthStack('tas');

var tasColC = tasColRaw.map(function(im){
  return tasToC(im).copyProperties(im, ['month']);
}).sort('month');

var prCol = prColRaw.map(function(im){
  var m  = ee.Number(ee.Image(im).get('month'));
  var mm = prToMmPerMonth(im, m.subtract(1)).rename('pr');
  return mm.set('month', m);
}).sort('month');

/* ---------------- PET & AI ---------------- */
var petCol  = thornthwaitePET(tasColC);
var P_ann   = prCol.sum().rename('P_mm');      // mm/yr
var PET_ann = petCol.sum().rename('PET_mm');   // mm/yr

var PET_safe = PET_ann.max(1e-6);
var AI       = P_ann.divide(PET_safe).rename('AI');

/* -------- DISCRETE UNEP-STYLE CLASSES (4 bins) --------
   desert:      AI < 0.25
   semi-arid:   0.25 ≤ AI < 0.50
   dry-subhumid:0.50 ≤ AI < 0.75
   humid:       AI ≥ 0.75
--------------------------------------------------------*/
var finiteMask = AI.eq(AI).and(PET_safe.gt(0));
var classIdx = ee.Image(-1)
  .where(AI.lt(2.5), 0)                                           // desert
  .where(AI.gte(2.5).and(AI.lt(5)), 1)                         // semi-arid
  .where(AI.gte(5).and(AI.lt(7.5)), 2)                         // dry-subhumid
  .where(AI.gte(7.5), 3)                                          // humid
  .updateMask(finiteMask)
  .toInt16()
  .rename('AI_class_idx');

// Optional code layer matching your old scheme (1,2,5,6)
var classCode = ee.Image(0)
  .where(classIdx.eq(0), 1)
  .where(classIdx.eq(1), 2)
  .where(classIdx.eq(2), 5)
  .where(classIdx.eq(3), 6)
  .updateMask(finiteMask)
  .toInt16()
  .rename('AI_class_code');

/* ---------------- VIZ ---------------- */
var palette4 = ['#FF0000', '#FFA500', '#00FF00', '#006600']; // desert→humid
Map.setOptions('SATELLITE');
var pt = ee.Geometry.Point([0, 20]);
Map.centerObject(pt, 3);

Map.addLayer(
  classIdx,
  {min: 0, max: 3, palette: palette4},
  'UNEP AI classes (4 bins)',
  true, 0.7
);

// (Optional diagnostics, toggled off by default)
Map.addLayer(P_ann.updateMask(P_ann.eq(P_ann)),
  {min:0, max:2500, palette:['#f7fbff','#6baed6','#08306b']}, 'Annual P (mm)', false);
Map.addLayer(PET_safe.updateMask(PET_safe.eq(PET_safe)),
  {min:0, max:2500, palette:['#fff5f0','#fc9272','#67000d']}, 'Annual PET (mm)', false);

/* ---------------- EXPORT (optional) ---------------- */
// Export.image.toAsset({
//   image: classIdx, // or AI
//   description: 'UNEP_AI_classes_CHELSA_UKESM_2071_2100',
//   assetId: ASSET_ROOT + 'UNEP_AI_classes_CHELSA_UKESM_2071_2100',
//   scale: 4638,
//   region: ee.Geometry.Rectangle([-180,-60,180,85], null, false),
//   maxPixels: 1e13
// });
