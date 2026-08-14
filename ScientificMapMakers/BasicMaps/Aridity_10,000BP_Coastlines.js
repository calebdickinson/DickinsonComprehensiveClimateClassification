// === LGM Aridity Map (CHELSA TraCE21k, 10 ka BP) — Hargreaves PET ===

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

var hottestC_global = tasMonthly.qualityMosaic('monthlyMean').select('monthlyMean').rename('hottestC');
var coldestC_global = tasMonthly
  .map(function (img) { return img.multiply(-1).copyProperties(img); })
  .qualityMosaic('monthlyMean')
  .multiply(-1)
  .select('monthlyMean')
  .rename('coldestC');

var coldCond = hottestC_global.lt(15).or(coldestC_global.lt(-20));

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
var P_ann = prMonthly.sum().rename('P_ann');
var P_hs  = prMonthly.filter(ee.Filter.inList('month', [4,5,6,7,8,9])).sum().rename('P_highSun');

// ---------- Hargreaves PET, month by month ----------
// Ra (extraterrestrial radiation) depends only on latitude + day-of-year (FAO-56 eqs 21-25).
var lat = ee.Image.pixelLonLat().select('latitude');
var phi = lat.multiply(Math.PI / 180);

var petImgs = [];
for (var k = 1; k <= 12; k++) {
  var idx = k - 1;
  var J = midDOY[idx];

  var dr    = 1 + 0.033 * Math.cos(2 * Math.PI * J / 365);
  var delta = 0.409 * Math.sin(2 * Math.PI * J / 365 - 1.39);

  // ws = arccos(-tan(phi)*tan(delta)), clamped to [-1,1] so polar day/night
  // fall out naturally (acos(1)=0, acos(-1)=pi) without extra branching.
  var arg = phi.tan().multiply(-Math.tan(delta)).clamp(-1, 1);
  var ws  = arg.acos();

  var Ra_MJ = ee.Image(1).expression(
    '(24*60/pi) * Gsc * dr * (ws*sin(phi)*sin(delta) + cos(phi)*cos(delta)*sin(ws))',
    {
      pi: Math.PI,
      Gsc: 0.0820,   // MJ m-2 min-1, solar constant
      dr: dr,
      delta: delta,
      ws: ws,
      phi: phi
    }
  );
  var Ra_mm = Ra_MJ.multiply(0.408).rename('Ra'); // MJ m-2 day-1 → mm/day equivalent

  var Tmin = tminImgs[idx];
  var Tmax = tmaxImgs[idx];
  var Tmean = tasImgs[idx];
  var diff = Tmax.subtract(Tmin).max(0); // guard against negative sqrt input

  // Hargreaves-Samani: PET(mm/day) = 0.0023 * (Tmean+17.8) * sqrt(Tmax-Tmin) * Ra
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
var PET_ann = petMonthlyColl.sum().rename('PET_ann');

var AI = P_ann.divide(PET_ann).rename('AI');

// Treat masked AI (from PET/tas mask) as ocean
var oceanMask = AI.mask().not();

// ---------- Latitude zones (±23.43594°) ----------
var northMask = lat.gt(23.43594);
var southMask = lat.lt(-23.43594);

// ---------- Base aridity classes ----------
var aridBase = ee.Image(6)       // 6 = Humid
  .where(AI.lte(0.1), 8)        // placeholder, real oceans set later
  .where(AI.lt(0.75), 5)        // 5 = Semihumid
  .where(AI.lt(0.50), 2)        // 2 = Semiarid
  .where(AI.lt(0.25), 1)        // 1 = Arid Desert
  .rename('aridity');

// ---------- HS ratio (Apr–Sep share) ----------
var HS = P_hs.divide(P_ann).rename('HS_ratio');

// ---------- Rolling 6-month precipitation dominance (global) ----------
var prList = prMonthly.sort('month').toList(12);

var sixMonthSums = ee.List.sequence(0, 11).map(function(start){
  start = ee.Number(start);
  var idx6 = ee.List.sequence(start, start.add(5))
    .map(function(i){ return ee.Number(i).mod(12); });
  return ee.ImageCollection(
    idx6.map(function(i){ return ee.Image(prList.get(i)); })
  ).sum();
});

var P6ratio = ee.ImageCollection.fromImages(sixMonthSums)
  .max()
  .divide(P_ann)
  .rename('P6ratio');

// ---------- Final climate class: Med first, then global monsoon, then oceans, then cold ----------
var clim = aridBase
  .where(
    northMask.and(HS.lt(0.4))
      .or(southMask.and(HS.gt(0.6)))
      .and(aridBase.neq(1))
      .and(aridBase.neq(8)),
    3
  )
  .where(
    P6ratio.gte(0.8)
      .and(aridBase.neq(1))
      .and(aridBase.neq(8))
      .and(
        northMask.and(HS.lt(0.4))
          .or(southMask.and(HS.gt(0.6)))
          .not()
      ),
    4
  )
  .where(oceanMask, 8)
  .where(coldCond, 7)
  .rename('climateClass');

// Semiarid Monsoon
clim = clim.where(clim.eq(4).and(AI.lt(0.5)), 9);

// Temperate rainforest with Mediterranean seasonality → reclassified Humid
var P_driest = prMonthly.min();
clim = clim.where(
  clim.eq(3).and(P_driest.gte(PET_ann.divide(24))),
  6
);

// Visualization
var codeColorMap = {
  1: "#FF0000", // D: Arid
  2: "#FFAA00", // S: Semiarid
  3: "#FFFF00", // M: Mediterranean
  4: "#FF00FF", // W: Monsoon
  5: "#88FF00", // G: Semihumid
  6: "#008800", // H: Humid
  7: "#0000FF", // no aridity (cold)
  8: "#008888", // ocean
  9: "#884400"  // V: Semiarid Monsoon
};
var keys    = Object.keys(codeColorMap);
var codes   = keys.map(function(k){ return parseInt(k, 10); });
var palette = keys.map(function(k){ return codeColorMap[k]; });
var indices = codes.map(function(_, i){ return i; });

var discreteLand = clim.remap(codes, indices, -1).rename('classIndex');

// ---------- Bedrock depth mask (exclude bedrock > 50 m below sea level) ----------
var bedrock = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock');
var bedrockMask = bedrock.gte(-50);

clim = clim.updateMask(bedrockMask);

var discreteLand = clim.remap(codes, indices, -1).rename('classIndex');

Map.addLayer(
  discreteLand.updateMask(clim.neq(8)),
  { min: 0, max: indices.length - 1, palette: palette },
  'LGM Climate (Hargreaves PET, oceans included; cold wins)',
  true, 0.7
);

// Paste extensions here