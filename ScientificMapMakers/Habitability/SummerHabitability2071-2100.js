// =====================================================
// HOTTEST-MONTH HEAT INDEX (°F) — CATEGORY MAP + CLICK INFO
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
    mm + '_2071_2100_norm'
  );

  var tasmin = ee.Image(
    ASSET_PREFIX +
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmin_' +
    mm + '_2071_2100_norm'
  );

  var pr = ee.Image(
    ASSET_PREFIX +
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_pr_' +
    mm + '_2071_2100_norm'
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

  // =====================================================
  // ESTIMATE DEW POINT (°C) — CONTINUOUS, HUMIDITY-AWARE
  // =====================================================
  // Td ≈ Tmin in humid climates
  // Td drops sharply in arid climates
  // Penalty ranges smoothly from 0–6 °C

  var tdC = tminC.subtract(
    pr_mm.expression(
      'clamp(6 * exp(-0.02 * p), 0, 6)',
      { p: pr_mm }
    )
  );

  // ---------- RELATIVE HUMIDITY ----------
  var tC = tmaxF.subtract(32).multiply(5 / 9);

  var es = tC.expression(
    '6.112 * exp((17.67 * T) / (T + 243.5))',
    { T: tC }
  );

  var e = tdC.expression(
    '6.112 * exp((17.67 * Td) / (Td + 243.5))',
    { Td: tdC }
  );

  var rh = e.divide(es).multiply(100).clamp(1, 100);

  // ---------- HEAT INDEX (°F) ----------
  var HI = tmaxF.expression(
    '-42.379 + 2.04901523*T + 10.14333127*R' +
    ' - 0.22475541*T*R - 0.00683783*T*T' +
    ' - 0.05481717*R*R + 0.00122874*T*T*R' +
    ' + 0.00085282*T*R*R - 0.00000199*T*T*R*R',
    { T: tmaxF, R: rh }
  ).where(tmaxF.lt(80), tmaxF); // HI undefined < 80°F

  imgs.push(
    HI.rename('hiF')
      .set('month', m)
  );
}

var hiMonthly = ee.ImageCollection(imgs);

// =====================================================
// MONTH WITH HIGHEST HEAT INDEX
// =====================================================
var hottest = ee.ImageCollection(
  hiMonthly.map(function (img) {
    return img.addBands(
      ee.Image.constant(img.get('month')).toUint8().rename('month')
    );
  })
).qualityMosaic('hiF');

// =====================================================
// NOAA + UNINHABITABLE CATEGORY BANDING
// =====================================================
var hi = hottest.select('hiF');

var hiCategory = ee.Image(0)
  .where(hi.gte(80).and(hi.lt(95)), 1)      // Caution
  .where(hi.gte(95).and(hi.lt(110)), 2)     // Extreme Caution
  .where(hi.gte(110).and(hi.lt(125)), 3)    // Danger
  .where(hi.gte(125).and(hi.lt(140)), 4)    // Extreme Danger
  .where(hi.gte(140), 5)                    // Uninhabitable
  .updateMask(hi.gte(80))
  .rename('hiCat');

// ---------- PALETTE ----------
var noaaPalette = [
  '#ffcc00', // Category 1 Summer - Mildly Dangerous
  '#ff0000', // Category 2 Summer - Moderately Dangerous
  '#990099', // Category 3 Summer - Extremely Dangerous
  '#000000', // Category 4 Summer - Mostly Uninhabitable
  '#ffffff'  // Category 5 Summer - Fully Uninhabitable
];

// ---------- MAP ----------
Map.addLayer(
  hiCategory,
  { min: 1, max: 5, palette: noaaPalette },
  'NOAA Heat Index Stress Categories (Month of Maximum HI)',
  true,
  0.85
);

Map.centerObject(ee.Geometry.Point([0, 0]), 2);

// =====================================================
// UI PANEL
// =====================================================
var panel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: 'rgba(255,255,255,0.9)'
  }
});

panel.add(ui.Label('Peak Heat Index (Hottest Month)', {
  fontWeight: 'bold',
  fontSize: '14px'
}));

var label = ui.Label('', {
  fontSize: '16px',
  fontWeight: 'bold'
});

panel.add(label);
ui.root.add(panel);

// ---------- CLICK HANDLER ----------
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
