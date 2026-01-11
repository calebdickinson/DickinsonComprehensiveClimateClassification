// =====================================================
// DRIEST-MONTH PRECIP ≥ ANNUAL PET / N
// =====================================================

// ---------- SETTINGS ----------
var ASSET_PREFIX = 'projects/ordinal-crowbar-459807-m2/assets/';
var NODATA_U16   = 65535;

var SCALE_PR = 1;   // CHELSA pr_u16 → mm/month
var N = 240;          // <-- physically meaningful now

// ---------- LOAD MONTHLY PRECIP ----------
var prImgs = [];

for (var m = 1; m <= 12; m++) {
  var mm = (m < 10 ? '0' + m : '' + m);

  var pr = ee.Image(
    ASSET_PREFIX +
    'CHELSA_pr_' +
    mm + '_1981-2010_V2-1_u16'
  );

  var pr_mm = pr
    .updateMask(pr.neq(NODATA_U16))
    .multiply(SCALE_PR)     // mm/month
    .rename('pr');

  prImgs.push(pr_mm);
}

var prMonthly = ee.ImageCollection(prImgs);

// Driest-month precipitation (mm)
var driestPr = prMonthly.min().rename('p_driest');

// ---------- LOAD PET (MEAN MONTH → ANNUAL, TRUE UNITS) ----------
var petAnnual = ee.Image(
  ASSET_PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'
)
  .updateMask(
    ee.Image(
      ASSET_PREFIX + 'CHELSA_pet_penman_mean_1981-2010_V2-1'
    ).neq(NODATA_U16)
  )
  .multiply(12)            // mm/year (NO scaling factor)
  .rename('pet_ann');

// ---------- CONDITION ----------
var threshold = petAnnual.divide(N);
var condition = driestPr.gte(threshold);

// Masked highlight image
var highlight = condition.selfMask();

// ---------- MAP ----------
Map.addLayer(
  highlight,
  { palette: ['#008800'] },
  'Driest month ≥ PET / ' + N,
  true,
  0.8
);

// Optional sanity layers (use when tuning N)
// Map.addLayer(driestPr, {min: 0, max: 150}, 'Driest month P (mm)');
// Map.addLayer(threshold, {min: 0, max: 150}, 'PET / ' + N);

// ---------- UI PANEL ----------
var panel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: 'rgba(255,255,255,0.9)'
  }
});

panel.add(ui.Label('Driest-Month Moisture Test', {
  fontWeight: 'bold',
  fontSize: '14px'
}));

var label = ui.Label('', {
  fontSize: '13px',
  fontWeight: 'bold'
});

panel.add(label);
ui.root.add(panel);

// ---------- CLICK ----------
Map.onClick(function (coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);

  ee.Dictionary({
    pmin: driestPr.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: pt,
      scale: 500,
      bestEffort: true
    }).get('p_driest'),

    pet: petAnnual.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: pt,
      scale: 500,
      bestEffort: true
    }).get('pet_ann')
  }).evaluate(function (v) {

    if (!v || v.pmin === null || v.pet === null) {
      label.setValue('No data');
      return;
    }

    var thresh = v.pet / N;

    label.setValue(
      'Driest month P: ' + v.pmin.toFixed(1) + ' mm\n' +
      'PET / ' + N + ': ' + thresh.toFixed(1) + ' mm\n' +
      (v.pmin >= thresh ? '✔ Condition met' : '✖ Condition not met')
    );
  });
});

// ---------- VIEW ----------
Map.setCenter(-111.7897, 43.8260, 7);
