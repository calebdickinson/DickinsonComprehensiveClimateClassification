// =============================
// CONFIG
// =============================
var PREFIX      = 'projects/ordinal-crowbar-459807-m2/assets/';
var PENMAN_ID   = PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1';
var NODATA_U16  = 65535;
var SCALE_PR    = 0.1;
var SCALE_PET   = 0.1;
var EPS         = 1e-6;
var KHG         = 5;

var CRS = 'EPSG:4326';
var TRANSFORM = [0.008333333333, 0, -180, 0, -0.008333333333, 90];

// Where to save in your EE Assets (ratio version):
var OUT_ASSET_ID = 'projects/ordinal-crowbar-459807-m2/assets/AI_ratio_global_30arcsec';

// =============================
// Penman mask
// =============================
var penman = ee.Image(PENMAN_ID);
var penmanMask = penman.mask().and(penman.neq(NODATA_U16)).and(penman.gt(0));
function applyMask(img){ return ee.Image(img).updateMask(penmanMask); }

// =============================
// tas (°C)
/// ===========================
var tas = {};
for (var m=1; m<=12; m++){
  var mm = (m<10? '0'+m : ''+m);
  var img = ee.Image(PREFIX + 'CHELSA_tas_' + mm + '_1981-2010_V2-1_u16');
  tas[mm] = applyMask(img.updateMask(img.neq(NODATA_U16)).multiply(0.1).subtract(273.15));
}

// =============================
// pr (mm/month)
// =============================
var prList = [];
for (var n=1; n<=12; n++){
  var nn = (n<10? '0'+n : ''+n);
  var pimg = ee.Image(PREFIX + 'CHELSA_pr_' + nn + '_1981-2010_V2-1_u16');
  prList.push(applyMask(pimg.updateMask(pimg.neq(NODATA_U16)).multiply(SCALE_PR).rename('pr')));
}
var prMonthly = ee.ImageCollection(prList);
var P_ann = prMonthly.sum().rename('P_ann');  // mm/yr

// =============================
// AI_penman
// =============================
var PET_penman_ann = applyMask(penman.multiply(SCALE_PET)).multiply(12);
var AI_penman = P_ann.divide(PET_penman_ann.max(ee.Image.constant(EPS))).rename('AI_penman');

// =============================
// AI_hargreaves
// =============================
var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
var Jmid = [15,46,75,105,135,162,198,228,258,288,318,344];
var PI= Math.PI, Gsc = 0.0820;

var latRad = applyMask(ee.Image.pixelLonLat().select('latitude').multiply(PI/180));

function Ra(m){
  var J = Jmid[m-1];
  var dr = ee.Image(1).add(ee.Image(0.033).multiply(Math.cos((2*PI/365)*J)));
  var delta = ee.Image(0.409).multiply(Math.sin((2*PI/365)*J - 1.39));
  var ws = latRad.tan().multiply(delta.tan()).multiply(-1).max(-1).min(1).acos();
  var Ra_MJ_day = ee.Image((24*60)/PI).multiply(Gsc).multiply(dr)
      .multiply(latRad.sin().multiply(delta.sin())
      .add(latRad.cos().multiply(delta.cos()).multiply(ws.sin())));
  return applyMask(Ra_MJ_day.max(0));
}

function getTasExt(m){
  var mm = (m<10? '0'+m : ''+m);
  var tmax = ee.Image(PREFIX + 'CHELSA_tasmax_' + mm + '_1981-2010_V2-1')
              .updateMask(penmanMask).multiply(0.1).subtract(273.15);
  var tmin = ee.Image(PREFIX + 'CHELSA_tasmin_' + mm + '_1981-2010_V2-1')
              .updateMask(penmanMask).multiply(0.1).subtract(273.15);
  return {tmax: tmax, tmin: tmin};
}

var petHargList = [];
for (var k=1; k<=12; k++){
  var mm = (k<10? '0'+k : ''+k);
  var t = getTasExt(k);
  var tmean = tas[mm];
  var diurnal = t.tmax.subtract(t.tmin).max(0);
  var Ra_k = Ra(k);

  // Seed with projected image; multiply constant last
  var et0_mm_day = Ra_k
      .multiply(tmean.add(17.8))
      .multiply(diurnal.sqrt())
      .multiply(0.0023 * KHG)
      .rename('et0_mm_day');

  petHargList.push(et0_mm_day.multiply(daysInMonth[k-1]).rename('pet_mm_month'));
}
var PET_harg_ann = ee.ImageCollection(petHargList).sum().rename('PET_harg_ann');
var AI_harg = P_ann.divide(PET_harg_ann.max(ee.Image.constant(EPS))).rename('AI_harg');

// =============================
// AI_ratio (Penman ÷ Hargreaves)
// =============================
var AI_ratio = AI_penman.divide(AI_harg.max(ee.Image.constant(EPS))).rename('AI_ratio');

// Optional view before export: center 1.0 (Penman==Hargreaves)
Map.setOptions('SATELLITE');
Map.centerObject(ee.Geometry.Point([-98,39]), 4);
Map.addLayer(
  AI_ratio, 
  {min: 0.5, max: 1.5, palette: ['#313695','#ffffbf','#a50026']}, 
  'AI ratio (Penman/Hargreaves, 0.5–1.5)',
  true
);

// =============================
// Export **to ASSET** (30″ grid, inset region to avoid antimeridian issues)
// =============================
Export.image.toAsset({
  image: AI_ratio.reproject({crs: CRS, crsTransform: TRANSFORM}),
  description: 'Export_AI_ratio_to_Asset',
  assetId: OUT_ASSET_ID,
  region: ee.Geometry.Rectangle([-179.995, -89.995, 179.995, 89.995], null, false),
  crs: CRS,
  crsTransform: TRANSFORM,
  maxPixels: 1e13
});

// Console hint
print('Task created. After it finishes, load ratio asset:', OUT_ASSET_ID);
