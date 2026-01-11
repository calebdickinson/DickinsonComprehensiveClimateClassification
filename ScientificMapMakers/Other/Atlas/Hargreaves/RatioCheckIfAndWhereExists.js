// === Visualize AI_diff_global in greyscale ===
// Update the asset ID if different:
var ASSET_ID = 'projects/ordinal-crowbar-459807-m2/assets/AI_diff_global_30arcsec';

// Load and rename
var AI_diff = ee.Image(ASSET_ID).select(0).rename('AI_diff_global');

// Print to confirm properties and basic stats
print('AI_diff_global asset:', AI_diff);
print('Projection:', AI_diff.projection());

// Show valid data mask (green = has data)
var mask = AI_diff.mask();
Map.addLayer(mask, {min: 0, max: 1, palette: ['000000', '00FF00']}, 'Valid data mask', false);

// Show greyscale visualization
Map.addLayer(AI_diff, {min: -1, max: 1, palette: ['000000', 'FFFFFF']}, 'AI_diff (±1)');
Map.addLayer(AI_diff, {min: -0.3, max: 0.3, palette: ['000000', 'FFFFFF']}, 'AI_diff (±0.3)', false);
Map.addLayer(AI_diff, {min: -0.1, max: 0.1, palette: ['000000', 'FFFFFF']}, 'AI_diff (±0.1)', false);

// Center on world
Map.setOptions('SATELLITE');
Map.centerObject(ee.Geometry.Rectangle([-180, -90, 180, 90]), 2);
