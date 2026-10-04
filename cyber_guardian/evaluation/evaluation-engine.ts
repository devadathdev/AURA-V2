import {
  Experiment,
  ExperimentReport,
  SecurityEvent,
  Detection,
  ResponseAction,
  EvaluationMetrics,
  EventSource
} from '../types';
import { getScenarioById } from '../attacker/scenario-registry';

export class EvaluationEngine {
  generateReport(
    experiment: Experiment,
    events: SecurityEvent[],
    detections: Detection[],
    responses: ResponseAction[]
  ): ExperimentReport {
    const scenario = getScenarioById(experiment.config.adversaryScenarioId);
    const startTime = experiment.startedAt ?? new Date();
    const endTime = new Date();

    const detectionLatency = detections.length > 0
      ? detections.reduce((sum, d) => sum + (d.detectionLatencyMs ?? 0), 0) / detections.length
      : 0;

    const responseLatency = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.responseLatencyMs ?? 0), 0) / responses.length
      : 0;

    const expectedDetection = scenario?.expectedDetection ?? true;
    const wasDetected = detections.length > 0;
    const detectionGaps: string[] = [];

    if (expectedDetection && !wasDetected) {
      detectionGaps.push(`Expected detection for ${scenario?.mitreTechnique} but no alerts were generated`);
    }

    const successfulResponses = responses.filter(r => r.result === 'SUCCESS');
    const containmentResult = successfulResponses.some(r =>
      r.action === 'ISOLATE_ENDPOINT' || r.action === 'BLOCK_SOURCE'
    ) ? 'SUCCESS' as const : responses.length === 0 ? 'NOT_TRIGGERED' as const : 'FAILURE' as const;

    const metrics: EvaluationMetrics = {
      detectionLatencyMs: detectionLatency,
      responseLatencyMs: responseLatency,
      detectionAccuracy: expectedDetection ? (wasDetected ? 1.0 : 0.0) : 1.0,
      falsePositiveRate: 0,
      falseNegativeRate: expectedDetection && !wasDetected ? 1.0 : 0.0,
      containmentSuccess: containmentResult === 'SUCCESS',
      attackCoverage: scenario ? [scenario.mitreTechnique] : []
    };

    const overallResult = this.determineOverallResult(wasDetected, expectedDetection, containmentResult);

    return {
      id: `report-${experiment.id}`,
      experimentId: experiment.id,
      environmentId: experiment.environmentId,
      scenario: scenario?.name ?? experiment.config.name,
      startTime,
      endTime,
      result: overallResult,
      adversaryActivity: {
        simulatedBehavior: scenario?.expectedTelemetry ?? [],
        mitreTechniques: scenario ? [scenario.mitreTechnique] : [],
        targets: ['target-1.range.local']
      },
      detection: {
        alertsGenerated: detections.length,
        detectionLatencyMs: detectionLatency,
        detectionConfidence: detections.length > 0
          ? detections.reduce((s, d) => s + d.confidence, 0) / detections.length
          : 0,
        detectionSource: detections[0]?.detectionSource ?? EventSource.WAZUH,
        gaps: detectionGaps
      },
      response: {
        actionsExecuted: responses,
        responseLatencyMs: responseLatency,
        containmentResult
      },
      evaluation: {
        overallResult,
        detectionGaps,
        responseGaps: containmentResult === 'FAILURE' ? ['Containment playbook did not execute successfully'] : [],
        recommendations: this.generateRecommendations(metrics, detectionGaps),
        metrics
      }
    };
  }

  private determineOverallResult(
    wasDetected: boolean,
    expectedDetection: boolean,
    containment: 'SUCCESS' | 'FAILURE' | 'NOT_TRIGGERED'
  ): 'PASS' | 'FAIL' | 'PARTIAL' {
    if (expectedDetection && wasDetected && (containment === 'SUCCESS' || containment === 'NOT_TRIGGERED')) {
      return 'PASS';
    }
    if (!wasDetected && expectedDetection) return 'FAIL';
    if (wasDetected && containment === 'FAILURE') return 'PARTIAL';
    return 'PARTIAL';
  }

  private generateRecommendations(metrics: EvaluationMetrics, gaps: string[]): string[] {
    const recommendations: string[] = [];

    if (metrics.detectionLatencyMs > 10000) {
      recommendations.push('Reduce detection latency by tuning correlation windows and alert thresholds');
    }
    if (metrics.falseNegativeRate > 0) {
      recommendations.push('Review detection rules for the simulated ATT&CK technique and add missing correlations');
    }
    if (!metrics.containmentSuccess) {
      recommendations.push('Verify containment playbook authorization and target resolution templates');
    }
    if (gaps.length > 0) {
      recommendations.push('Investigate telemetry pipeline gaps between adversary simulation and SIEM ingestion');
    }

    return recommendations;
  }
}
