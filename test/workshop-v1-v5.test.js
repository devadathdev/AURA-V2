/**
 * AURA OS // HOLOGRAPHIC WORKSHOP AGENT
 * Comprehensive Master Test Suite: V1 -> V5 Validation
 * 
 * Verifies:
 * 1. Closed-form deterministic scientific simulation engine solvers
 * 2. Zero-trust tool registry, permission & safety guardrail validation
 * 3. Multi-domain Knowledge Graph (102 entities, 84 relations, IUPAC/NIST datasets)
 * 4. Semantic path finding (Lithium -> Battery -> Motor -> Joint -> Arm)
 * 5. Material comparison (Steel vs. Aluminum)
 * 6. Structured Agent Communication protocol (Aura <-> Workshop)
 * 7. AI Spatial Planner & Canonical Flagship Flow
 * 8. Workspace Engine state persistence, mutations, grouping, layers
 * 9. Display-agnostic renderer abstraction
 */

import assert from 'assert';
import path from 'path';
import { SimulationEngine } from '../core/workshop/simulation/simulationEngine.js';
import { KnowledgeGraphService } from '../core/workshop/knowledge/knowledgeGraphService.js';
import { ActionValidator, TOOL_REGISTRY } from '../core/workshop/validation/actionValidator.js';
import { WorkshopPlanner } from '../core/workshop/agents/workshopPlanner.js';
import { AgentCommunicator } from '../core/workshop/agents/agentCommunicator.js';
import { HolographicWorkshopEngine } from '../core/workshop/holographicWorkshopEngine.js';
import {
  RendererInterface,
  ScreenCanvasRenderer,
  ARRenderer,
  SpatialDisplayRenderer,
  FutureHolographicRenderer
} from '../core/workshop/renderer/index.js';

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('⚡ RUNNING HOLOGRAPHIC WORKSHOP V1 -> V5 MASTER TEST SUITE ⚡');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: SIMULATION ENGINE SOLVERS (V3)
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: V3 Deterministic Simulation Engine ---');

  const simEngine = new SimulationEngine();

  test('Physics: solveLorentzForce calculates F = I(L x B)', () => {
    // I = 4.0 A, L = 0.2 m, B = 1.2 T, angle = 90 deg (pi/2 rad)
    const result = simEngine.solveLorentzForce(4.0, 0.2, 1.2, Math.PI / 2);
    assert.strictEqual(result.unit, 'N');
    assert(Math.abs(result.force - 0.96) < 1e-4, `Expected 0.96 N, got ${result.force}`);
  });

  test('Physics: solveMotorTorque calculates tau = k * phi * I', () => {
    // k = 0.15, phi = 1.2 T, I = 4.0 A -> tau = 0.72 Nm
    const result = simEngine.solveMotorTorque(0.15, 1.2, 4.0);
    assert.strictEqual(result.unit, 'N*m');
    assert(Math.abs(result.torque - 0.72) < 1e-4, `Expected 0.72 Nm, got ${result.torque}`);
  });

  test('Electronics: solveOhmsLaw calculates V = IR and P = VI', () => {
    // V = 9V, R = 450 ohms -> I = 0.02 A (20 mA), P = 0.18 W
    const result = simEngine.solveOhmsLaw(9.0, 450.0);
    assert.strictEqual(result.currentUnit, 'A');
    assert(Math.abs(result.current - 0.02) < 1e-4, `Expected 0.02 A, got ${result.current}`);
    assert(Math.abs(result.powerWatts - 0.18) < 1e-4, `Expected 0.18 W, got ${result.powerWatts}`);
  });

  test('Mechanics: solveKinematics calculates position, velocity, and energy', () => {
    // v0 = 0, a = 9.81, t = 2s, mass = 5kg
    const result = simEngine.solveKinematics(0, 9.81, 2.0, 5.0);
    assert(Math.abs(result.displacement - 19.62) < 1e-3, `Expected 19.62m, got ${result.displacement}`);
    assert(Math.abs(result.velocity - 19.62) < 1e-3, `Expected 19.62m/s, got ${result.velocity}`);
    assert(result.kineticEnergyJoules > 0, 'Kinetic energy must be positive');
  });

  test('Mechanics: solveHookesLaw calculates restoring spring force', () => {
    // k = 250 N/m, x = 0.04 m
    const result = simEngine.solveHookesLaw(250, 0.04);
    assert(Math.abs(result.force - (-10.0)) < 1e-4, `Expected -10N, got ${result.force}`);
    assert(Math.abs(result.potentialEnergy - 0.2) < 1e-4, `Expected 0.2 J, got ${result.potentialEnergy}`);
  });

  test('Robotics: Forward Kinematics 3-DOF planar arm', () => {
    const angles = [0, 0, 0];
    const lengths = [10, 8, 5];
    const fk = simEngine.solveForwardKinematics(angles, lengths);
    assert.strictEqual(fk.joints.length, 4); // base + 3 links
    // End effector at x = 10+8+5 = 23, y = 0
    assert(Math.abs(fk.endEffector.x - 23) < 1e-4, `Expected x=23, got ${fk.endEffector.x}`);
    assert(Math.abs(fk.endEffector.y - 0) < 1e-4, `Expected y=0, got ${fk.endEffector.y}`);
  });

  test('Robotics: Analytical 2-Link Inverse Kinematics', () => {
    const l1 = 10, l2 = 8;
    // Target (10, 8)
    const ik = simEngine.solveInverseKinematics(10, 8, l1, l2);
    assert(ik.reachable === true, 'Target should be reachable');
    assert(typeof ik.theta1 === 'number' && typeof ik.theta2 === 'number');
  });

  test('Chemistry: solveHalfLife radioactive decay', () => {
    // N0 = 100g, half-life = 5.27 years (Cobalt-60), elapsed = 10.54 years (2 half lives)
    const result = simEngine.solveHalfLife(100, 5.27, 10.54);
    assert(Math.abs(result.remainingAmount - 25.0) < 1e-3, `Expected 25g, got ${result.remainingAmount}`);
  });

  test('Simulation Step: updates workspace telemetry and step count', () => {
    const mockWs = {
      id: 'test_ws',
      simulation: { running: true, speed: 1.0, parameters: {} },
      objects: [{ id: 'o1', type: 'motor', properties: { rpm: 1000 } }]
    };
    const stepRes = simEngine.stepSimulation(mockWs, 0.016);
    assert(stepRes.timeElapsed > 0);
    assert(stepRes.telemetry);
    assert.strictEqual(simEngine.telemetryBuffer.length, 1);
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: ZERO-TRUST ACTION VALIDATOR (V2 & V3)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Action Validator & Tool Registry ---');

  const validator = new ActionValidator();

  test('Validator: approves valid create_object payload', () => {
    const validAction = {
      action: 'create_object',
      object: {
        id: 'obj_custom_motor_01',
        name: 'High-Torque Stepper Motor',
        type: 'motor',
        position: { x: 10, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        properties: { torque: 2.5 }
      }
    };
    const check = validator.validate(validAction);
    assert.strictEqual(check.valid, true, `Validation failed: ${check.reason}`);
  });

  test('Validator: rejects unknown/unregistered action name', () => {
    const badAction = { action: 'execute_arbitrary_shell_script', command: 'rm -rf /' };
    const check = validator.validate(badAction);
    assert.strictEqual(check.valid, false);
    assert(check.reason.includes('Unregistered tool'));
  });

  test('Validator: blocks dangerous/harmful keywords (Safety Guardrails)', () => {
    const dangerAction = {
      action: 'create_object',
      object: {
        id: 'obj_hazard',
        name: 'dirty bomb isotope dispersing payload',
        type: 'weapon'
      }
    };
    const check = validator.validate(dangerAction);
    assert.strictEqual(check.valid, false);
    assert(check.reason.includes('Safety violation'));
  });

  test('Validator: rejects out-of-bounds coordinates (Spatial Limits)', () => {
    const oobAction = {
      action: 'modify_transform',
      object_id: 'obj_001',
      position: { x: 999999, y: 0, z: 0 } // Exceeds max 5,000 limit
    };
    const check = validator.validate(oobAction);
    assert.strictEqual(check.valid, false);
    assert(check.reason.includes('exceeds spatial boundary'));
  });

  test('Validator: checks registered tools count', () => {
    const tools = validator.getRegisteredTools();
    assert(tools.length >= 20, `Expected at least 20 registered tools, found ${tools.length}`);
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: SCIENTIFIC KNOWLEDGE GRAPH (V4 & V5)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: V4 & V5 Scientific Knowledge Graph ---');

  const kgService = new KnowledgeGraphService();

  test('KG: Initializes and reports comprehensive entity and edge counts', () => {
    const stats = kgService.getStats();
    assert(stats.nodes >= 100, `Expected at least 100 nodes, got ${stats.nodes}`);
    assert(stats.edges >= 80, `Expected at least 80 edges, got ${stats.edges}`);
    assert(stats.elements >= 100, `Expected elements >= 100, got ${stats.elements}`);
    assert(stats.nanomaterials >= 90, `Expected nanomaterials >= 90, got ${stats.nanomaterials}`);
    assert(stats.catalogObjects >= 900, `Expected catalog components >= 900, got ${stats.catalogObjects}`);
    assert(stats.recipes >= 200, `Expected recipes >= 200, got ${stats.recipes}`);
  });

  test('KG: Multi-domain Search finds elements, nanomaterials, and components', () => {
    const liResults = kgService.searchKnowledge('lithium');
    assert(liResults.length > 0, 'Should find lithium in elements or components');

    const graphResults = kgService.searchKnowledge('graphene');
    assert(graphResults.length > 0, 'Should find graphene');

    const motorResults = kgService.searchKnowledge('motor');
    assert(motorResults.length > 0, 'Should find motors in catalog');
  });

  test('KG: Semantic Path Finding connects Lithium to Robotic Arm', () => {
    const pathResult = kgService.findSemanticPath('elem_li', 'comp_robotic_arm');
    assert(pathResult !== null, 'Should find a path from Lithium to Robotic Arm');
    assert(pathResult.path.length >= 2, `Path length must be at least 2, got ${pathResult.path.length}`);
    console.log('    Semantic Path Found:', pathResult.path.join(' -> '));
  });

  test('KG: Semantic Path Finding connects Carbon to Exosuit', () => {
    const pathResult = kgService.findSemanticPath('elem_c', 'comp_exosuit');
    assert(pathResult !== null, 'Should find a path from Carbon to Exosuit');
    console.log('    Semantic Path Found:', pathResult.path.join(' -> '));
  });

  test('KG: Material Comparison provides quantitative trade-offs (Steel vs. Aluminum)', () => {
    const comparison = kgService.compareMaterials('mat_structural_steel', 'mat_aerospace_aluminum');
    assert(comparison !== null);
    assert.strictEqual(comparison.comparisonType, 'DIRECT_PROPERTIES');
    assert(comparison.tradeOffs.length >= 2);
    assert(comparison.materialA.density > comparison.materialB.density);
  });

  test('KG: Provenance returns authoritative NIST/IUPAC metadata', () => {
    const prov = kgService.getProvenance('elem_li');
    assert(prov !== null);
    assert.strictEqual(prov.provenanceTier, 'AUTHORITATIVE');
    assert(prov.primaryAuthority.includes('IUPAC'));
  });

  test('KG: Ingestion of Advanced Technologies & Materials (dataset.json)', () => {
    const stats = kgService.getStats();
    assert.strictEqual(stats.advancedTechMaterials, 41, `Expected 41 tech materials, got ${stats.advancedTechMaterials}`);
    assert.strictEqual(stats.techMaterialsCategories.technology, 14);
    assert.strictEqual(stats.techMaterialsCategories.material, 14);
    assert.strictEqual(stats.techMaterialsCategories.wearable, 13);
  });

  test('KG: Advanced Technologies & Materials item retrieval and search', () => {
    const qComp = kgService.getTechMaterial('TECH-001');
    assert(qComp !== null);
    assert.strictEqual(qComp.name, 'Quantum Computing');
    assert.strictEqual(qComp.category, 'technology');

    const nitinol = kgService.getTechMaterial('MAT-004');
    assert(nitinol !== null);
    assert(nitinol.name.includes('Shape Memory Alloys'));

    const jetSuit = kgService.getTechMaterial('SUIT-011');
    assert(jetSuit !== null);
    assert.strictEqual(jetSuit.name, 'Jet Suit (Real Personal Flight System)');

    const searchRes = kgService.searchTechMaterials('superposition');
    assert(searchRes.items.length > 0);
    assert.strictEqual(searchRes.items[0].id, 'TECH-001');

    const suitItems = kgService.searchTechMaterials({ category: 'wearable' });
    assert.strictEqual(suitItems.items.length, 13);
  });

  test('KG: Provenance returns authoritative metadata for dataset.json items', () => {
    const prov = kgService.getProvenance('TECH-001');
    assert(prov !== null);
    assert.strictEqual(prov.provenanceTier, 'AUTHORITATIVE');
    assert(prov.source.includes('Advanced Technologies & Materials Dataset'));
  });

  // -------------------------------------------------------------
  // TEST GROUP 4: AI SPATIAL PLANNER & CANONICAL FLOW
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: AI Spatial Planner & Canonical Target ---');

  const planner = new WorkshopPlanner(kgService);

  await testAsync('Planner: Handles Final Target "Create a robotic arm powered by a battery and show me how it works."', async () => {
    const plan = await planner.planCommand('Create a robotic arm powered by a battery and show me how it works.');
    assert.strictEqual(plan.intent, 'create_system_and_simulate');
    assert(plan.actions.length >= 3, `Expected at least 3 actions, got ${plan.actions.length}`);

    const actionTypes = plan.actions.map(a => a.action);
    assert(actionTypes.includes('create_object'), 'Must contain create_object action');
    assert(actionTypes.includes('step_simulation'), 'Must contain step_simulation action');
    assert(plan.explanation.toLowerCase().includes('robotic arm') || plan.explanation.toLowerCase().includes('battery'));
  });

  await testAsync('Planner: Handles material comparison natural language command', async () => {
    const plan = await planner.planCommand('Compare these two materials: steel and aluminum');
    assert.strictEqual(plan.intent, 'compare_materials');
    assert.strictEqual(plan.actions[0].action, 'compare_materials');
  });

  await testAsync('Planner: Handles cross-domain relationship inquiry', async () => {
    const plan = await planner.planCommand('How does lithium relate to a robotic arm?');
    assert.strictEqual(plan.intent, 'find_path');
    assert.strictEqual(plan.actions[0].action, 'find_path');
  });

  // -------------------------------------------------------------
  // TEST GROUP 5: STRUCTURED AGENT COMMUNICATOR (AURA <-> WORKSHOP)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Structured Agent Communicator ---');

  const communicator = new AgentCommunicator();

  await testAsync('Communicator: processes typed AuraRequest packet and returns SUCCESS packet', async () => {
    const request = {
      requestId: 'req_aura_001',
      sender: 'aura_orchestrator',
      action: 'execute_command',
      command: 'Create a robotic arm powered by a battery and show me how it works.',
      workspaceId: 'ws_robotic_arm'
    };
    const response = await communicator.handleAuraRequest(request);
    assert.strictEqual(response.status, 'SUCCESS');
    assert.strictEqual(response.requestId, 'req_aura_001');
    assert(response.actionsExecuted >= 1);
    assert(response.summary.length > 0);
  });

  await testAsync('Communicator: safely rejects request without required action', async () => {
    const badReq = { requestId: 'req_bad', sender: 'test' };
    const response = await communicator.handleAuraRequest(badReq);
    assert.strictEqual(response.status, 'ERROR');
  });

  // -------------------------------------------------------------
  // TEST GROUP 6: WORKSPACE ENGINE (V1 -> V5 CAPABILITIES)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Holographic Workshop Engine ---');

  const engine = new HolographicWorkshopEngine();

  test('Engine: Initializes all 6 canonical workspaces', () => {
    const workspaces = engine.listWorkspaces();
    assert.strictEqual(workspaces.length, 6);
    const ids = workspaces.map(w => w.workspace_id);
    assert(ids.includes('ws_electric_motor'));
    assert(ids.includes('ws_led_circuit'));
    assert(ids.includes('ws_robotic_arm'));
    assert(ids.includes('ws_api_architecture'));
    assert(ids.includes('ws_human_heart'));
    assert(ids.includes('ws_four_stroke_engine'));
  });

  await testAsync('Engine: Executes validated create_object action', async () => {
    const action = {
      action: 'create_object',
      object: {
        id: 'obj_sensor_hall_01',
        name: 'Hall Effect Magnetic Sensor',
        type: 'sensor',
        position: { x: 5, y: 12, z: -8 }
      }
    };
    const res = await engine.executeAction('ws_electric_motor', action);
    assert.strictEqual(res.success, true);
    const ws = engine.getWorkspace('ws_electric_motor');
    const obj = ws.objects.find(o => o.id === 'obj_sensor_hall_01');
    assert(obj !== undefined, 'Created object must exist in workspace');
  });

  await testAsync('Engine: Executes transform modification', async () => {
    const action = {
      action: 'modify_transform',
      object_id: 'obj_sensor_hall_01',
      position: { x: 15, y: 20, z: 0 },
      rotation: { x: 0, y: 45, z: 0 }
    };
    const res = await engine.executeAction('ws_electric_motor', action);
    assert.strictEqual(res.success, true);
    const ws = engine.getWorkspace('ws_electric_motor');
    const obj = ws.objects.find(o => o.id === 'obj_sensor_hall_01');
    assert.strictEqual(obj.position.x, 15);
  });

  await testAsync('Engine: V2 Grouping and Layer assignments', async () => {
    const groupAction = {
      action: 'group_objects',
      group_id: 'group_sensing_cluster',
      name: 'Magnetic Sensing Cluster',
      object_ids: ['obj_sensor_hall_01']
    };
    const res = await engine.executeAction('ws_electric_motor', groupAction);
    assert.strictEqual(res.success, true);

    const layerAction = {
      action: 'assign_layer',
      object_id: 'obj_sensor_hall_01',
      layer_id: 'layer_magnetic'
    };
    const layerRes = await engine.executeAction('ws_electric_motor', layerAction);
    assert.strictEqual(layerRes.success, true);
  });

  await testAsync('Engine: Executes Knowledge Graph queries via engine action pipeline', async () => {
    const res = await engine.executeAction('ws_robotic_arm', {
      action: 'find_path',
      source: 'elem_li',
      target: 'comp_robotic_arm'
    });
    assert.strictEqual(res.success, true);
    assert(res.data.path);
  });

  await testAsync('Engine: Full Natural Language Command processing with final target', async () => {
    const result = await engine.processNaturalLanguageCommand(
      'ws_robotic_arm',
      'Create a robotic arm powered by a battery and show me how it works.'
    );
    assert.strictEqual(result.success, true);
    assert(result.explanation.length > 0);
    assert(result.workspace !== undefined);
  });

  await testAsync('Engine: Natural Language command adds item from Advanced Technologies & Materials dataset', async () => {
    const result = await engine.processNaturalLanguageCommand(
      'ws_robotic_arm',
      'add Quantum Computing'
    );
    assert.strictEqual(result.success, true);
    assert(result.explanation.includes('TECH-001') || result.explanation.includes('Quantum Computing'));
    const ws = result.workspace;
    const added = ws.objects.find(o => o.name.toLowerCase().includes('quantum computing'));
    assert(added !== undefined, 'Quantum Computing object should be added to workspace');
  });

  // -------------------------------------------------------------
  // TEST GROUP 7: RENDERER ABSTRACTION INTERFACES
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Display-Agnostic Renderer Abstraction ---');

  test('Renderer: ScreenCanvasRenderer reports 2D volumetric canvas capabilities', () => {
    const screenR = new ScreenCanvasRenderer({});
    const caps = screenR.getCapabilities();
    assert.strictEqual(caps.renderType, 'screen_canvas_2d');
    assert.strictEqual(caps.stereoscopic, false);
  });

  test('Renderer: ARRenderer reports spatial pass-through capabilities', () => {
    const arR = new ARRenderer({ fov: 90 });
    const caps = arR.getCapabilities();
    assert.strictEqual(caps.renderType, 'augmented_reality_webxr');
    assert.strictEqual(caps.spatialTracking, true);
  });

  test('Renderer: FutureHolographicRenderer reports volumetric light-field capabilities', () => {
    const holoR = new FutureHolographicRenderer({ lightFieldRays: 120 });
    const caps = holoR.getCapabilities();
    assert.strictEqual(caps.renderType, 'volumetric_light_field');
    assert.strictEqual(caps.realWorldAnchor, true);
  });

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
