// =====================================================
// HOTTEST-MONTH TASMAX (°F) — 5°F BANDS + CLICK INFO
// =====================================================

// ---------- SETTINGS ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';
var NODATA_U16   = 65535;

// ---------- LOAD MONTHLY TASMAX (CLIENT-SIDE LOOP) ----------
var tasmaxImgs = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  var id =
    ASSET_PREFIX +
    'CHELSA_ukesm1-0-ll_r1i1p1f1_w5e5_ssp585_tasmax_' +
    mm +
    '_2011_2040_norm';

  var raw = ee.Image(id);

  var img = raw
    .updateMask(raw.neq(NODATA_U16))
    .multiply(0.1)        // 0.1 K
    .subtract(273.15)     // → °C
    .multiply(9 / 5)
    .add(32)              // → °F
    .rename('tmaxF')
    .set('month', m);

  tasmaxImgs.push(img);
}

var tasmaxMonthly = ee.ImageCollection(tasmaxImgs);

// ---------- HOTTEST MONTH (VALUE + MONTH, HOMOGENEOUS TYPES) ----------
var hottestWithMonth = ee.ImageCollection(
  tasmaxMonthly.map(function (img) {
    return img
      .select('tmaxF')
      .rename('tmaxF')
      .addBands(
        ee.Image
          .constant(img.get('month'))
          .toUint8()              // 🔑 CRITICAL FIX
          .rename('month')
      );
  })
).qualityMosaic('tmaxF');

// ---------- 5°F BANDING ----------
var band5F = hottestWithMonth
  .select('tmaxF')
  .divide(5)
  .floor()
  .multiply(5)
  .rename('band5F');

// ---------- COLORFUL PALETTE (PURPLE → BLUE → GREEN → YELLOW → ORANGE → RED → BLACK) ----------
var palette = [
  '#5e00a1', // purple
  '#3b4cc0', // indigo
  '#2c7fb8', // blue
  '#1fa187', // teal-green
  '#4ac16d', // green
  '#a0da39', // yellow-green
  '#fde725', // yellow
  '#fdae61', // orange
  '#f46d43', // red-orange
  '#d73027', // red
  '#7f0000', // dark red
  '#000000'  // black
];

// ---------- MAP LAYER ----------
Map.addLayer(
  band5F,
  {
    min: 32,
    max: 132,
    palette: palette
  },
  'Hottest Month tasmax (5°F bands)',
  true,
  0.75
);

Map.centerObject(ee.Geometry.Point([0, 0]), 2);

// =====================
// UI PANEL
// =====================

var panel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: 'rgba(255,255,255,0.9)'
  }
});

panel.add(ui.Label('Hottest Month tasmax', {
  fontWeight: 'bold',
  fontSize: '14px'
}));

var label = ui.Label('', {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '6px 0 0 0'
});

panel.add(label);
ui.root.add(panel);

// ---------- CLICK HANDLER ----------
Map.onClick(function (coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);

  hottestWithMonth
    .reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: pt,
      scale: 500,
      bestEffort: true
    })
    .evaluate(function (v) {
      if (!v || v.tmaxF === null) {
        label.setValue('No data');
        return;
      }

      var f = v.tmaxF.toFixed(1);
      var c = ((v.tmaxF - 32) * 5 / 9).toFixed(1);

      var monthNames = [
        '', 'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
      ];

      label.setValue(
        f + ' °F  /  ' + c + ' °C\nPeak month: ' + monthNames[v.month]
      );
    });
});
