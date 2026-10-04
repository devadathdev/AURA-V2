/**
 * core/planner/skill-planner.js
 * 
 * Decomposes multi-step goals into sequenced skill execution plans,
 * resolving dependencies, permission requirements, and risk tiers.
 */

import { defaultSkillRouter } from '../router/skill-router.js';
import { defaultSkillRegistry } from '../../skill-runtime/registry/skill-registry.js';

export class SkillPlanner {
  constructor(options = {}) {
    this.router = options.router || defaultSkillRouter;
    this.registry = options.registry || defaultSkillRegistry;
  }

  /**
   * Generates a multi-step execution plan from a user prompt
   */
  plan(goal, context = {}) {
    if (!goal || typeof goal !== 'string') {
      return { planId: `plan_${Date.now()}`, goal: '', steps: [], requiresApproval: false };
    }

    // Split compound instructions by 'then', 'and then', semicolons, or numbered lines
    const rawSteps = goal
      .split(/\band\s+then\b|\bthen\b|;|\n(?=\d+\.)/i)
      .map(s => s.trim().replace(/^\d+\.\s*/, ''))
      .filter(s => s.length > 2);

    const steps = [];
    let cumulativeRiskRequiresApproval = false;

    for (let index = 0; index < rawSteps.length; index++) {
      const stepInstruction = rawSteps[index];
      const routeResult = this.router.route(stepInstruction, { limit: 1 });
      const bestMatch = routeResult.selected;

      const step = {
        stepNumber: index + 1,
        instruction: stepInstruction,
        skillId: bestMatch ? bestMatch.skillId : null,
        skillName: bestMatch ? bestMatch.name : 'Unknown',
        confidence: bestMatch ? bestMatch.confidence : 0,
        permissions: bestMatch ? bestMatch.permissions : [],
        riskLevel: bestMatch ? bestMatch.riskLevel : 'LOW',
        requiresApproval: bestMatch ? bestMatch.requiresApproval : false,
        tools: bestMatch ? bestMatch.tools : []
      };

      if (step.requiresApproval) {
        cumulativeRiskRequiresApproval = true;
      }

      steps.push(step);
    }

    return {
      planId: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      goal,
      stepCount: steps.length,
      requiresApproval: cumulativeRiskRequiresApproval,
      steps,
      createdAt: new Date().toISOString()
    };
  }
}

export const defaultSkillPlanner = new SkillPlanner();
