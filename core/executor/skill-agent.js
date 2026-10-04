/**
 * core/executor/skill-agent.js
 * 
 * Unified Agentic Controller for Aura Assistant Skills Engine.
 * Integrates Router, Planner, Context, Permissions, and Executor
 * into an automated end-to-end execution loop.
 */

import { defaultSkillRouter } from '../router/skill-router.js';
import { defaultSkillPlanner } from '../planner/skill-planner.js';
import { defaultSkillExecutor } from '../../skill-runtime/executor/skill-executor.js';
import { SkillContext } from '../context/skill-context.js';
import { defaultApprovalManager } from '../../permissions/approval/approval-manager.js';

export class SkillAgent {
  constructor(options = {}) {
    this.router = options.router || defaultSkillRouter;
    this.planner = options.planner || defaultSkillPlanner;
    this.executor = options.executor || defaultSkillExecutor;
    this.approvalManager = options.approvalManager || defaultApprovalManager;
  }

  /**
   * High-level handler for user prompts
   */
  async handleQuery(userPrompt, options = {}) {
    const context = options.context || new SkillContext({ workspaceRoot: this.executor.workspaceRoot });

    // 1. Check if user prompt is a multi-step workflow
    if (/\band\s+then\b|\bthen\b|;\s*[A-Z]/i.test(userPrompt)) {
      const plan = this.planner.plan(userPrompt);
      if (plan.steps.length > 1) {
        return await this.executePlan(plan, context, options);
      }
    }

    // 2. Single-step Skill Routing
    const route = this.router.route(userPrompt, { maxRisk: options.maxRisk });
    if (!route.selected) {
      return {
        success: false,
        message: `No matching skill found for: "${userPrompt}". You can check available skills with the skill catalog.`,
        route
      };
    }

    const selectedSkill = route.selected;

    // 3. Permission Confirmation Check
    if (selectedSkill.requiresApproval && !options.confirmed) {
      const approval = await this.approvalManager.requestApproval(
        selectedSkill.skillId,
        selectedSkill.permissions,
        { prompt: userPrompt, requestedBy: 'user-agent' }
      );

      if (!approval.approved) {
        return {
          success: false,
          requiresUserConfirmation: true,
          requestId: approval.requestId,
          skillId: selectedSkill.skillId,
          riskLevel: approval.riskLevel,
          reasons: approval.reasons,
          message: `Permission required: Skill "${selectedSkill.name}" requires authorization before proceeding.`
        };
      }
    }

    // 4. Execute Selected Skill
    const execution = await this.executor.executeSkill(
      selectedSkill.skillId,
      { instruction: userPrompt, ...(options.inputs || {}) },
      { context: context.toJSON() }
    );

    context.recordStep(selectedSkill.skillId, { instruction: userPrompt }, execution.result);

    return {
      success: execution.success,
      skill: {
        id: selectedSkill.skillId,
        name: selectedSkill.name,
        category: selectedSkill.category,
        confidence: selectedSkill.confidence
      },
      execution,
      response: execution.result || execution.error,
      sessionId: context.sessionId
    };
  }

  /**
   * Executes a multi-step plan
   */
  async executePlan(plan, context, options = {}) {
    const stepResults = [];

    for (const step of plan.steps) {
      if (!step.skillId) {
        stepResults.push({
          stepNumber: step.stepNumber,
          success: false,
          error: `No skill found to handle: "${step.instruction}"`
        });
        continue;
      }

      if (step.requiresApproval && !options.confirmed) {
        return {
          success: false,
          requiresUserConfirmation: true,
          planId: plan.planId,
          blockedAtStep: step.stepNumber,
          riskLevel: step.riskLevel,
          message: `Plan blocked at step ${step.stepNumber} (${step.skillName}): requires user approval for ${step.permissions.join(', ')}.`
        };
      }

      const execResult = await this.executor.executeSkill(
        step.skillId,
        { instruction: step.instruction },
        { context: context.toJSON() }
      );

      stepResults.push({
        stepNumber: step.stepNumber,
        skillId: step.skillId,
        instruction: step.instruction,
        success: execResult.success,
        result: execResult.result,
        durationMs: execResult.durationMs
      });

      context.recordStep(step.skillId, { instruction: step.instruction }, execResult.result);

      if (!execResult.success && options.stopOnError !== false) {
        return {
          success: false,
          planId: plan.planId,
          stoppedAtStep: step.stepNumber,
          results: stepResults,
          error: execResult.error
        };
      }
    }

    return {
      success: true,
      planId: plan.planId,
      stepCount: stepResults.length,
      results: stepResults,
      message: `Completed all ${stepResults.length} steps in workflow plan.`
    };
  }
}

export const defaultSkillAgent = new SkillAgent();
