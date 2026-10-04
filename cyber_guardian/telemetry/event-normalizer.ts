import { SecurityEvent, EventSource, RiskLevel, DetectionStatus } from '../types';

export interface RawTelemetryEvent {
  source: EventSource;
  timestamp?: string | Date;
  host: string;
  destinationHost?: string;
  eventType: string;
  severity?: string;
  environmentId: string;
  experimentId?: string;
  mitreTechnique?: string;
  payload: Record<string, unknown>;
}

const SEVERITY_MAP: Record<string, RiskLevel> = {
  critical: RiskLevel.CRITICAL,
  high: RiskLevel.HIGH,
  medium: RiskLevel.MEDIUM,
  low: RiskLevel.LOW,
  info: RiskLevel.LOW,
  alert: RiskLevel.HIGH,
  warning: RiskLevel.MEDIUM
};

export class EventNormalizer {
  normalize(raw: RawTelemetryEvent): SecurityEvent {
    const severity = this.mapSeverity(raw.severity ?? raw.payload.severity as string);
    const timestamp = raw.timestamp ? new Date(raw.timestamp) : new Date();

    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      source: raw.source,
      sourceHost: raw.host,
      destinationHost: raw.destinationHost,
      eventType: raw.eventType,
      severity,
      experimentId: raw.experimentId,
      environmentId: raw.environmentId,
      mitreTechnique: raw.mitreTechnique ?? (raw.payload.mitre_technique as string),
      detectionStatus: DetectionStatus.PENDING,
      rawPayload: raw.payload,
      normalizedFields: this.extractNormalizedFields(raw)
    };
  }

  normalizeBatch(rawEvents: RawTelemetryEvent[]): SecurityEvent[] {
    return rawEvents.map(e => this.normalize(e));
  }

  private mapSeverity(value?: string): RiskLevel {
    if (!value) return RiskLevel.MEDIUM;
    return SEVERITY_MAP[value.toLowerCase()] ?? RiskLevel.MEDIUM;
  }

  private extractNormalizedFields(raw: RawTelemetryEvent): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    switch (raw.source) {
      case EventSource.WAZUH:
        fields.ruleId = raw.payload.rule?.id ?? raw.payload.rule_id;
        fields.ruleDescription = raw.payload.rule?.description ?? raw.payload.description;
        fields.agentName = raw.payload.agent?.name ?? raw.host;
        break;
      case EventSource.SURICATA:
        fields.signatureId = raw.payload.alert?.signature_id ?? raw.payload.signature_id;
        fields.signature = raw.payload.alert?.signature ?? raw.payload.signature;
        fields.category = raw.payload.alert?.category ?? raw.payload.category;
        break;
      case EventSource.SYSTEM_LOG:
        fields.process = raw.payload.process ?? raw.payload.program;
        fields.user = raw.payload.user ?? raw.payload.uid;
        break;
      default:
        break;
    }

    return fields;
  }
}
