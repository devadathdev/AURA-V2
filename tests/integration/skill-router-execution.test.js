/**
 * tests/integration/skill-router-execution.test.js
 * 
 * End-to-end integration test verifying the entire pipeline:
 * Discovery -> Router -> Planner -> Approval -> Sandbox Execution -> Audit Logging.
 */

import assert from 'node:assert';
import { defaultSkillRegistry } from '../../skill-runtime/registry/skill-registry.js';
import { defaultSkillRouter } from '../../core/router/skill-router.js';
import { defaultSkillPlanner } from '../../core/planner/skill-planner.js';
import { defaultSkillAgent } from '../../core/executor/skill-agent.js';
import { defaultSkillExecutor } from '../../skill-runtime/executor/skill-executor.js';

async function runTests() {
  console.log('--- Running Skill Integration Tests ---');

  // 1. Discovery & Scan
  const scanResult = await defaultSkillRegistry.scan();
  assert(scanResult.totalRegistered >= 297, 'Must discover at least 297 skills');
  console.log(`✓ Step 1 Passed: Discovered and indexed ${scanResult.totalRegistered} skills`);

  // 2. Intelligent Routing
  const route1 = defaultSkillRouter.route('Audit accessibility and check contrast of button elements');
  assert.strictEqual(route1.selected?.skillId, 'accessibility', 'Must route to accessibility skill');
  assert(route1.selected?.confidence > 0.3, 'Confidence should be positive');
  console.log('✓ Step 2 Passed: Natural language query routed to "accessibility"');

  const route2 = defaultSkillRouter.route('Perform code analysis on the repository');
  assert.strictEqual(route2.selected?.skillId, 'code-analysis', 'Must route to code-analysis core skill');
  console.log('✓ Step 2 Passed: Code analysis query routed to "code-analysis"');

  // 3. Multi-step Planner
  const multiPrompt = 'Analyze code structure in project and then create documentation for developers';
  const plan = defaultSkillPlanner.plan(multiPrompt);
  assert.strictEqual(plan.stepCount, 2, 'Planner should decompose into 2 steps');
  assert.strictEqual(plan.steps[0].skillId, 'code-analysis');
  assert.strictEqual(plan.steps[1].skillId, 'documentation');
  console.log('✓ Step 3 Passed: Multi-step planner decomposed instructions correctly');

  // 4. Permission Gate & Approval
  defaultSkillExecutor.approvalManager.autoApproveInHeadless = false;
  // Try running a skill that requires WRITE/EXECUTE without approval
  const blockedRes = await defaultSkillAgent.handleQuery('Run task automation to execute npm test', { confirmed: false });
  assert.strictEqual(blockedRes.requiresUserConfirmation, true, 'High-risk skill must require user confirmation');
  assert(blockedRes.requestId, 'Must return pending approval request ID');
  console.log('✓ Step 4 Passed: Permission enforcement halted unauthorized high-risk action');

  // 5. User Confirmation & Execution
  const approvedRes = await defaultSkillAgent.handleQuery('Analyze codebase structure', { confirmed: true });
  assert.strictEqual(approvedRes.success, true, 'Execution should succeed with confirmation');
  assert(approvedRes.response.includes('Analyzed'), 'Response should contain analysis output');
  console.log('✓ Step 5 Passed: Sandboxed execution completed with output');

  // 6. Audit Logging Verification
  const logs = defaultSkillExecutor.getExecutionLogs(null, 5);
  assert(logs.length > 0, 'Audit logs must exist');
  const latestLog = logs[0];
  assert(latestLog.executionId, 'Log must contain executionId');
  assert(latestLog.skillId, 'Log must contain skillId');
  assert(latestLog.status, 'Log must contain status');
  assert(typeof latestLog.durationMs === 'number', 'Log must contain numeric durationMs');
  console.log(`✓ Step 6 Passed: Structured audit logs verified (${logs.length} entries inspected)`);

  // 7. Registry Stats Verification
  const codeAnalysisSkill = defaultSkillRegistry.get('code-analysis');
  assert(codeAnalysisSkill.executionStats.totalExecutions > 0, 'Execution stats must be incremented');
  console.log(`✓ Step 7 Passed: Registry statistics tracked (${codeAnalysisSkill.executionStats.totalExecutions} executions)`);

  console.log('\nAll End-to-End Skill Integration Tests Passed Successfully!\n');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
