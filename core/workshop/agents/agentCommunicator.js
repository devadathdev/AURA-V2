/**
 * AURA Holographic Workshop — Structured Agent Communicator
 * Subsystem: Aura Master Orchestrator <-> Holographic Workshop Protocol
 * 
 * Handles bidirectional structured communication between the primary AURA Assistant
 * and the specialist Holographic Workshop Agent with typed JSON validation.
 */

import { ActionValidator } from '../validation/actionValidator.js';
import { WorkshopPlanner } from './workshopPlanner.js';
import {
  getWorkspace,
  processNaturalLanguageCommand,
  executeAction
} from '../holographicWorkshopEngine.js';

export class AgentCommunicator {
  handleAuraRequest(request) {
    return AgentCommunicator.handleAuraRequest(request);
  }

  /**
   * Processes a structured request from AURA Master Orchestrator.
   */
  static async handleAuraRequest(request) {
    // 1. Schema Validation
    if (!request || typeof request !== 'object') {
      return {
        status: 'ERROR',
        error: 'Malformed A2A packet: Expected JSON object'
      };
    }

    const action = request.action || request.intent;
    const task = request.task || request.command || '';
    if (!action && !task) {
      return {
        status: 'ERROR',
        error: 'Missing required action or task field'
      };
    }

    const sender = (request.source_agent || request.sender || 'aura').toLowerCase();
    if (!sender.includes('aura') && !sender.includes('system')) {
      return {
        status: 'ERROR',
        error: `Unauthorized source agent '${sender}'. Only 'aura' is permitted to orchestrate workshop.`
      };
    }

    const requestId = request.request_id || request.requestId || `req_${Date.now()}`;
    const workspaceId = request.context?.workspace_id || request.workspace_id || request.workspaceId || 'ws_robotic_arm';

    try {
      // 2. Intent Detection & Planning
      const plan = await WorkshopPlanner.planCommand(task, getWorkspace(workspaceId) || {});

      // 3. Execution of Planned Actions
      const executed = [];
      for (const act of plan.actions) {
        // Zero-Trust Validation Gate
        const val = ActionValidator.validate(act);
        if (!val.valid) {
          return {
            status: 'ERROR',
            error: `Security / Validation Rejection: ${val.error}`,
            rejectedAction: act
          };
        }
        const res = await executeAction({ ...act, workspace_id: workspaceId });
        executed.push({ action: act.action, result: res });
      }

      // Also process natural language explanation if needed
      const nlResult = await processNaturalLanguageCommand(workspaceId, task);

      // 4. Return Structured Response
      return {
        status: 'SUCCESS',
        requestId,
        source_agent: 'holographic_workshop',
        target_agent: 'aura',
        workspace_id: workspaceId,
        summary: plan.explanation || nlResult.explanation || `Executed task: ${task}`,
        actions: executed.map(e => e.action),
        actionsExecuted: executed.length || 1,
        interactive: request.response_mode !== 'batch',
        explanation: nlResult.explanation || plan.explanation,
        telemetry: {
          objectsCount: (nlResult.workspace?.objects || []).length,
          simulationRunning: !!nlResult.workspace?.simulation?.running
        }
      };
    } catch (err) {
      return {
        status: 'ERROR',
        requestId,
        source_agent: 'holographic_workshop',
        target_agent: 'aura',
        error: err.message
      };
    }
  }
}
