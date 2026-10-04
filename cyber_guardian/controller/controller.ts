import {
  EnvironmentProfile,
  ExperimentConfig,
  ExperimentReport,
  CyberGuardianStatus,
  RangeStatus
} from '../types';
import { AuthorizationLayer } from '../authorization/authorization-layer';
import { RangeManager } from '../range/range-manager';
import { EventBus } from '../telemetry/event-bus';
import { DetectionEngine } from '../detection/detection-engine';
import { ResponseEngine } from '../response/response-engine';
import { ExperimentEngine } from '../experiments/experiment-engine';
import { EvaluationEngine } from '../evaluation/evaluation-engine';
import { MonitoringEngine } from '../monitoring/monitoring-engine';
import { listScenarios } from '../attacker/scenario-registry';
import { listBackgroundProfiles } from '../defender/defender-registry';

const DEFAULT_ENVIRONMENT_PROFILE: EnvironmentProfile = {
  id: 'mvp-range',
  name: 'MVP Cyber Range',
  description: 'Isolated cyber range with 2 targets, Wazuh, and Suricata',
  targetCount: 2,
  networkCidr: '10.99.0.0/24',
  zones: ['ATTACKER', 'TARGET', 'DEFENDER', 'MANAGEMENT'] as any,
  defenderStack: ['wazuh', 'suricata', 'elasticsearch'],
  isolationEnabled: true
};

export class CyberGuardianController {
  readonly authorization: AuthorizationLayer;
  readonly rangeManager: RangeManager;
  readonly eventBus: EventBus;
  readonly detectionEngine: DetectionEngine;
  readonly responseEngine: ResponseEngine;
  readonly evaluationEngine: EvaluationEngine;
  readonly experimentEngine: ExperimentEngine;
  readonly monitoringEngine: MonitoringEngine;

  constructor() {
    this.authorization = new AuthorizationLayer();
    this.rangeManager = new RangeManager(this.authorization);
    this.eventBus = new EventBus();
    this.detectionEngine = new DetectionEngine();
    this.responseEngine = new ResponseEngine(this.authorization);
    this.evaluationEngine = new EvaluationEngine();
    this.experimentEngine = new ExperimentEngine(
      this.rangeManager,
      this.authorization,
      this.eventBus,
      this.detectionEngine,
      this.responseEngine,
      this.evaluationEngine
    );
    this.monitoringEngine = new MonitoringEngine(
      this.rangeManager,
      this.eventBus,
      this.detectionEngine,
      this.experimentEngine,
      this.authorization
    );

    this.rangeManager.registerProfile(DEFAULT_ENVIRONMENT_PROFILE);
  }

  async startCyberRange(profileId = 'mvp-range'): Promise<{ environmentId: string; status: RangeStatus }> {
    const env = await this.rangeManager.create(profileId);
    await this.rangeManager.configure(env.id);
    await this.rangeManager.start(env.id);
    await this.rangeManager.runHealthChecks(env.id);
    this.monitoringEngine.startAutonomousLoop();

    return { environmentId: env.id, status: env.status };
  }

  async stopCyberRange(environmentId: string): Promise<void> {
    await this.rangeManager.stop(environmentId);
  }

  async destroyCyberRange(environmentId: string): Promise<void> {
    await this.rangeManager.destroy(environmentId);
  }

  getSecurityStatus(): CyberGuardianStatus {
    return this.monitoringEngine.getStatus();
  }

  async runExperiment(config: ExperimentConfig): Promise<ExperimentReport> {
    return this.experimentEngine.run(config);
  }

  getExperimentReport(reportId: string): ExperimentReport | undefined {
    return this.experimentEngine.getReport(reportId);
  }

  listExperiments() {
    return this.experimentEngine.listExperiments();
  }

  listReports() {
    return this.experimentEngine.listReports();
  }

  activateKillSwitch(actor: string, reason: string): void {
    this.authorization.activateKillSwitch(actor, reason);
    this.monitoringEngine.stopAutonomousLoop();
  }

  deactivateKillSwitch(actor: string): void {
    this.authorization.deactivateKillSwitch(actor);
  }

  getAuditLog(environmentId?: string) {
    return this.authorization.getAuditLog(environmentId);
  }

  getScenarios() {
    return listScenarios();
  }

  getBackgroundProfiles() {
    return listBackgroundProfiles();
  }

  registerEnvironmentProfile(profile: EnvironmentProfile): void {
    this.rangeManager.registerProfile(profile);
  }
}

let controllerInstance: CyberGuardianController | null = null;

export function getCyberGuardianController(): CyberGuardianController {
  if (!controllerInstance) {
    controllerInstance = new CyberGuardianController();
  }
  return controllerInstance;
}
