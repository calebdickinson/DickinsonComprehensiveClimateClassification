// =============================
// CONFIG
// =============================
var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';
var PENMAN_BASE = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'; // u16 mean (0.1 → mm/month)
var NODATA_U16  = 65535;
var EPS         = 1e-6;
var KHG         = 5;  // Hargreaves multiplier

// 30" grid
var CRS = 'EPSG:4326';
var TRANSFORM = [0.008333333333, 0, -180, 0, -0.008333333333, 90];
var WORLD_RECT = ee.Geometry.Rectangle([-179.995, -89.995, 179.995, 89.995], null, false);

// Output: Penman-equivalent PET mean (mm/month) for 2011–2040
var OUT_ASSET_ID = PREFIX + 'CHELSA_pet_penman_mean_2011-2040';

// =============================
// 0) Strict baseline Penman-present mask
// =============================
var penmanBase_u16 = ee.Image(PENMAN_BASE);
var penmanMask = penmanBase_u16.mask()
  .and(penmanBase_u16.neq(NODATA_U16))
  .and(penmanBase_u16.gt(0));
function withPenmanMask(img){ return ee.Image(img).updateMask(penmanMask); }

// =============================
// 1) Helpers: FAO-56 Ra + calendar
// =============================
var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
var Jmid = [15,46,75,105,135,162,198,228,258,288,318,344];
var PI = Math.PI, Gsc = 0.0820;
var latRad = withPenmanMask(ee.Image.pixelLonLat().select('latitude').multiply(PI/180));

function Ra_MJ_m2_day(m){
  var J = Jmid[m-1];
  var dr    = ee.Image(1).add(ee.Image(0.033).multiply(Math.cos((2*PI/365)*J)));
  var delta = ee.Image(0.409).multiply(Math.sin((2*PI/365)*J - 1.39));
  var ws = latRad.tan().multiply(delta.tan()).multiply(-1).max(-1).min(1).acos();
  var term = latRad.sin().multiply(delta.sin())
            .add(latRad.cos().multiply(delta.cos()).multiply(ws.sin()));
  return withPenmanMask( ee.Image((24*60)/PI).multiply(Gsc).multiply(dr).multiply(term).max(0) );
}

// =============================
// 2) BASELINE (1981–2010) Hargreaves PET mean (mm/month)
// =============================
// tas, tasmax, tasmin are 0.1K integers in your CHELSA v2.1 baseline
function base_tasC(mm){
  var id = PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16';
  var im = ee.Image(id);
  return withPenmanMask(im.updateMask(im.neq(NODATA_U16)).multiply(0.1).subtract(273.15)).rename('tasC');
}
function base_extC(mm){
  var idMax = PREFIX + 'CHELSA_tasmax_' + mm + '_1981-2010_V2-1';
  var idMin = PREFIX + 'CHELSA_tasmin_' + mm + '_1981-2010_V2-1';
  var rawMax = ee.Image(idMax), rawMin = ee.Image(idMin);
  // 0.1K integers → °C
  var tmax = withPenmanMask(rawMax.updateMask(rawMax.neq(NODATA_U16)).multiply(0.1).subtract(273.15)).rename('tmaxC');
  var tmin = withPenmanMask(rawMin.updateMask(rawMin.neq(NODATA_U16)).multiply(0.1).subtract(273.15)).rename('tminC');
  return {tmaxC: tmax, tminC: tmin};
}

var petHargMonthly_base = [];
for (var m=1; m<=12; m++){
  var mm = (m<10? '0'+m : ''+m);
  var tmean = base_tasC(mm);
  var ext   = base_extC(mm);
  var diurnal = ext.tmaxC.subtract(ext.tminC).max(0);
  var Ra = Ra_MJ_m2_day(m);

  var et0_mm_day = Ra
    .multiply(tmean.add(17.8))
    .multiply(diurnal.sqrt())
    .multiply(0.0023 * KHG)
    .rename('et0_mm_day');

  petHargMonthly_base.push(
    et0_mm_day.multiply(daysInMonth[m-1]).rename('pet_harg_mm_month_base')
  );
}

// Baseline Harg PET mean (mm/month)
var PET_harg_mean_base = ee.ImageCollection(petHargMonthly_base).sum().divide(12).rename('PET_harg_mean_base');

// Baseline Penman PET mean from asset (u16 0.1 → mm/month)
var PET_penman_mean_base = withPenmanMask(penmanBase_u16.multiply(0.1)).rename('PET_penman_mean_base');

// Ratio R = Harg / Pen (baseline)
var PET_ratio_HoverP = PET_harg_mean_base.divide(PET_penman_mean_base.max(ee.Image.constant(EPS))).rename('PET_ratio_HoverP');

// =============================
// 3) FUTURE (2011–2040) Hargreaves PET mean (mm/month) at 30"
// =============================
function fut_tasC(mm){
  var id = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tas_' + mm + '_2011_2040_norm';
  var im = ee.Image(id);
  return withPenmanMask(im.updateMask(im.neq(NODATA_U16)).multiply(0.1).subtract(273.15)).rename('tasC');
}
function fut_extC(mm){
  var idMax = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' + mm + '_2011_2040_norm';
  var idMin = PREFIX + 'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' + mm + '_2011_2040_norm';
  var rawMax = ee.Image(idMax), rawMin = ee.Image(idMin);
  var tmax = withPenmanMask(rawMax.updateMask(rawMax.neq(NODATA_U16)).multiply(0.1).subtract(273.15)).rename('tmaxC');
  var tmin = withPenmanMask(rawMin.updateMask(rawMin.neq(NODATA_U16)).multiply(0.1).subtract(273.15)).rename('tminC');
  return {tmaxC: tmax, tminC: tmin};
}

var petHargMonthly_fut = [];
for (var k=1; k<=12; k++){
  var mm2 = (k<10? '0'+k : ''+k);
  var tmeanF = fut_tasC(mm2);
  var extF   = fut_extC(mm2);
  var diurnalF = extF.tmaxC.subtract(extF.tminC).max(0);
  var RaF = Ra_MJ_m2_day(k);

  var et0F_mm_day = RaF
    .multiply(tmeanF.add(17.8))
    .multiply(diurnalF.sqrt())
    .multiply(0.0023 * KHG)
    .rename('et0_mm_day');

  petHargMonthly_fut.push(
    et0F_mm_day.multiply(daysInMonth[k-1]).rename('pet_harg_mm_month_future')
  );
}

// Future Harg PET mean (mm/month)
var PET_harg_mean_future = ee.ImageCollection(petHargMonthly_fut).sum().divide(12).rename('PET_harg_mean_future');

// =============================
// 4) Bias-correct to Penman-equivalent mean (mm/month)
//     Penman_future ≈ Harg_future / (Harg/Pen)_baseline
// =============================
var PET_penman_mean_future = PET_harg_mean_future
  .divide(PET_ratio_HoverP.max(ee.Image.constant(EPS)))
  .rename('CHELSA_pet_penman_mean_2011-2040')
  .max(0);

// =============================
// 5) Quick preview
// =============================
Map.setOptions('SATELLITE');
Map.centerObject(ee.Geometry.Point([-98,39]), 4);
Map.addLayer(PET_ratio_HoverP, {min:0.6, max:1.6, palette:['#313695','#ffffbf','#a50026']}, 'Baseline PET ratio (Harg/Pen)', false);
Map.addLayer(PET_harg_mean_future, {min:0, max:250, palette:['#f7fbff','#6baed6','#08306b']}, 'PET mean (Harg) 2011–2040', false);
Map.addLayer(PET_penman_mean_future, {min:0, max:250, palette:['#ffffe5','#7fcdbb','#2c7fb8']}, 'PET mean (Penman-equivalent) 2011–2040', true);

// =============================
// 6) Export 30" asset (inset region to avoid antimeridian issues)
// =============================
Export.image.toAsset({
  image: PET_penman_mean_future
    .reproject({crs: CRS, crsTransform: TRANSFORM})
    .clip(WORLD_RECT),
  description: 'Export_CHELSA_pet_penman_mean_2011-2040',
  assetId: OUT_ASSET_ID,
  region: WORLD_RECT,
  crs: CRS,
  crsTransform: TRANSFORM,
  maxPixels: 1e13
});

print('Task created. Will export to:', OUT_ASSET_ID);
