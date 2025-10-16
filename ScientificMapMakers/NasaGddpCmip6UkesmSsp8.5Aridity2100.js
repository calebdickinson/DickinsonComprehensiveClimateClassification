// 2100 Aridity Map — UKESM1-0-LL (NEX-GDDP-CMIP6)
// UNEP Aridity Index (AI = P/PET) with Hargreaves PET (FAO-56 form, includes 0.408)

// --------------------------- Setup & Utilities ----------------------------
var months    = ee.List.sequence(1, 12);
var daysList  = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);
// Mid-month day-of-year list (index = month-1)
var midMonthJ = ee.List([15,46,75,105,135,162,198,228,258,288,318,344]);

function dailyTmeanC(ic) {
  return ic.map(function(img) {
    var bn = img.bandNames();
    var tmeanK = ee.Image(ee.Algorithms.If(
      bn.contains('tas'),
      img.select('tas'),
      img.select('tasmax').add(img.select('tasmin')).multiply(0.5)
    ));
    return tmeanK.subtract(273.15).rename('tmeanC')
                 .copyProperties(img, ['system:time_start']);
  });
}

var Gsc = ee.Number(0.0820); // MJ m^-2 min^-1 (solar constant, FAO-56)
var pixelLat = ee.Image.pixelLonLat().select('latitude');

// Extraterrestrial radiation Ra (MJ m^-2 day^-1) for month (1..12) at latitude (deg)
function raMJperDay(latDegImg, month) {
  var mIdx = ee.Number(month).toInt().subtract(1);   // 0..11
  var J    = ee.Number(midMonthJ.get(mIdx));         // day of year
  var phi  = latDegImg.multiply(Math.PI / 180);      // radians (Image)

  // FAO-56 eqns:
  var dr    = ee.Number(1).add(ee.Number(0.033)
                .multiply(ee.Number(2 * Math.PI).multiply(J).divide(365).cos())); // inverse dist. Earth-Sun
  var delta = ee.Number(0.409)
                .multiply(ee.Number(2 * Math.PI).multiply(J).divide(365).subtract(1.39).sin()); // solar declination

  // Sunset hour angle: ωs = arccos(-tan(phi) * tan(delta))
  var ws = phi.tan().multiply(delta.tan()).multiply(-1).clamp(-1, 1).acos(); // Image

  // Terms: Ra = (24*60/π) * Gsc * dr * [ωs sinφ sinδ + cosφ cosδ sinωs]
  var sinphi   = phi.sin();                       // Image
  var cosphi   = phi.cos();                       // Image
  var sindelta = ee.Image.constant(delta.sin());  // Image
  var cosdelta = ee.Image.constant(delta.cos());  // Image

  var term1 = ws.multiply(sinphi.multiply(sindelta));          // Image
  var term2 = cosphi.multiply(cosdelta).multiply(ws.sin());    // Image

  var k = ee.Number(24 * 60).divide(Math.PI);                  // Number
  var coeff = ee.Image.constant(k.multiply(Gsc).multiply(dr)); // Image

  return coeff.multiply(term1.add(term2)); // MJ m^-2 day^-1 (Image)
}

// Hargreaves PET (FAO-56) — mm/day, then ×days → mm/month
// ET0 = 0.408 * 0.0023 * Ra(MJ m^-2 day^-1) * (Tmean+17.8) * sqrt(Tmax - Tmin)
function petHargreavesMM(Ra_MJ_day, TmeanC_m, TmaxC_m, TminC_m, days) {
  var dT = TmaxC_m.subtract(TminC_m).max(0); // ensure non-negative diurnal range
  var coeff = ee.Image.constant(0.408 * 0.0023); // MJ→mm conversion included
  var pet_day = Ra_MJ_day.multiply(coeff)
                 .multiply(TmeanC_m.add(17.8))
                 .multiply(dT.sqrt())           // mm/day
                 .max(0);                       // clamp to >= 0
  return pet_day.multiply(days).rename('pet');   // mm/month
}

// Monthly pack that produces tmeanC, P (mm/month), PET (mm/month)
function monthlyPack(tmeanDailyC, prDaily, tmaxDailyK, tminDailyK) {
  return ee.ImageCollection(
    months.map(function(m){
      var tmeanC_m = tmeanDailyC.filter(ee.Filter.calendarRange(m, m, 'month'))
                                .mean().rename('tmeanC');

      var tmaxC_m  = tmaxDailyK.filter(ee.Filter.calendarRange(m, m, 'month'))
                               .mean().subtract(273.15).rename('tmaxC');
      var tminC_m  = tminDailyK.filter(ee.Filter.calendarRange(m, m, 'month'))
                               .mean().subtract(273.15).rename('tminC');

      // pr is kg m^-2 s^-1 (≈ mm/s). Convert to mm/month: * 86400 * days
      var pr_m   = prDaily.filter(ee.Filter.calendarRange(m, m, 'month')).mean();
      var days   = ee.Number(daysList.get(ee.Number(m).toInt().subtract(1)));
      var P_mm   = pr_m.multiply(86400).multiply(days).rename('pr'); // mm/month

      var Ra_m   = raMJperDay(pixelLat, m); // MJ m^-2 day^-1
      var PET_m  = petHargreavesMM(Ra_m, tmeanC_m, tmaxC_m, tminC_m, days); // mm/month

      return tmeanC_m.addBands([P_mm, PET_m]).set('month', m);
    })
  );
}

// Monthly mean temps for hottest/coldest mosaics
function monthlyMeanTemps(tmeanDailyC) {
  return ee.ImageCollection(
    months.map(function(m) {
      return tmeanDailyC
        .filter(ee.Filter.calendarRange(m, m, 'month'))
        .mean()
        .rename('monthlyMean')
        .set('month', m);
    })
  );
}

// --------------------------- Data selection -------------------------------
var cmip6 = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.eq('scenario', 'ssp585'))
  .filter(ee.Filter.eq('model', 'UKESM1-0-LL'))
  .filterDate('2100-01-01', '2101-01-01');

var tmeanC6_daily = dailyTmeanC(cmip6);
var pr6_daily     = cmip6.select('pr');       // precipitation (kg m^-2 s^-1)
var tmax6_dailyK  = cmip6.select('tasmax');   // K
var tmin6_dailyK  = cmip6.select('tasmin');   // K

// Hottest/coldest (from mean T)
var monthlyTemp6  = monthlyMeanTemps(tmeanC6_daily);
var hottest6 = monthlyTemp6.qualityMosaic('monthlyMean')
  .select('monthlyMean').rename('hottestC');
var coldest6 = monthlyTemp6
  .map(function(img){ return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean').rename('coldestC');

var monthlyClim = monthlyPack(tmeanC6_daily, pr6_daily, tmax6_dailyK, tmin6_dailyK);
var hottestC_global = hottest6;
var coldestC_global = coldest6;

// Latitude masks for seasonality logic
var northMask = pixelLat.gt(15);
var tropic    = pixelLat.abs().lte(15);
var southMask = pixelLat.lt(-15);

// -------------------- UNEP Aridity Index (AI = P/PET) ---------------------
var P_ann   = monthlyClim.select('pr' ).sum().rename('P_ann');      // mm/yr
var PET_ann = monthlyClim.select('pet').sum().rename('PET_ann');    // mm/yr
var AI      = P_ann.divide(PET_ann).rename('AI');

// Valid mask
var validMask = P_ann.mask()
  .and(PET_ann.mask())
  .and(hottestC_global.mask())
  .and(coldestC_global.mask());

// -------------------- Aridity base (UNEP thresholds) ----------------------
// Codes: 6=Humid (H), 5=Semihumid (G), 2=Semiarid (S), 1=Arid Desert (D)
var aridBase = ee.Image(6) // start as Humid
  .updateMask(validMask)
  .where(AI.lt(0.75), 5)   // Semihumid
  .where(AI.lt(0.50), 2)   // Semiarid
  .where(AI.lt(0.25), 1)   // Arid Desert
  .rename('aridity');

// --------------------- Seasonality overrides (HS ratio) -------------------
var P_hs = monthlyClim
  .filter(ee.Filter.inList('month',[4,5,6,7,8,9]))
  .select('pr').sum().rename('P_highSun')
  .updateMask(P_ann.mask());

var HS = P_hs.divide(P_ann).rename('HS_ratio').updateMask(P_ann.mask());

// Climate class logic (your overrides preserved)
var clim = aridBase
  .where(northMask.and(aridBase.neq(1)).and(HS.gte(0.8)), 4) // Monsoon
  .where(northMask.and(aridBase.neq(1)).and(HS.lt(0.4)),  3) // Mediterranean
  .where(tropic.and(aridBase.neq(1)).and(HS.lt(0.2)),     4) // Monsoon
  .where(tropic.and(aridBase.neq(1)).and(HS.gte(0.8)),    4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.lt(0.2)),  4) // Monsoon
  .where(southMask.and(aridBase.neq(1)).and(HS.gte(0.6)), 3) // Mediterranean
  .where(hottestC_global.lt(15).or(coldestC_global.lt(-20)), 7) // no aridity
  .updateMask(validMask)
  .rename('climateClass');

// -------------------------- Styling & Map layer ---------------------------
var codeColorMap = {
  1: "#FF0000", // D: Arid Desert
  2: "#FFA500", // S: Semiarid
  3: "#FFFF00", // M: Mediterranean
  4: "#FF00FF", // W: Monsoon
  5: "#00FF00", // G: Semihumid
  6: "#006600", // H: Humid
  7: "#0000FF"  // no aridity
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = clim
  .remap(codes, indices)
  .updateMask(validMask)
  .rename('classIndex');

Map.addLayer(
  discreteLand,
  {min: 0, max: indices.length - 1, palette: palette},
  'Climate — UKESM1-0-LL SSP585 2100 (UNEP AI)',
  true,
  0.7
);
// Map.setCenter(0, 20, 2);

// Optional QA layers (toggle on if helpful)
// Map.addLayer(AI.updateMask(validMask), {min:0, max:2, palette:['#f00','#ff0','#0f0','#006400']}, 'UNEP AI (P/PET)', false);
// Map.addLayer(P_ann.updateMask(validMask), {min:0, max:3000}, 'P_ann (mm/yr)', false);
// Map.addLayer(PET_ann.updateMask(validMask), {min:0, max:3000}, 'PET_ann (mm/yr)', false);
