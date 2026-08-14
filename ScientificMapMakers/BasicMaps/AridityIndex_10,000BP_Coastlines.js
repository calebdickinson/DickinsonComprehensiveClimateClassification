// === Aridity Index Map (CHELSA TraCE21k, 10 ka BP) — Hargreaves PET ===

var PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/'; // ends with '/'
var NODATA_U16 = 65535;

var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
// FAO-56 mid-month day-of-year (non-leap), used for Ra
var midDOY = [15,46,74,105,135,166,196,227,258,288,319,349];

// ---------- tasmin / tasmax / tas (°C) per month ----------
var tminImgs = [], tmaxImgs = [], tasImgs = [];
for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);
  var minId = PREFIX + 'CHELSA_TraCE21k_tasmin_' + mm + '_-100_V1-0';
  var maxId = PREFIX + 'CHELSA_TraCE21k_tasmax_' + mm + '_-100_V1-0';

  var rawMin = ee.Image(minId);
  var rawMax = ee.Image(maxId);

  var tminC = rawMin.updateMask(rawMin.neq(NODATA_U16))
                     .multiply(0.1).subtract(273.15)
                     .rename('tmin').set('month', m);
  var tmaxC = rawMax.updateMask(rawMax.neq(NODATA_U16))
                     .multiply(0.1).subtract(273.15)
                     .rename('tmax').set('month', m);
  var tasC  = tminC.rename('t').add(tmaxC.rename('t'))
                     .divide(2)
                     .rename('monthlyMean').set('month', m);

  tminImgs.push(tminC);
  tmaxImgs.push(tmaxC);
  tasImgs.push(tasC);
}
var tasMonthly = ee.ImageCollection(tasImgs);

// (retained from original script2 — currently unused downstream, kept for parity/possible future use)
var hottestC_global = tasMonthly.qualityMosaic('monthlyMean').select('monthlyMean').rename('hottestC');
var coldestC_global = tasMonthly
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

// ---------- pr (mm/month) per month ----------
var prImgs = [];
for (var n = 1; n <= 12; n++) {
  var nn = (n < 10 ? '0' + n : '' + n);
  var pid = PREFIX + 'CHELSA_TraCE21k_pr_' + nn + '_-100_V1-0';
  var rawPr = ee.Image(pid);
  var pr = rawPr.updateMask(rawPr.neq(NODATA_U16))
                .rename('pr').set('month', n);
  prImgs.push(pr);
}
var prMonthly = ee.ImageCollection(prImgs);

// ---------- Hargreaves PET, month by month ----------
var lat = ee.Image.pixelLonLat().select('latitude');
var phi = lat.multiply(Math.PI / 180);

var petImgs = [];
for (var k = 1; k <= 12; k++) {
  var idx = k - 1;
  var J = midDOY[idx];

  var dr    = 1 + 0.033 * Math.cos(2 * Math.PI * J / 365);
  var delta = 0.409 * Math.sin(2 * Math.PI * J / 365 - 1.39);

  var arg = phi.tan().multiply(-Math.tan(delta)).clamp(-1, 1);
  var ws  = arg.acos();

  var Ra_MJ = ee.Image(1).expression(
    '(24*60/pi) * Gsc * dr * (ws*sin(phi)*sin(delta) + cos(phi)*cos(delta)*sin(ws))',
    {
      pi: Math.PI,
      Gsc: 0.0820,
      dr: dr,
      delta: delta,
      ws: ws,
      phi: phi
    }
  );
  var Ra_mm = Ra_MJ.multiply(0.408).rename('Ra');

  var Tmin = tminImgs[idx];
  var Tmax = tmaxImgs[idx];
  var Tmean = tasImgs[idx];
  var diff = Tmax.subtract(Tmin).max(0);

  var petDaily = Tmean.add(17.8)
                       .multiply(diff.sqrt())
                       .multiply(0.0023)
                       .multiply(Ra_mm);

  var petMonthly = petDaily.multiply(daysInMonth[idx])
                            .rename('PET')
                            .set('month', k);
  petImgs.push(petMonthly);
}
var petMonthlyColl = ee.ImageCollection(petImgs);

// Annual sums / ratios
var P_ann   = prMonthly.sum().rename('P_ann');
var P_hs    = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9])).sum().rename('P_highSun');
var PET_ann = petMonthlyColl.sum().rename('PET_ann');
var AI      = P_ann.divide(PET_ann).rename('AI');

// ---------- Original script2 12-class aridity scheme, unchanged ----------
var aridBase = ee.Image(1)
  .where(AI.lt(1.00), 2)
  .where(AI.lt(0.90), 3)
  .where(AI.lt(0.80), 4)
  .where(AI.lt(0.70), 5)
  .where(AI.lt(0.60), 6)
  .where(AI.lt(0.50), 7)
  .where(AI.lt(0.40), 8)
  .where(AI.lt(0.30), 9)
  .where(AI.lt(0.20), 10)
  .where(AI.lt(0.10), 11)
  .where(AI.lt(0.05), 12)
  .rename('aridity');

var clim = aridBase
  .updateMask(AI.mask())
  .rename('climateClass');

// Visualization
var codeColorMap = {
  1:  "#004444",
  2:  "#008844",
  3:  "#00AA66",
  4:  "#00FF88",
  5:  "#00DD00",
  6:  "#AAFF00",
  7:  "#FFFf00",
  8:  "#FFDD00",
  9:  "#FF8800",
 10:  "#FF0000",
 11:  "#880000",
 12:  "#440000"
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = clim
  .remap(codes, indices)
  .rename('classIndex');
  
// ---------- Bedrock depth mask (exclude bedrock > 50 m below sea level) ----------
var bedrock = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
var bedrockMask = bedrock.gte(-50);

clim = clim.updateMask(bedrockMask);

var discreteLand = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discreteLand,
  { min: 0, max: indices.length - 1, palette: palette },
  'Climate (LGM, Hargreaves PET)',
  true, 0.7
);

// Paste extensions here