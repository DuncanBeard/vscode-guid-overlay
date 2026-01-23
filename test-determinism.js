/**
 * Test script to verify deterministic visual identity generation
 * Run with: node test-determinism.js
 */

const { generateVisualIdentity } = require('./out/visualIdentity');
const { normalizeGuid, isValidGuid } = require('./out/guidDetector');

console.log('GUID Visual Identity - Determinism Test\n');
console.log('========================================\n');

// Test GUIDs
const testGuids = [
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '123e4567-e89b-12d3-a456-426614174000',
  '00000000-0000-0000-0000-000000000000',
  'ffffffff-ffff-ffff-ffff-ffffffffffff'
];

console.log('Test 1: Visual Identity Generation');
console.log('-----------------------------------\n');

testGuids.forEach(guid => {
  const identity = generateVisualIdentity(guid);
  console.log(`GUID: ${guid}`);
  console.log(`  ${identity.symbol} ${identity.label}`);
  console.log(`  Color: ${identity.color}`);
  console.log(`  Hash: ${identity.rawHash.substring(0, 16)}...`);
  console.log();
});

console.log('Test 2: Determinism Verification');
console.log('---------------------------------\n');

const testGuid = '550e8400-e29b-41d4-a716-446655440000';
console.log(`Testing GUID: ${testGuid}\n`);

// Generate identity 5 times
const identities = [];
for (let i = 0; i < 5; i++) {
  identities.push(generateVisualIdentity(testGuid));
}

// Check all are identical
const allIdentical = identities.every(id =>
  id.label === identities[0].label &&
  id.color === identities[0].color &&
  id.symbol === identities[0].symbol &&
  id.rawHash === identities[0].rawHash
);

console.log(`Generated 5 times:`);
identities.forEach((id, i) => {
  console.log(`  Run ${i + 1}: ${id.symbol} ${id.label} ${id.color}`);
});

console.log(`\nAll identical: ${allIdentical ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Test 3: Case Insensitivity');
console.log('---------------------------\n');

const variations = [
  '550e8400-e29b-41d4-a716-446655440000',
  '550E8400-E29B-41D4-A716-446655440000',
  '550E8400-e29b-41D4-A716-446655440000'
];

const normalized = variations.map(normalizeGuid);
const variationIdentities = normalized.map(generateVisualIdentity);

console.log('Variations:');
variations.forEach((v, i) => {
  const id = variationIdentities[i];
  console.log(`  ${v}`);
  console.log(`    → ${id.symbol} ${id.label} ${id.color}`);
});

const allVariationsIdentical = variationIdentities.every(id =>
  id.label === variationIdentities[0].label &&
  id.color === variationIdentities[0].color &&
  id.symbol === variationIdentities[0].symbol
);

console.log(`\nAll variations identical: ${allVariationsIdentical ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Test 4: Uniqueness Verification');
console.log('--------------------------------\n');

const uniqueGuids = [
  '550e8400-e29b-41d4-a716-446655440000',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '123e4567-e89b-12d3-a456-426614174000'
];

const uniqueIdentities = uniqueGuids.map(generateVisualIdentity);

console.log('Different GUIDs should have different visuals:');
uniqueIdentities.forEach((id, i) => {
  console.log(`  GUID ${i + 1}: ${id.symbol} ${id.label} ${id.color}`);
});

const labelsUnique = new Set(uniqueIdentities.map(id => id.label)).size === uniqueIdentities.length;
const colorsUnique = new Set(uniqueIdentities.map(id => id.color)).size === uniqueIdentities.length;

console.log(`\nLabels unique: ${labelsUnique ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Colors unique: ${colorsUnique ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('========================================');
console.log('All Tests Complete');
console.log('========================================');
