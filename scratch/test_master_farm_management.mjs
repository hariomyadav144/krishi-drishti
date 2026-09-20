// Comprehensive Automated Verification for Fasal Drishti Farm Mapping & Multiple Farm Management
import assert from 'assert';

// Mock localStorage in Node
const storage = {};
global.window = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Import services and utilities
import { 
  getFarms, 
  getFarmById, 
  getActiveFarmId, 
  setActiveFarmId, 
  getActiveFarm, 
  activateFarm, 
  saveFarm, 
  deleteFarm, 
  migrateLegacyBoundaries,
  purgeLegacyMockStorage 
} from '../frontend/src/services/fieldService.js';

import { 
  validateGpsQuality, 
  formatGpsAccuracy 
} from '../frontend/src/utils/gpsUtils.js';

import { 
  calculatePolygonArea, 
  calculatePolygonCenter 
} from '../frontend/src/utils/areaUtils.js';

console.log('🧪 Starting Fasal Drishti Master Specification Test Suite...\n');

// -------------------------------------------------------------
// Test 1: GPS Quality Control (Section 5)
// -------------------------------------------------------------
console.log('--- TEST 1: GPS Quality Control Validation ---');

const now = Date.now();
// Stale reading > 20s
const staleReading = { lat: 26.7601, lng: 83.3734, accuracy: 8, timestamp: now - 25000 };
const staleCheck = validateGpsQuality(staleReading);
assert.strictEqual(staleCheck.isValid, false, 'Stale GPS reading (>20s) must be rejected');
assert.strictEqual(staleCheck.reason, 'stale', 'Rejection reason must be stale');
console.log('✓ Rejected stale GPS fix (>20 seconds old)');

// Poor accuracy > 60m
const poorAccuracyReading = { lat: 26.7601, lng: 83.3734, accuracy: 75, timestamp: now - 2000 };
const poorCheck = validateGpsQuality(poorAccuracyReading);
assert.strictEqual(poorCheck.isValid, false, 'Poor accuracy (>60m) must be rejected');
assert.strictEqual(poorCheck.accuracyTier, 'poor', 'Tier must be poor');
console.log('✓ Rejected poor accuracy GPS fix (>60m)');

// Good accuracy <= 10m
const goodReading = { lat: 26.7601, lng: 83.3734, accuracy: 6, timestamp: now - 1000 };
const goodCheck = validateGpsQuality(goodReading);
assert.strictEqual(goodCheck.isValid, true, 'Good GPS reading must be accepted');
assert.strictEqual(goodCheck.accuracyTier, 'good', 'Tier must be good');
console.log('✓ Accepted good GPS fix (<=10m)');

// Acceptable accuracy <= 25m
const acceptableReading = { lat: 26.7601, lng: 83.3734, accuracy: 18, timestamp: now - 3000 };
const acceptableCheck = validateGpsQuality(acceptableReading);
assert.strictEqual(acceptableCheck.isValid, true, 'Acceptable GPS reading must be accepted');
assert.strictEqual(acceptableCheck.accuracyTier, 'acceptable');
console.log('✓ Accepted acceptable GPS fix (<=25m)');

// -------------------------------------------------------------
// Test 2: Area & Centroid Calculation (Section 14 & 15)
// -------------------------------------------------------------
console.log('\n--- TEST 2: Polygon Area & Centroid Calculation ---');

const fieldCorners = [
  { lat: 26.760100, lng: 83.373400 },
  { lat: 26.761000, lng: 83.373400 },
  { lat: 26.761000, lng: 83.374500 },
  { lat: 26.760100, lng: 83.374500 }
];

const area = calculatePolygonArea(fieldCorners);
const centroid = calculatePolygonCenter(fieldCorners);

assert(area.acres > 0, 'Area in acres must be greater than 0');
assert(centroid && centroid.lat && centroid.lng, 'Centroid must calculate lat and lng');
console.log(`✓ Calculated Area: ${area.formattedAcres} (${area.hectares.toFixed(3)} ha)`);
console.log(`✓ Calculated Centroid: Lat ${centroid.lat.toFixed(5)}°, Lng ${centroid.lng.toFixed(5)}°`);

// -------------------------------------------------------------
// Test 3: Multiple Farm Management & Creation (Sections 3, 16, 17, 18, 19)
// -------------------------------------------------------------
console.log('\n--- TEST 3: Multiple Farm Creation & Persistence ---');
localStorage.clear();

// Create Farm 1 (createNew = true)
const farm1 = await saveFarm({
  name: 'Farm 1',
  farmerName: 'Rameshwar',
  crop: 'Wheat',
  boundary: fieldCorners
}, true);

assert(farm1.id.startsWith('farm_'), 'Farm ID must start with farm_');
assert.strictEqual(farm1.name, 'Farm 1');
assert.strictEqual(getActiveFarmId(), farm1.id, 'Farm 1 should become active farm upon creation');

let farmsList = getFarms();
assert.strictEqual(farmsList.length, 1, 'Should have 1 farm saved');
console.log(`✓ Farm 1 created successfully with ID: ${farm1.id}`);

// Create Farm 2 (createNew = true) with independent boundary
const field2Corners = [
  { lat: 28.5350, lng: 77.3910 },
  { lat: 28.5360, lng: 77.3910 },
  { lat: 28.5360, lng: 77.3925 },
  { lat: 28.5350, lng: 77.3925 }
];

const farm2 = await saveFarm({
  name: 'Farm 2',
  farmerName: 'Rameshwar',
  crop: 'Mustard',
  boundary: field2Corners
}, true);

farmsList = getFarms();
assert.strictEqual(farmsList.length, 2, 'Should have 2 farms saved');
assert.strictEqual(getActiveFarmId(), farm2.id, 'Farm 2 should be active after creation');
console.log(`✓ Farm 2 created successfully with ID: ${farm2.id}`);

// -------------------------------------------------------------
// Test 4: Switching Active Farm (Sections 20 & 21)
// -------------------------------------------------------------
console.log('\n--- TEST 4: Farm Switching & Data Isolation ---');

// Switch back to Farm 1
const activated1 = activateFarm(farm1.id);
assert.strictEqual(activated1.id, farm1.id);
assert.strictEqual(getActiveFarmId(), farm1.id);

// Verify Farm 1 boundary remains Farm 1 boundary
const reloadedFarm1 = getFarmById(farm1.id);
assert.strictEqual(reloadedFarm1.crop, 'Wheat');
assert.strictEqual(reloadedFarm1.boundary[0].lat, 26.760100);

// Verify Farm 2 boundary remains untouched and intact
const reloadedFarm2 = getFarmById(farm2.id);
assert.strictEqual(reloadedFarm2.crop, 'Mustard');
assert.strictEqual(reloadedFarm2.boundary[0].lat, 28.5350);

console.log('✓ Switching between Farm 1 and Farm 2 preserved all independent boundaries and crops');

// -------------------------------------------------------------
// Test 5: Update Existing Farm (Sections 22 & 23)
// -------------------------------------------------------------
console.log('\n--- TEST 5: Update Existing Farm In-Place ---');

const updatedCorners = [
  ...fieldCorners,
  { lat: 26.760050, lng: 83.373950 } // 5th corner
];

const updatedFarm1 = await saveFarm({
  id: farm1.id, // Keeping existing ID
  name: 'Farm 1 - North Parcel',
  crop: 'Wheat (HD-2967)',
  boundary: updatedCorners
}, false); // createNew = false

assert.strictEqual(updatedFarm1.id, farm1.id, 'Existing farm ID must remain unchanged upon update');
assert.strictEqual(updatedFarm1.name, 'Farm 1 - North Parcel');
assert.strictEqual(updatedFarm1.boundary.length, 5, 'Boundary should now have 5 points');

farmsList = getFarms();
assert.strictEqual(farmsList.length, 2, 'Farm list count must remain 2 (NO duplicate farm created)');
console.log('✓ Farm 1 updated in-place without ID mutation or duplication');

// -------------------------------------------------------------
// Test 6: Legacy Migration (Section 37)
// -------------------------------------------------------------
console.log('\n--- TEST 6: Legacy Boundary Data Migration ---');

storage['farm_boundary_points'] = JSON.stringify([
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 200 }
]);
storage['farm_location_latitude'] = '26.7601';
storage['farm_location_longitude'] = '83.3734';

const migrated = migrateLegacyBoundaries();
assert(Array.isArray(migrated), 'Migrated result must be an array');
assert.strictEqual(migrated.length, 3, 'Must migrate 3 points');
assert(typeof migrated[0].lat === 'number', 'Migrated point must have numeric lat');
assert(storage['farm_boundary_geo_points'], 'farm_boundary_geo_points must be persisted');
console.log('✓ Successfully migrated legacy screen points to geographic coordinates');

console.log('\n=============================================');
console.log('🎉 ALL FASAL DRISHTI SPEC TESTS PASSED 100%!');
console.log('=============================================\n');
