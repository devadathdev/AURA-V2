import {
  Detection,
  ResponseAction,
  ResponseActionType,
  RiskLevel
} from '../types';
import { AuthorizationLayer, AuthorizationRequest } from '../authorization/authorization-layer';
import { Playbook, DEFAULT_PLAYBOOKS } from './playbooks';

const RISK_ORDER: Record<RiskLevel, number> = {
  [RiskLevel.LOW]: 1,
  [RiskLevel.MEDIUM]: 2,
  [RiskLevel.HIGH]: 3,
  [RiskLevel.CRITICAL]: 4
};

export class ResponseEngine {
  private playbooks: Playbook[] = [...DEFAULT_PLAYBOOKS];
  private actions: ResponseAction[] = [];
  private authorizationLayer: AuthorizationLayer;

  constructor(authorizationLayer: AuthorizationLayer) {
    this.authorizationLayer = authorizationLayer;
  }

  addPlaybook(playbook: Playbook): void {
    this.playbooks.push(playbook);
  }

  async executeForDetection(detection: Detection, context: Record<string, string>): Promise<ResponseAction[]> {
    const matchingPlaybooks = this.findMatchingPlaybooks(detection);
    const executedActions: ResponseAction[] = [];

    for (const playbook of matchingPlaybooks) {
      for (const step of playbook.steps) {
        const action = await this.executeStep(step, detection, context);
        if (action) executedActions.push(action);
      }
    }

    return executedActions;
  }

  getActions(filter?: { experimentId?: string; environmentId?: string }): ResponseAction[] {
    let results = [...this.actions];
    if (filter?.experimentId) {
      results = results.filter(a => a.experimentId === filter.experimentId);
    }
    if (filter?.environmentId) {
      results = results.filter(a => a.environmentId === filter.environmentId);
    }
    return results;
  }

  private findMatchingPlaybooks(detection: Detection): Playbook[] {
    return this.playbooks.filter(pb => {
      const minLevel = pb.triggerConditions.minRiskLevel as RiskLevel;
      if (RISK_ORDER[detection.riskLevel] < RISK_ORDER[minLevel]) return false;

      if (pb.triggerConditions.mitreTechniques?.length) {
        if (!detection.mitreTechnique || !pb.triggerConditions.mitreTechniques.includes(detection.mitreTechnique)) {
          return false;
        }
      }

      return true;
    });
  }

  private async executeStep(
    step: Playbook['steps'][0],
    detection: Detection,
    context: Record<string, string>
  ): Promise<ResponseAction | null> {
    const target = this.resolveTemplate(step.target, context);
    const startTime = Date.now();

    const authRequest: AuthorizationRequest = {
      action: step.action,
      target,
      environmentId: detection.environmentId,
      experimentId: detection.experimentId,
      actor: 'response-engine',
      riskLevel: detection.riskLevel
    };

    const auth = this.authorizationLayer.authorize(authRequest);
    if (!auth.authorized) {
      const rejected: ResponseAction = {
        id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date(),
        action: step.action,
        target,
        trigger: detection.id,
        reason: `Authorization rejected: ${auth.reason}`,
        experimentId: detection.experimentId,
        environmentId: detection.environmentId,
        result: 'FAILURE',
        auditTrail: { authorization: auth }
      };
      this.actions.push(rejected);
      return rejected;
    }

    const action: ResponseAction = {
      id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      action: step.action,
      target,
      trigger: detection.id,
      reason: step.reason,
      experimentId: detection.experimentId,
      environmentId: detection.environmentId,
      result: 'SUCCESS',
      responseLatencyMs: Date.now() - startTime,
      auditTrail: {
        playbookStep: step,
        detectionId: detection.id,
        authorization: auth
      }
    };

    this.actions.push(action);
    return action;
  }

  private resolveTemplate(template: string, context: Record<string, string>): string {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => context[key] ?? template);
  }
}
