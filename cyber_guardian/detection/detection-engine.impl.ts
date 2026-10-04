import {
  SecurityEvent,
  Detection,
  DetectionStatus,
  RiskLevel,
  EventSource
} from '../types';
import { DetectionRule } from './detection-engine';
import { DEFAULT_DETECTION_RULES } from './rules';

export class DetectionEngine {
  private rules: DetectionRule[] = [...DEFAULT_DETECTION_RULES];
  private detections: Detection[] = [];

  addRule(rule: DetectionRule): void {
    this.rules.push(rule);
  }

  analyze(events: SecurityEvent[], experimentId?: string): Detection[] {
    const newDetections: Detection[] = [];

    for (const rule of this.rules) {
      const matched = this.correlateEvents(events, rule);
      if (matched.length >= rule.minEventCount) {
        const detection = this.createDetection(rule, matched, experimentId);
        newDetections.push(detection);
        this.detections.push(detection);

        for (const event of matched) {
          event.detectionStatus = DetectionStatus.DETECTED;
        }
      }
    }

    return newDetections;
  }

  getDetections(filter?: { experimentId?: string; environmentId?: string }): Detection[] {
    let results = [...this.detections];
    if (filter?.experimentId) {
      results = results.filter(d => d.experimentId === filter.experimentId);
    }
    if (filter?.environmentId) {
      results = results.filter(d => d.environmentId === filter.environmentId);
    }
    return results;
  }

  calculateRiskScore(
    severity: RiskLevel,
    correlatedCount: number,
    targetCriticality: RiskLevel,
    confidence: number
  ): number {
    const severityWeight: Record<RiskLevel, number> = {
      [RiskLevel.LOW]: 10,
      [RiskLevel.MEDIUM]: 30,
      [RiskLevel.HIGH]: 60,
      [RiskLevel.CRITICAL]: 90
    };

    const base = severityWeight[severity] ?? 30;
    const correlationBonus = Math.min(correlatedCount * 5, 25);
    const criticalityBonus = severityWeight[targetCriticality] * 0.1;
    const confidenceFactor = confidence / 100;

    return Math.min(100, Math.round((base + correlationBonus + criticalityBonus) * confidenceFactor));
  }

  private correlateEvents(events: SecurityEvent[], rule: DetectionRule): SecurityEvent[] {
    const now = Date.now();
    return events.filter(event => {
      const withinWindow = now - event.timestamp.getTime() <= rule.correlationWindowMs;
      const matchesType = rule.eventTypes.some(t =>
        event.eventType.toLowerCase().includes(t.toLowerCase())
      );
      const matchesSource = rule.sources.includes(event.source);
      return withinWindow && matchesType && matchesSource;
    });
  }

  private createDetection(rule: DetectionRule, events: SecurityEvent[], experimentId?: string): Detection {
    const firstEvent = events[0];
    const severity = typeof rule.severity === 'string'
      ? (RiskLevel[rule.severity as keyof typeof RiskLevel] ?? RiskLevel.MEDIUM)
      : rule.severity;

    const confidence = Math.min(100, 50 + events.length * 10);
    const riskScore = this.calculateRiskScore(severity, events.length, RiskLevel.MEDIUM, confidence);

    const earliestEvent = events.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
    const latestEvent = events.reduce((a, b) => a.timestamp > b.timestamp ? a : b);

    return {
      id: `det-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: latestEvent.timestamp,
      experimentId: experimentId ?? firstEvent.experimentId,
      environmentId: firstEvent.environmentId,
      title: rule.name,
      description: rule.description,
      riskLevel: this.scoreToRiskLevel(riskScore),
      riskScore,
      confidence,
      correlatedEventIds: events.map(e => e.id),
      mitreTechnique: rule.mitreTechnique,
      detectionSource: firstEvent.source as EventSource,
      detectionLatencyMs: latestEvent.timestamp.getTime() - earliestEvent.timestamp.getTime(),
      status: DetectionStatus.DETECTED
    };
  }

  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 35) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
}
