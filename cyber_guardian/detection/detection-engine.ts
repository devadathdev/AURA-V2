import { EventSource, RiskLevel } from '../types';

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  mitreTechnique: string;
  eventTypes: string[];
  sources: string[];
  correlationWindowMs: number;
  minEventCount: number;
  severity: RiskLevel | string;
  riskScore: number;
}

export { DetectionEngine } from './detection-engine.impl';
