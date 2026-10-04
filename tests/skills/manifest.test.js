/**
 * tests/skills/manifest.test.js
 * 
 * Test suite for Aura Skill Manifest schema and static validation.
 */

import assert from 'node:assert';
import { defaultSkillValidator } from '../../skill-runtime/validator/skill-validator.js';
import { defaultSkillRegistry } from '../../skill-runtime/registry/skill-registry.js';

async function runTests() {
  console.log('--- Running Manifest Validation Tests ---');

  // Test 1: Valid Core Manifests
  const validCoreManifest = {
    schemaVersion: '1.0.0',
    id: 'test-skill',
    name: 'Test Skill',
    version: '1.0.0',
    description: 'A valid test skill description',
    source: 'core',
    category: 'development',
    permissions: ['READ', 'WRITE'],
    tools: ['filesystem']
  };

  const val1 = defaultSkillValidator.validateManifest(validCoreManifest);
  assert.strictEqual(val1.valid, true, 'Valid manifest should pass validation');
  assert.strictEqual(val1.errors.length, 0);
  console.log('✓ Test 1 Passed: Valid manifest accepted');

  // Test 2: Reject Missing ID
  const missingId = { ...validCoreManifest, id: undefined };
  const val2 = defaultSkillValidator.validateManifest(missingId);
  assert.strictEqual(val2.valid, false, 'Missing id must fail');
  assert(val2.errors.some(e => e.includes('id')), 'Error must mention missing id');
  console.log('✓ Test 2 Passed: Missing ID rejected');

  // Test 3: Reject Invalid Characters in ID
  const invalidId = { ...validCoreManifest, id: 'bad skill ID!@#' };
  const val3 = defaultSkillValidator.validateManifest(invalidId);
  assert.strictEqual(val3.valid, false, 'Invalid characters in id must fail');
  console.log('✓ Test 3 Passed: Invalid ID characters rejected');

  // Test 4: Reject Invalid Source
  const invalidSource = { ...validCoreManifest, source: 'untrusted-random' };
  const val4 = defaultSkillValidator.validateManifest(invalidSource);
  assert.strictEqual(val4.valid, false, 'Invalid source must fail');
  console.log('✓ Test 4 Passed: Invalid source rejected');

  // Test 5: Reject Invalid Permission Level
  const invalidPerm = { ...validCoreManifest, permissions: ['SUPERUSER_ROOT_ACCESS'] };
  const val5 = defaultSkillValidator.validateManifest(invalidPerm);
  assert.strictEqual(val5.valid, false, 'Unknown permission level must fail');
  console.log('✓ Test 5 Passed: Unknown permission rejected');

  // Test 6: Validate Real Adapted & Core Manifests in Registry
  await defaultSkillRegistry.scan();
  assert(defaultSkillRegistry.skills.size >= 297, 'Registry must have at least 297 skills');
  
  for (const skill of defaultSkillRegistry.skills.values()) {
    const res = defaultSkillValidator.validateManifest(skill.manifest);
    assert.strictEqual(res.valid, true, `Skill ${skill.id} manifest must be valid`);
  }
  console.log(`✓ Test 6 Passed: All ${defaultSkillRegistry.skills.size} registered skills passed schema validation`);

  console.log('All Manifest Validation Tests Passed Successfully!\n');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
