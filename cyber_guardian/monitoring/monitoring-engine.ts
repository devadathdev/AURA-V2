import {
  EnvironmentState,
  RangeStatus,
  SecurityEvent,
  Detection,
  Experiment,
  CyberGuardianStatus
} from '../types';
import { RangeManager } from '../range/range-manager';
import { EventBus } from '../telemetry/event-bus';
import { DetectionEngine } from '../detection/detection-engine';
import { ExperimentEngine } from '../experiments/experiment-engine';
import { AuthorizationLayer } from '../authorization/authorization-layer';

export class MonitoringEngine {
  private rangeManager: RangeManager;
  private eventBus: EventBus;
  private detectionEngine: DetectionEngine;
  private experimentEngine: ExperimentEngine;
  private authorizationLayer: AuthorizationLayer;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(
    rangeManager: RangeManager,
    eventBus: EventBus,
    detectionEngine: DetectionEngine,
    experimentEngine: ExperimentEngine,
    authorizationLayer: AuthorizationLayer
  ) {
    this.rangeManager = rangeManager;
    this.eventBus = eventBus;
    this.detectionEngine = detectionEngine;
    this.experimentEngine = experimentEngine;
    this.authorizationLayer = authorizationLayer;
  }

  startAutonomousLoop(intervalMs = 30000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.monitoringInterval = setInterval(async () => {
      if (this.authorizationLayer.isKillSwitchActive()) return;

      const environments = this.rangeManager.listEnvironments();
      for (const env of environments) {
        if (env.status !== RangeStatus.RUNNING) continue;

        await this.rangeManager.runHealthChecks(env.id);
        const events = this.eventBus.getEvents({ environmentId: env.id });
        if (events.length > 0) {
          this.detectionEngine.analyze(events);
        }
      }
    }, intervalMs);
  }

  stopAutonomousLoop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
  }

  getStatus(): CyberGuardianStatus {
    const environments = this.rangeManager.listEnvironments();
    const experiments = this.experimentEngine.listExperiments();
    const detections = this.detectionEngine.getDetections();
    const reports = this.experimentEngine.listReports();

    const runningEnv = environments.find(e => e.status === RangeStatus.RUNNING);
    const completedExperiments = experiments.filter(e => e.status === 'COMPLETED');
    const failedExperiments = experiments.filter(e => e.status === 'FAILED');
    const runningExperiments = experiments.filter(e =>
      !['COMPLETED', 'FAILED', 'CANCELLED'].includes(e.status)
    );

    const detectionLatencies = reports.map(r => r.detection.detectionLatencyMs).filter(Boolean);
    const responseLatencies = reports.map(r => r.response.responseLatencyMs).filter(Boolean);

    return {
      environment: {
        status: runningEnv?.status ?? RangeStatus.UNINITIALIZED,
        targetCount: runningEnv?.targets.filter(t => t.zone === 'TARGET').length ?? 0,
        networkStatus: runningEnv?.networkStatus ?? 'DOWN',
        resourceUsage: runningEnv?.resourceUsage ?? { cpuPercent: 0, memoryPercent: 0, diskPercent: 0 }
      },
      security: {
        activeAlerts: detections.filter(d => d.status === 'DETECTED').length,
        criticalAlerts: detections.filter(d => d.riskLevel === 'CRITICAL').length,
        detectedThreats: detections.length,
        containedThreats: detections.filter(d => d.status === 'DETECTED').length
      },
      experiments: {
        running: runningExperiments.length,
        completed: completedExperiments.length,
        failed: failedExperiments.length,
        detectionRate: completedExperiments.length > 0
          ? reports.filter(r => r.detection.alertsGenerated > 0).length / completedExperiments.length
          : 0,
        responseRate: completedExperiments.length > 0
          ? reports.filter(r => r.response.containmentResult === 'SUCCESS').length / completedExperiments.length
          : 0
      },
      performance: {
        meanDetectionTimeMs: detectionLatencies.length > 0
          ? detectionLatencies.reduce((a, b) => a + b, 0) / detectionLatencies.length
          : 0,
        meanResponseTimeMs: responseLatencies.length > 0
          ? responseLatencies.reduce((a, b) => a + b, 0) / responseLatencies.length
          : 0,
        detectionAccuracy: reports.length > 0
          ? reports.reduce((s, r) => s + r.evaluation.metrics.detectionAccuracy, 0) / reports.length
          : 0,
        falsePositives: 0,
        falseNegatives: reports.filter(r => r.evaluation.metrics.falseNegativeRate > 0).length
      },
      killSwitchActive: this.authorizationLayer.isKillSwitchActive()
    };
  }
}
