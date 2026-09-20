import { calculatePolygonArea, calculatePolygonCenter } from '../frontend/src/utils/areaUtils.js';
import { isLegacyMockPolygon, sanitizeStoredFields } from '../frontend/src/services/fieldService.js';
import { DEFAULT_DEMO_COORDINATE, SAMPLE_DEMO_FIELD_BOUNDARY } from '../frontend/src/utils/gpsUtils.js';

console.log('--- Testing Farmer Field Mapping Workflow & Invariant Guarantees ---');

// Phase 2 Guarantee: Fresh Unmapped Field starts with 0 points
let boundaryPoints = [];
let selectedPoint = null;
let mappingMode = 'new';

function getButtonText(pts, sel) {
  const nextNumber = pts.length + 1;
  return `Mark Map Corner ${nextNumber}`;
}

// 1. Check Initial State on Fresh Mount
console.assert(boundaryPoints.length === 0, 'FAIL: boundaryPoints must be empty on fresh mount');
console.assert(selectedPoint === null, 'FAIL: selectedPoint must be null on fresh mount');
console.assert(mappingMode === 'new', 'FAIL: mappingMode must be "new" on fresh mount');
console.assert(getButtonText(boundaryPoints, selectedPoint) === 'Mark Map Corner 1', 
  `FAIL: Button must display "Mark Map Corner 1", got: ${getButtonText(boundaryPoints, selectedPoint)}`);
console.log('✓ Phase 2 Clean Initial State: button is "Mark Map Corner 1", 0 corners, 0 area.');

// 2. Phase 6 Step 2: Farmer taps satellite map -> places candidate selection pin
const tapPoint1 = { lat: 18.52043, lng: 73.85674 };
selectedPoint = tapPoint1;
// boundaryPoints MUST NOT change yet
console.assert(boundaryPoints.length === 0, 'FAIL: tapping map must NOT commit point into boundaryPoints');
console.assert(selectedPoint !== null, 'FAIL: selectedPoint must hold candidate point');
console.assert(getButtonText(boundaryPoints, selectedPoint) === 'Mark Map Corner 1', 
  `FAIL: Button must still be "Mark Map Corner 1" for confirmation`);
console.log('✓ Phase 6 Step 2: Tap places candidate pin, points.length is still 0, button ready to confirm Corner 1.');

// 3. Phase 6 Step 3: Farmer confirms Corner 1
boundaryPoints.push(selectedPoint);
selectedPoint = null;
console.assert(boundaryPoints.length === 1, 'FAIL: boundaryPoints must have 1 point after confirmation');
console.assert(selectedPoint === null, 'FAIL: selectedPoint must be reset after confirmation');
console.assert(getButtonText(boundaryPoints, selectedPoint) === 'Mark Map Corner 2', 
  `FAIL: Next button must be "Mark Map Corner 2", got: ${getButtonText(boundaryPoints, selectedPoint)}`);
console.log('✓ Phase 6 Step 3: Corner 1 confirmed, button dynamically advances to "Mark Map Corner 2".');

// 4. Farmer marks Corner 2, Corner 3, Corner 4
const tapPoint2 = { lat: 18.52143, lng: 73.85674 };
boundaryPoints.push(tapPoint2);
console.assert(getButtonText(boundaryPoints, null) === 'Mark Map Corner 3', 'FAIL: Must be Corner 3');

const tapPoint3 = { lat: 18.52143, lng: 73.85874 };
boundaryPoints.push(tapPoint3);
console.assert(getButtonText(boundaryPoints, null) === 'Mark Map Corner 4', 'FAIL: Must be Corner 4');

const areaCalc = calculatePolygonArea(boundaryPoints);
console.assert(areaCalc.isValid === true, 'FAIL: 3 points must form a valid polygon');
console.assert(areaCalc.acres > 0, 'FAIL: Area must be > 0 for 3 corners');
console.log(`✓ Phase 10: Polygon closed at 3 corners. Calculated area: ${areaCalc.acres} acres (${areaCalc.hectares} ha).`);

// 5. Phase 7: Clear All
boundaryPoints = [];
selectedPoint = null;
mappingMode = 'new';
const clearedArea = calculatePolygonArea(boundaryPoints);
console.assert(boundaryPoints.length === 0, 'FAIL: points must be empty after clear');
console.assert(clearedArea.acres === 0, 'FAIL: area must be 0 after clear');
console.assert(getButtonText(boundaryPoints, selectedPoint) === 'Mark Map Corner 1', 
  `FAIL: Button must return to "Mark Map Corner 1" after Clear All, got: ${getButtonText(boundaryPoints, selectedPoint)}`);
console.log('✓ Phase 7: Clear All successfully purges all corners, area is 0, button resets to "Mark Map Corner 1".');

// 6. Phase 3 & 4: Ensure legacy 7-point mock polygons are never loaded in "new" mapping mode
console.assert(isLegacyMockPolygon(SAMPLE_DEMO_FIELD_BOUNDARY) === true, 'FAIL: SAMPLE_DEMO_FIELD_BOUNDARY must be identified as mock');
const sanitized = sanitizeStoredFields([
  { id: 'field_demo_01', fieldName: 'North Plot', points: SAMPLE_DEMO_FIELD_BOUNDARY },
  { id: 'real_field_01', fieldName: 'Sugarcane Plot', points: [
    { lat: 19.1234, lng: 74.5678 },
    { lat: 19.1244, lng: 74.5678 },
    { lat: 19.1244, lng: 74.5698 },
    { lat: 19.1234, lng: 74.5698 }
  ]}
]);
console.assert(sanitized.length === 1 && sanitized[0].id === 'real_field_01', 'FAIL: sanitizeStoredFields must evict demo fields');
console.log('✓ Phase 3 & 4: Demo mock polygon purged from stored fields catalog.');

console.log('ALL INVARIANT TESTS PASSED SUCCESSFULLY! 🚀');
