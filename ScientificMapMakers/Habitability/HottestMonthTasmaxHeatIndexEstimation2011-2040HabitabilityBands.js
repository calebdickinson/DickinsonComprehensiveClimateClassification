// =====================================================
// HOTTEST-MONTH HEAT INDEX (°F) — 5°F BANDS + CLICK INFO
// =====================================================

// ---------- SETTINGS ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';
var NODATA_U16   = 65535;

// ---------- LOAD MONTHLY TASMAX / TASMIN / PR ----------
var imgs = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  var tasmax = ee.Image(
    ASSET_PREFIX +
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' +
    mm + '_2011_2040_norm'
  );

  var tasmin = ee.Image(
    ASSET_PREFIX +
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' +
    mm + '_2011_2040_norm'
  );

  var pr = ee.Image(
    ASSET_PREFIX +
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' +
    mm + '_2011_2040_norm'
  );

  var tmaxF = tasmax
    .updateMask(tasmax.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15)
    .multiply(9 / 5)
    .add(32);

  var tminC = tasmin
    .updateMask(tasmin.neq(NODATA_U16))
    .multiply(0.1)
    .subtract(273.15);

  var pr_mm = pr
    .updateMask(pr.neq(NODATA_U16))
    .multiply(0.1); // mm

  // ---------- ESTIMATE DEW POINT (°C) ----------
  var tdC = tminC.subtract(
    pr_mm.expression(
      "(p <= 0) ? 5 : (p < 25) ? 3 : (p < 100) ? 1 : -1",
      { p: pr_mm }
    )
  );

  // ---------- RELATIVE HUMIDITY ----------
  var tC = tmaxF.subtract(32).multiply(5 / 9);

  var es = tC.expression(
    "6.112 * exp((17.67 * T) / (T + 243.5))",
    { T: tC }
  );

  var e = tdC.expression(
    "6.112 * exp((17.67 * Td) / (Td + 243.5))",
    { Td: tdC }
  );

  var rh = e.divide(es).multiply(100).clamp(1, 100);

  // ---------- HEAT INDEX (°F) ----------
  var T = tmaxF;
  var R = rh;

  var HI = T.expression(
    "-42.379 + 2.04901523*T + 10.14333127*R" +
    " - 0.22475541*T*R - 0.00683783*T*T" +
    " - 0.05481717*R*R + 0.00122874*T*T*R" +
    " + 0.00085282*T*R*R - 0.00000199*T*T*R*R",
    { T: T, R: R }
  ).where(T.lt(80), T); // HI undefined below 80°F

  imgs.push(
    HI.rename('hiF')
      .set('month', m)
  );
}

var hiMonthly = ee.ImageCollection(imgs);

// ---------- HOTTEST MONTH BY TASMAX ----------
var hottest = ee.ImageCollection(
  hiMonthly.map(function (img) {
    return img.addBands(
      ee.Image.constant(img.get('month')).toUint8().rename('month')
    );
  })
).qualityMosaic('hiF');

// ---------- NOAA HEAT INDEX CATEGORY BANDING ----------
var hi = hottest.select('hiF');

var hiCategory = ee.Image(0)
  .where(hi.gte(80).and(hi.lt(90)), 1)     // Caution
  .where(hi.gte(90).and(hi.lt(103)), 2)    // Extreme Caution
  .where(hi.gte(103).and(hi.lt(125)), 3)   // Danger
  .where(hi.gte(125), 4)                   // Extreme Danger
  .updateMask(hi.gte(80))                  // mask <80°F
  .rename('hiCat');

// ---------- NOAA PALETTE ----------
var noaaPalette = [
  '#ffcc00', // Caution
  '#ff0000', // Extreme Caution
  '#990099', // Danger
  '#000000', // Extreme Danger
];

// ---------- MAP ----------
Map.addLayer(
  hiCategory,
  {
    min: 1,
    max: 4,
    palette: noaaPalette
  },
  'NOAA Heat Index Stress Categories (Hottest Month)',
  true,
  0.85
);

Map.centerObject(ee.Geometry.Point([0, 0]), 2);

// ---------- UI ----------
var panel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: 'rgba(255,255,255,0.9)'
  }
});

panel.add(ui.Label('Hottest Month Heat Index', {
  fontWeight: 'bold',
  fontSize: '14px'
}));

var label = ui.Label('', {
  fontSize: '16px',
  fontWeight: 'bold'
});

panel.add(label);
ui.root.add(panel);

// ---------- CLICK ----------
Map.onClick(function (coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);

  hottest.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: pt,
    scale: 500,
    bestEffort: true
  }).evaluate(function (v) {
    if (!v || v.hiF === null) {
      label.setValue('No data');
      return;
    }

    var f = v.hiF.toFixed(1);
    var c = ((v.hiF - 32) * 5 / 9).toFixed(1);

    var monthNames = [
      '', 'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];

    label.setValue(
      f + ' °F  /  ' + c + ' °C\nPeak month: ' + monthNames[v.month]
    );
  });
});
