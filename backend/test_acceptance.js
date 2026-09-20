const {
  getStatelessLatestObservation,
  getStatelessCompareObservations,
  getStatelessFields,
  saveStatelessField
} = require('./utils/statelessStore');

// Ensure demo fields are registered for acceptance testing
saveStatelessField({
  _id: 'field_demo_01',
  fieldName: 'North Plot - Wheat & Maize Block',
  crop: 'Wheat',
  area: 4.5,
  location: { latitude: 28.6139, longitude: 77.2090 }
});
saveStatelessField({
  _id: 'field_demo_02',
  fieldName: 'South Plot - Cotton & Mustard Block',
  crop: 'Cotton',
  area: 3.2,
  location: { latitude: 28.6200, longitude: 77.2150 }
});


console.log('====================================================');
console.log('FASAL DRISHTI - FIELD MONITORING ACCEPTANCE TESTS');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Spatial Telemetry Views & Isolation
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Spatial Telemetry Data for Field 1 & Field 2 ---');
const field1Obs = getStatelessLatestObservation('field_demo_01');
assert(field1Obs.success === true, 'Field 1 latest observation returned successfully');
assert(field1Obs.data.satelliteData.ndviMean === 0.78, 'Field 1 NDVI is 0.78 (real observation)');
assert(field1Obs.data.satelliteData.spatialZones.length === 3, 'Field 1 has 3 verified spatial zones');

const field2Obs = getStatelessLatestObservation('field_demo_02');
assert(field2Obs.success === true, 'Field 2 latest observation returned successfully');
assert(field2Obs.data.satelliteData.ndviMean === 0.65, 'Field 2 NDVI is 0.65 (isolated from Field 1)');
assert(field2Obs.data.satelliteData.spatialZones.length === 0, 'Field 2 spatialZones is empty -> shows "Zone-level real data is not available for this field yet."');

// -----------------------------------------------------------------------------
// TEST 2: Temporal Analysis - 7 Days Ago
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: 7 Days Ago Comparison on Field 1 ---');
const comp7d = getStatelessCompareObservations('field_demo_01', '7d');
assert(comp7d.canCompare === true, '7d comparison is possible');
assert(comp7d.daysApart === 8, 'Nearest available observation is 8 days prior within tolerance window (5-9d)');
assert(comp7d.nearestDateNotice && comp7d.nearestDateNotice.includes('Nearest available observation:'), 'Displays honest notice: "Nearest available observation"');
assert(comp7d.previous.satelliteData.ndviMean === 0.74, '7d historical NDVI is 0.74 (real stored observation)');
assert(comp7d.deltas.ndviDelta === 0.04, 'NDVI delta is real (0.78 - 0.74 = +0.04)');
assert(comp7d.deltas.comparisonNarrativeEn.includes('NDVI increased from 0.74 to 0.78'), 'Narrative is derived strictly from real observations');

// -----------------------------------------------------------------------------
// TEST 3: Temporal Analysis - 15 Days Ago
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: 15 Days Ago Comparison on Field 1 ---');
const comp15d = getStatelessCompareObservations('field_demo_01', '15d');
assert(comp15d.canCompare === true, '15d comparison is possible');
assert(comp15d.daysApart === 14, 'Nearest available observation is 14 days prior within tolerance window (12-18d)');
assert(comp15d.previous.satelliteData.ndviMean === 0.69, '15d historical NDVI is 0.69 (different from 7d!)');
assert(comp15d.deltas.ndviDelta === 0.09, '15d NDVI delta is real (0.78 - 0.69 = +0.09)');

// -----------------------------------------------------------------------------
// TEST 4: Temporal Analysis - 30 Days Ago (Honest Empty State)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: 30 Days Ago Comparison on Field 1 ---');
const comp30d = getStatelessCompareObservations('field_demo_01', '30d');
assert(comp30d.canCompare === false, '30d comparison returns canCompare = false because no observation exists in 24-36d window');
assert(comp30d.message === 'No real observation available for 30-day comparison.', 'Returns honest message: "No real observation available for 30-day comparison." (NO fabricated data!)');

// -----------------------------------------------------------------------------
// TEST 5: Temporal Analysis - Previous Observation
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Previous Observation on Field 1 ---');
const compPrev = getStatelessCompareObservations('field_demo_01', 'previous');
assert(compPrev.canCompare === true, 'Previous observation comparison is possible');
assert(compPrev.daysApart === 2, 'Previous observation is 2 days prior (14/09/2026)');
assert(compPrev.previous.satelliteData.ndviMean === 0.77, 'Previous observation NDVI is 0.77');
assert(compPrev.deltas.ndviDelta === 0.01, 'Delta correctly calculated as +0.01');

// -----------------------------------------------------------------------------
// TEST 6: Field Isolation - Field 1 vs Field 2
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: Field Isolation ---');
const compField2 = getStatelessCompareObservations('field_demo_02', '7d');
assert(compField2.canCompare === false, 'Field 2 has no historical observations -> canCompare = false');
assert(compField2.message === 'No real observation available for this period.', 'Field 2 shows honest empty state message');
assert(compField2.current.fieldId === 'field_demo_02', 'Field 2 observation belongs strictly to field_demo_02, never field_demo_01');

// -----------------------------------------------------------------------------
// TEST 7: Missing Data Handling
// -----------------------------------------------------------------------------
console.log('\n--- TEST 7: Unknown / Unobserved Field ---');
const unobservedField = getStatelessCompareObservations('field_non_existent', '7d');
assert(unobservedField.success === false && unobservedField.message === 'Field not found.', 'Returns field not found for unmapped ID');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('====================================================');

if (failCount > 0) process.exit(1);
