print(
  ee.FeatureCollection('FAO/GAUL/2015/level0')
    .aggregate_array('ADM0_NAME')
    .distinct()
    .sort()
);