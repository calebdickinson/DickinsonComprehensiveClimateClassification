// UNEP Aridity Index (P/PET in mm/yr) using FAO-56 Penman-Monteith PET
// WorldClim v1 (1961–1990) monthly Tmax/Tmin/Prec

// ----------------------------------------
// Inputs & constants
// ----------------------------------------
var WC = ee.ImageCollection('WORLDCLIM/V1/MONTHLY');
var months = ee.List.sequence(1, 12);
var daysInMonth = ee.List([31,28,31,30,31,30,31,31,30,31,30,31]);  // non-leap climatology
var midDOY = ee.List([15,46,75,105,135,162,198,228,258,288,318,344]);

var latDeg = ee.Image.pixelLonLat().select('latitude');
var latRad = latDeg.multiply(Math.PI/180);

var elev = ee.Image('USGS/SRTMGL1_003').select('elevation').unmask(0); // meters

// FAO constants
var Gsc   = 0.0820;          // MJ m-2 min-1
var sigma = 4.903e-9;        // MJ K-4 m-2 day-1 (Stefan-Boltzmann)
var alpha = 0.23;            // Albedo for reference crop
var kRs   = 0.16;            // Hargreaves Rs coefficient (interior sites)
var u2    = ee.Image.constant(2.0); // m/s (assumed)

// ----------------------------------------
// Helpers (FAO-56)
// ----------------------------------------
function satVapPress(Tc) { // kPa
  return ee.Image(0.6108).multiply( (ee.Image(17.27).multiply(Tc))
          .divide(Tc.add(237.3)).exp() );
}

function slopeSVP(Tc) { // Δ, kPa/°C
  var es = satVapPress(Tc);
  return ee.Image(4098).multiply(es).divide( Tc.add(237.3).pow(2) );
}

function atmosPressure(z) { // kPa, z in m
  return ee.Image(101.3)
    .multiply( ee.Image( (293.0 - 0.0065).toString() ).expression(
      '(293.0 - 0.0065*z)/293.0', {'z': z}
    ).pow(5.26) );
}

function psychroConst(P) { // gamma, kPa/°C
  return ee.Image(0.000665).multiply(P);
}

// Extraterrestrial radiation Ra (MJ m-2 day-1) for day-of-year J
function Ra_MJm2day(phiRad, J) {
  var Jimg = ee.Image.constant(J);
  var dr  = ee.Image(1).add( ee.Image(0.033).multiply( Jimg.multiply(2*Math.PI/365).cos() ) );
  var delta = ee.Image(0.409).multiply( Jimg.multiply(2*Math.PI/365).subtract(1.39).sin() );
  var omega_s = phiRad.tan().multiply(delta.tan()).multiply(-1).acos();
  var part = omega_s.multiply(phiRad.sin()).multiply(delta.sin())
             .add( phiRad.cos().multiply(delta.cos()).multiply(omega_s.sin()) );
  return ee.Image(24*60/Math.PI).multiply(Gsc).multiply(dr).multiply(part); // MJ m-2 day-1
}

// Clear-sky radiation Rso (MJ m-2 day-1)
function Rso_from_Ra(Ra, z) {
  return ee.Image(0.75).add( ee.Image(2e-5).multiply(z) ).multiply(Ra);
}

// ----------------------------------------
// Build monthly climate with PET (mm/month)
// ----------------------------------------
var monthlyPET = months.map(function(m){
  m = ee.Number(m);
  var im = WC.filter(ee.Filter.eq('month', m)).first();

  var tmax = ee.Image(im).select('tmax').multiply(0.1);  // °C
  var tmin = ee.Image(im).select('tmin').multiply(0.1);  // °C
  var tmean = tmax.add(tmin).divide(2);                  // °C
  var pr = ee.Image(im).select('prec');                  // mm/month (as provided)

  // FAO components
  var P = atmosPressure(elev);           // kPa
  var gamma = psychroConst(P);           // kPa/°C
  var Delta = slopeSVP(tmean);           // kPa/°C

  var es_tmax = satVapPress(tmax);       // kPa
  var es_tmin = satVapPress(tmin);       // kPa
  var es = es_tmax.add(es_tmin).divide(2);     // kPa
  var ea = es_tmin; // FAO proxy when RH is unavailable: ea ≈ es(Tmin)

  // Extraterrestrial & clear-sky radiation (daily), then Hargreaves Rs
  var J = ee.Number(midDOY.get(m.subtract(1)));
  var Ra = Ra_MJm2day(latRad, J);               // MJ m-2 day-1
  var Rso = Rso_from_Ra(Ra, elev);              // MJ m-2 day-1
  var TdRange = tmax.subtract(tmin).max(0);
  var Rs = ee.Image(kRs).multiply(TdRange.sqrt()).multiply(Ra);  // MJ m-2 day-1
  var Rns = ee.Image(1 - alpha).multiply(Rs);

  // Net longwave radiation (daily)
  var tmaxK4 = tmax.add(273.16).pow(4);
  var tminK4 = tmin.add(273.16).pow(4);
  var termTemp = tmaxK4.add(tminK4).divide(2);
  var termVap  = ee.Image(0.34).subtract( ee.Image(0.14).multiply(ea.sqrt()) );
  var termClr  = ee.Image(1.35).multiply( Rs.divide(Rso.max(1e-6)) ).subtract(0.35);
  var Rnl = ee.Image(sigma).multiply(termTemp).multiply(termVap).multiply(termClr);

  var Rn = Rns.subtract(Rnl);           // MJ m-2 day-1
  var G  = ee.Image(0);                 // soil heat flux ≈ 0 for monthly

  // FAO-56 PM ET0 (mm/day)
  var num = ee.Image(0.408).multiply(Delta).multiply(Rn.subtract(G))
    .add( gamma.multiply( ee.Image(900).divide(tmean.add(273.0)) )
    .multiply(u2).multiply(es.subtract(ea)) );

  var den = Delta.add( gamma.multiply( ee.Image(1).add( ee.Image(0.34).multiply(u2) ) ) );

  var ET0_day = num.divide(den).max(0);                     // mm/day
  var dm = ee.Number(daysInMonth.get(m.subtract(1)));
  var ET0_mon = ET0_day.multiply(dm);                       // mm/month

  return pr.rename('pr').addBands(ET0_mon.rename('pet')).set('month', m);
});

var monthlyClim = ee.ImageCollection(monthlyPET);

// ----------------------------------------
// Annual P, PET, AI (UNEP units)
// ----------------------------------------
var P_ann   = monthlyClim.select('pr').sum();     // mm/yr
var PET_ann = monthlyClim.select('pet').sum();    // mm/yr
var AI = P_ann.divide(PET_ann).rename('AI');      // unitless

var landMask = P_ann.add(PET_ann).gt(0).toByte();

var m_desert = AI.lt(0.25).toByte();                             
var m_semi   = AI.gte(0.25).toByte().multiply( AI.lt(0.50).toByte() );
var m_dsub   = AI.gte(0.50).toByte().multiply( AI.lt(0.75).toByte() );
var m_humid  = AI.gte(0.75).toByte();

// Build a contiguous palette index: 0..3
var classIdx = m_desert.multiply(0)
  .add(m_semi.multiply(1))
  .add(m_dsub.multiply(2))
  .add(m_humid.multiply(3))
  .updateMask(landMask)
  .toInt16()
  .rename('AI_class_idx');

var classCode = m_desert.multiply(1)
  .add(m_semi.multiply(2))
  .add(m_dsub.multiply(5))
  .add(m_humid.multiply(6))
  .updateMask(landMask)
  .toInt16()
  .rename('AI_class_code');

// ----------------------------------------
// Display
// ----------------------------------------
var palette = [
  '#FF0000', 
  '#FFA500', 
  '#00FF00', 
  '#006600'  
];

Map.addLayer(
  classIdx,
  {min: 0, max: 3, palette: palette},
  'UNEP AI classes (Penman-Monteith)',
  true,
  0.7
);
