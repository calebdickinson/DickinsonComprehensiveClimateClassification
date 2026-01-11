// ----------------------------------------
// CHELSA v2.1 UNEP Aridity Index (P/PET)
// Period: 1981–2010
// ----------------------------------------

// Load CHELSA monthly precipitation (in mm/month)
var CHELSA_PR = ee.ImageCollection('CHELSA/V2_1/climatology')
  .filter(ee.Filter.eq('variable', 'pr'));

// Sum 12 months to get annual total precipitation (mm/year)
var P_ann = CHELSA_PR.reduce(ee.Reducer.sum()).rename('P_ann');

// Load your uploaded PET mean file (in mm/month)
var PET_mean = ee.Image('projects/ordinal-crowbar-459807-m2/assets/CHELSA_pet_penman_mean_1981_2010_V2-1');  // replace with actual asset ID

// Multiply monthly mean PET by 12 to get PET in mm/year
var PET_ann = PET_mean.multiply(12).rename('PET_ann');

// Compute Aridity Index (AI = P / PET)
var AI = P_ann.divide(PET_ann).rename('AI');

// Valid data mask
var validMask = P_ann.mask().and(PET_ann.mask());

// ----------------------------------------
// UNEP AI Classes
// ----------------------------------------

var m_desert = AI.lt(0.25).toByte();
var m_semi   = AI.gte(0.25).and(AI.lt(0.50)).toByte();
var m_dsub   = AI.gte(0.50).and(AI.lt(0.75)).toByte();
var m_humid  = AI.gte(0.75).toByte();

var classIdx = m_desert.multiply(0)
  .add(m_semi.multiply(1))
  .add(m_dsub.multiply(2))
  .add(m_humid.multiply(3))
  .updateMask(validMask)
  .toInt16()
  .rename('AI_class_idx');

var classCode = m_desert.multiply(1)
  .add(m_semi.multiply(2))
  .add(m_dsub.multiply(5))
  .add(m_humid.multiply(6))
  .updateMask(validMask)
  .toInt16()
  .rename('AI_class_code');

// ----------------------------------------
// Visualization
// ----------------------------------------

var palette = [
  '#FF0000', // 0: Desert
  '#FFA500', // 1: Semiarid
  '#00FF00', // 2: Dry-subhumid
  '#006600'  // 3: Humid
];

Map.addLayer(
  classIdx,
  {min: 0, max: 3, palette: palette},
  'UNEP AI classes (CHELSA PET, 1981–2010)',
  true, 0.7
);

// Optional: continuous AI visualization
// Map.addLayer(AI.updateMask(validMask), {min:0, max:2, palette:['#8c510a','#f6e8c3','#01665e']}, 'AI (P/PET)', false);

Map.setCenter(0, 20, 2);
