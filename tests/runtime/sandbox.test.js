/**
 * tests/runtime/sandbox.test.js
 * 
 * Test suite for Sandbox confinement, path boundaries, security filters,
 * and environment isolation.
 */

import assert from 'node:assert';
import { defaultSandboxExecutor } from '../../skill-runtime/sandbox/sandbox-executor.js';
import { toolRegistry } from '../../tools/index.js';

async function runTests() {
  console.log('--- Running Sandbox Runtime Tests ---');

  // Test 1: Path Confinement Violation
  const mockManifest = {
    id: 'test-sandbox-skill',
    sandbox: {
      allowedPaths: ['./data'],
      timeoutMs: 5000
    }
  };

  const sandboxedTools = defaultSandboxExecutor.createSandboxedTools(toolRegistry, mockManifest.sandbox);

  let pathViolationThrown = false;
  try {
    sandboxedTools.filesystem.resolveSafePath('/etc/shadow');
  } catch (err) {
    pathViolationThrown = true;
    assert(err.message.includes('Sandbox Path Confinement Violation'), 'Error must be confinement violation');
  }
  assert.strictEqual(pathViolationThrown, true, 'Accessing /etc/shadow must trigger path confinement violation');
  console.log('✓ Test 1 Passed: Path confinement outside allowed boundaries blocked');

  // Test 2: Dangerous Command Blocking
  const dangerousCommands = [
    'rm -rf /',
    'chmod -R 777 /',
    ':(){ :|:& };:'
  ];

  for (const cmd of dangerousCommands) {
    let cmdBlocked = false;
    try {
      await sandboxedTools.terminal.executeCommand(cmd);
    } catch (err) {
      cmdBlocked = true;
      assert(err.message.includes('Command blocked by safety policy'), 'Blocked by policy');
    }
    assert.strictEqual(cmdBlocked, true, `Dangerous command "${cmd}" must be blocked`);
  }
  console.log('✓ Test 2 Passed: Dangerous shell patterns blocked');

  // Test 3: Environment Sanitization
  process.env.TEST_API_KEY = 'super-secret-key-12345';
  process.env.DATABASE_PASSWORD = 'super-secret-password';

  const cleanEnv = defaultSandboxExecutor.sanitizeEnvironment({
    CUSTOM_PARAM: 'hello',
    AWS_SECRET_KEY: 'forbidden'
  });

  assert.strictEqual(cleanEnv.TEST_API_KEY, undefined, 'API keys must not be exposed');
  assert.strictEqual(cleanEnv.DATABASE_PASSWORD, undefined, 'Passwords must not be exposed');
  assert.strictEqual(cleanEnv.AWS_SECRET_KEY, undefined, 'AWS secret key must not be exposed');
  assert.strictEqual(cleanEnv.CUSTOM_PARAM, 'hello', 'Safe variables should be preserved');
  console.log('✓ Test 3 Passed: Environment variables sanitized');

  // Test 4: Execution Timeout Enforcement
  const timeoutManifest = {
    id: 'timeout-skill',
    sandbox: {
      allowedPaths: ['.'],
      timeoutMs: 150 // Very short timeout
    }
  };

  const slowExecution = async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return 'finished';
  };

  const timeoutRes = await defaultSandboxExecutor.execute(timeoutManifest, slowExecution, {}, toolRegistry);
  assert.strictEqual(timeoutRes.success, false, 'Long execution must fail via timeout');
  assert(timeoutRes.error.includes('Timeout'), 'Error message must reflect timeout');
  console.log('✓ Test 4 Passed: Timeout strictly enforced');

  console.log('All Sandbox Runtime Tests Passed Successfully!\n');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
