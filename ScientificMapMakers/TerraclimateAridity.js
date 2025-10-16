// UNEP Aridity Index (P/PET) using TerraClimate PET (mm/month) and PR (mm/month)
// Period defaults to 1991–2020 climatology. Change dates as needed.

// ----------------------------------------
// Inputs & period
// ----------------------------------------
var START = '1961-01-01';
var END   = '1990-12-31';

// TerraClimate monthly time series (has 'pr' and 'pet' in mm/month)
var TC = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
  .filterDate(START, END)
  .select(['pr','pet']);

// Derive annual-mean P and PET over the chosen period
var startYear = ee.Date(START).get('year');
var endYear   = ee.Date(END).get('year');
var nYears    = ee.Number(endYear.subtract(startYear)).add(1);

// Sum all months, then divide by number of years → annual mean (mm/yr)
var P_ann_mean   = TC.select('pr' ).sum().divide(nYears).rename('P_ann_mean');    // mm/yr
var PET_ann_mean = TC.select('pet').sum().divide(nYears).rename('PET_ann_mean');  // mm/yr

// AI = P / PET (unitless)
var AI = P_ann_mean.divide(PET_ann_mean).rename('AI');

// Valid mask where both P and PET exist
var validMask = P_ann_mean.mask().and(PET_ann_mean.mask());

// ----------------------------------------
// UNEP classes (your thresholds)
//   1: Desert (<0.25)
//   2: Semiarid [0.25, 0.50)
//   5: Dry-subhumid [0.50, 0.75)
//   6: Humid (>=0.75)
// ----------------------------------------
var m_desert = AI.lt(0.025).toByte();
var m_semi   = AI.gte(0.025).and(AI.lt(0.050)).toByte();
var m_dsub   = AI.gte(0.050).and(AI.lt(0.075)).toByte();
var m_humid  = AI.gte(0.075).toByte();

// Contiguous index 0..3 for display
var classIdx = m_desert.multiply(0)
  .add(m_semi.multiply(1))
  .add(m_dsub.multiply(2))
  .add(m_humid.multiply(3))
  .updateMask(validMask)
  .toInt16()
  .rename('AI_class_idx');

// Your class codes (1,2,5,6) if you want to export/use them
var classCode = m_desert.multiply(1)
  .add(m_semi.multiply(2))
  .add(m_dsub.multiply(5))
  .add(m_humid.multiply(6))
  .updateMask(validMask)
  .toInt16()
  .rename('AI_class_code');

// ----------------------------------------
// Display
// ----------------------------------------
var palette = [
  '#FF0000', // Desert
  '#FFA500', // Semiarid
  '#00FF00', // Dry-subhumid
  '#006600'  // Humid
];

Map.addLayer(
  classIdx,
  {min: 0, max: 3, palette: palette},
  'UNEP AI classes (TerraClimate PET, ' + startYear.getInfo() + '–' + endYear.getInfo() + ')',
  true, 0.7
);

// Optional: also visualize continuous AI
// Map.addLayer(AI.updateMask(validMask), {min:0, max:2, palette:['#8c510a','#f6e8c3','#01665e']}, 'AI (P/PET)', false);

// Center somewhere if desired
// Map.setCenter(-98.5, 39.8, 4);
