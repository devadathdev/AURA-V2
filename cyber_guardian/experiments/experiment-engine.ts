import {
  Experiment,
  ExperimentConfig,
  ExperimentStatus,
  ExperimentReport,
  EventSource,
  SecurityEvent,
  Detection,
  ResponseAction,
  EvaluationMetrics
} from '../types';
import { RangeManager } from '../range/range-manager';
import { AuthorizationLayer } from '../authorization/authorization-layer';
import { EventNormalizer, RawTelemetryEvent } from '../telemetry/event-normalizer';
import { EventBus } from '../telemetry/event-bus';
import { DetectionEngine } from '../detection/detection-engine';
import { ResponseEngine } from '../response/response-engine';
import { EvaluationEngine } from '../evaluation/evaluation-engine';
import { getScenarioById } from '../attacker/scenario-registry';
import { getBackgroundProfileById } from '../defender/defender-registry';

export class ExperimentEngine {
  private experiments: Map<string, Experiment> = new Map();
  private reports: Map<string, ExperimentReport> = new Map();
  private rangeManager: RangeManager;
  private authorizationLayer: AuthorizationLayer;
  private eventNormalizer: EventNormalizer;
  private eventBus: EventBus;
  private detectionEngine: DetectionEngine;
  private responseEngine: ResponseEngine;
  private evaluationEngine: EvaluationEngine;

  constructor(
    rangeManager: RangeManager,
    authorizationLayer: AuthorizationLayer,
    eventBus: EventBus,
    detectionEngine: DetectionEngine,
    responseEngine: ResponseEngine,
    evaluationEngine: EvaluationEngine
  ) {
    this.rangeManager = rangeManager;
    this.authorizationLayer = authorizationLayer;
    this.eventNormalizer = new EventNormalizer();
    this.eventBus = eventBus;
    this.detectionEngine = detectionEngine;
    this.responseEngine = responseEngine;
    this.evaluationEngine = evaluationEngine;
  }

  async run(config: ExperimentConfig): Promise<ExperimentReport> {
    const experiment: Experiment = {
      id: config.id || `exp-${Date.now()}`,
      config,
      environmentId: '',
      status: ExperimentStatus.VALIDATING
    };
    this.experiments.set(experiment.id, experiment);

    try {
      await this.validate(experiment);
      experiment.status = ExperimentStatus.PROVISIONING;
      const env = await this.rangeManager.create(config.environmentProfileId);
      experiment.environmentId = env.id;
      await this.rangeManager.start(env.id);

      experiment.status = ExperimentStatus.BASELINE;
      await this.generateBaseline(experiment);

      experiment.status = ExperimentStatus.EXECUTING;
      const scenarioEvents = await this.executeScenario(experiment);

      experiment.status = ExperimentStatus.COLLECTING;
      const normalizedEvents = this.eventNormalizer.normalizeBatch(scenarioEvents);
      for (const event of normalizedEvents) {
        this.eventBus.publish(event);
      }

      experiment.status = ExperimentStatus.DETECTING;
      const detections = this.detectionEngine.analyze(normalizedEvents, experiment.id);

      experiment.status = ExperimentStatus.RESPONDING;
      const responses: ResponseAction[] = [];
      for (const detection of detections) {
        const context = {
          source_host: normalizedEvents[0]?.sourceHost ?? 'unknown',
          destination_host: normalizedEvents[0]?.destinationHost ?? 'unknown'
        };
        const actions = await this.responseEngine.executeForDetection(detection, context);
        responses.push(...actions);
      }

      experiment.status = ExperimentStatus.EVALUATING;
      const report = this.evaluationEngine.generateReport(
        experiment,
        normalizedEvents,
        detections,
        responses
      );
      this.reports.set(report.id, report);
      experiment.reportId = report.id;

      experiment.status = ExperimentStatus.CLEANUP;
      if (config.cleanupBehavior === 'DESTROY') {
        await this.rangeManager.destroy(env.id);
      } else if (config.cleanupBehavior === 'SNAPSHOT') {
        await this.rangeManager.snapshot(env.id);
      }

      experiment.status = ExperimentStatus.COMPLETED;
      experiment.completedAt = new Date();
      return report;
    } catch (error) {
      experiment.status = ExperimentStatus.FAILED;
      experiment.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  listExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  getReport(id: string): ExperimentReport | undefined {
    return this.reports.get(id);
  }

  listReports(): ExperimentReport[] {
    return Array.from(this.reports.values());
  }

  private async validate(experiment: Experiment): Promise<void> {
    if (this.authorizationLayer.isKillSwitchActive()) {
      throw new Error('Kill switch is active — experiments cannot start');
    }

    const scenario = getScenarioById(experiment.config.adversaryScenarioId);
    if (!scenario) {
      throw new Error(`Adversary scenario not found: ${experiment.config.adversaryScenarioId}`);
    }

    const profile = this.rangeManager.getProfile(experiment.config.environmentProfileId);
    if (!profile) {
      throw new Error(`Environment profile not found: ${experiment.config.environmentProfileId}`);
    }
  }

  private async generateBaseline(experiment: Experiment): Promise<void> {
    const profile = getBackgroundProfileById(experiment.config.backgroundActivityProfileId);
    if (!profile) return;

    const baselineEvents: RawTelemetryEvent[] = [];

    if (profile.httpActivity) {
      baselineEvents.push({
        source: EventSource.APPLICATION_LOG,
        host: 'target-1.range.local',
        eventType: 'http_request',
        severity: 'info',
        environmentId: experiment.environmentId,
        experimentId: experiment.id,
        payload: { method: 'GET', path: '/api/health', status: 200 }
      });
    }

    if (profile.sshActivity) {
      baselineEvents.push({
        source: EventSource.SYSTEM_LOG,
        host: 'target-1.range.local',
        eventType: 'ssh_login',
        severity: 'info',
        environmentId: experiment.environmentId,
        experimentId: experiment.id,
        payload: { user: 'admin', result: 'success' }
      });
    }

    const normalized = this.eventNormalizer.normalizeBatch(baselineEvents);
    for (const event of normalized) {
      this.eventBus.publish(event);
    }
  }

  private async executeScenario(experiment: Experiment): Promise<RawTelemetryEvent[]> {
    const scenario = getScenarioById(experiment.config.adversaryScenarioId)!;
    const events: RawTelemetryEvent[] = [];

    for (const telemetry of scenario.expectedTelemetry) {
      events.push({
        source: EventSource.WAZUH,
        host: 'target-1.range.local',
        destinationHost: 'target-1.range.local',
        eventType: telemetry,
        severity: 'high',
        environmentId: experiment.environmentId,
        experimentId: experiment.id,
        mitreTechnique: scenario.mitreTechnique,
        payload: {
          scenario: scenario.id,
          technique: scenario.mitreTechnique,
          tactic: scenario.mitreTactic
        }
      });
    }

    return events;
  }
}
