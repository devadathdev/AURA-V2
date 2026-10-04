/** Aura Cyber Guardian — core domain types */

export enum RangeStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  CREATING = 'CREATING',
  CONFIGURING = 'CONFIGURING',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  SNAPSHOTTING = 'SNAPSHOTTING',
  DESTROYING = 'DESTROYING',
  REBUILDING = 'REBUILDING',
  UNHEALTHY = 'UNHEALTHY',
  ISOLATED = 'ISOLATED',
  ERROR = 'ERROR'
}

export enum ExperimentStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  PROVISIONING = 'PROVISIONING',
  CONFIGURING = 'CONFIGURING',
  BASELINE = 'BASELINE',
  EXECUTING = 'EXECUTING',
  COLLECTING = 'COLLECTING',
  DETECTING = 'DETECTING',
  RESPONDING = 'RESPONDING',
  EVALUATING = 'EVALUATING',
  REPORTING = 'REPORTING',
  CLEANUP = 'CLEANUP',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum DetectionStatus {
  PENDING = 'PENDING',
  DETECTED = 'DETECTED',
  MISSED = 'MISSED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export enum EventSource {
  WAZUH = 'WAZUH',
  SURICATA = 'SURICATA',
  SYSTEM_LOG = 'SYSTEM_LOG',
  APPLICATION_LOG = 'APPLICATION_LOG',
  NETWORK = 'NETWORK',
  RESPONSE = 'RESPONSE',
  EXPERIMENT = 'EXPERIMENT',
  CONTROLLER = 'CONTROLLER'
}

export enum ResponseActionType {
  BLOCK_SOURCE = 'BLOCK_SOURCE',
  ISOLATE_ENDPOINT = 'ISOLATE_ENDPOINT',
  DISABLE_ACCOUNT = 'DISABLE_ACCOUNT',
  STOP_SERVICE = 'STOP_SERVICE',
  CAPTURE_EVIDENCE = 'CAPTURE_EVIDENCE',
  SNAPSHOT_ENDPOINT = 'SNAPSHOT_ENDPOINT',
  RESTORE_ENVIRONMENT = 'RESTORE_ENVIRONMENT',
  MARK_COMPROMISED = 'MARK_COMPROMISED'
}

export enum ZoneType {
  ATTACKER = 'ATTACKER',
  TARGET = 'TARGET',
  DEFENDER = 'DEFENDER',
  MANAGEMENT = 'MANAGEMENT'
}

export interface AuthorizedAsset {
  id: string;
  hostname: string;
  ipAddress: string;
  zone: ZoneType;
  criticality: RiskLevel;
}

export interface AuthorizationScope {
  environmentId: string;
  authorizedNetworks: string[];
  authorizedAssets: AuthorizedAsset[];
  allowedActions: string[];
  expiresAt?: Date;
}

export interface EnvironmentProfile {
  id: string;
  name: string;
  description: string;
  targetCount: number;
  networkCidr: string;
  zones: ZoneType[];
  defenderStack: string[];
  isolationEnabled: boolean;
}

export interface EnvironmentState {
  id: string;
  profileId: string;
  status: RangeStatus;
  targets: AuthorizedAsset[];
  networkStatus: 'UP' | 'DOWN' | 'DEGRADED';
  resourceUsage: { cpuPercent: number; memoryPercent: number; diskPercent: number };
  healthChecks: HealthCheck[];
  createdAt: Date;
  updatedAt: Date;
  lastHealthCheckAt?: Date;
}

export interface HealthCheck {
  component: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  message?: string;
  checkedAt: Date;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  source: EventSource;
  sourceHost: string;
  destinationHost?: string;
  eventType: string;
  severity: RiskLevel;
  experimentId?: string;
  environmentId: string;
  mitreTechnique?: string;
  detectionStatus: DetectionStatus;
  rawPayload: Record<string, unknown>;
  normalizedFields: Record<string, unknown>;
}

export interface Detection {
  id: string;
  timestamp: Date;
  experimentId?: string;
  environmentId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  correlatedEventIds: string[];
  mitreTechnique?: string;
  detectionSource: EventSource;
  detectionLatencyMs?: number;
  status: DetectionStatus;
}

export interface ResponseAction {
  id: string;
  timestamp: Date;
  action: ResponseActionType;
  target: string;
  trigger: string;
  reason: string;
  experimentId?: string;
  environmentId: string;
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  responseLatencyMs?: number;
  auditTrail: Record<string, unknown>;
}

export interface AdversaryScenario {
  id: string;
  name: string;
  description: string;
  mitreTechnique: string;
  mitreTactic: string;
  preconditions: string[];
  authorizedTargetScope: ZoneType[];
  expectedTelemetry: string[];
  expectedDetection: boolean;
  expectedResponse?: ResponseActionType;
  cleanupRequirements: string[];
}

export interface BackgroundActivityProfile {
  id: string;
  name: string;
  description: string;
  httpActivity: boolean;
  sshActivity: boolean;
  databaseActivity: boolean;
  endpointActivity: boolean;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  environmentProfileId: string;
  targetProfile: string;
  backgroundActivityProfileId: string;
  adversaryScenarioId: string;
  detectionRequirements: string[];
  responsePolicyId: string;
  timeoutSeconds: number;
  cleanupBehavior: 'DESTROY' | 'SNAPSHOT' | 'PRESERVE';
}

export interface Experiment {
  id: string;
  config: ExperimentConfig;
  environmentId: string;
  status: ExperimentStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  reportId?: string;
}

export interface ExperimentReport {
  id: string;
  experimentId: string;
  environmentId: string;
  scenario: string;
  startTime: Date;
  endTime: Date;
  result: 'PASS' | 'FAIL' | 'PARTIAL';
  adversaryActivity: {
    simulatedBehavior: string[];
    mitreTechniques: string[];
    targets: string[];
  };
  detection: {
    alertsGenerated: number;
    detectionLatencyMs: number;
    detectionConfidence: number;
    detectionSource: EventSource;
    gaps: string[];
  };
  response: {
    actionsExecuted: ResponseAction[];
    responseLatencyMs: number;
    containmentResult: 'SUCCESS' | 'FAILURE' | 'NOT_TRIGGERED';
  };
  evaluation: {
    overallResult: 'PASS' | 'FAIL' | 'PARTIAL';
    detectionGaps: string[];
    responseGaps: string[];
    recommendations: string[];
    metrics: EvaluationMetrics;
  };
}

export interface EvaluationMetrics {
  detectionLatencyMs: number;
  responseLatencyMs: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  containmentSuccess: boolean;
  attackCoverage: string[];
}

export interface CyberGuardianStatus {
  environment: {
    status: RangeStatus;
    targetCount: number;
    networkStatus: string;
    resourceUsage: EnvironmentState['resourceUsage'];
  };
  security: {
    activeAlerts: number;
    criticalAlerts: number;
    detectedThreats: number;
    containedThreats: number;
  };
  experiments: {
    running: number;
    completed: number;
    failed: number;
    detectionRate: number;
    responseRate: number;
  };
  performance: {
    meanDetectionTimeMs: number;
    meanResponseTimeMs: number;
    detectionAccuracy: number;
    falsePositives: number;
    falseNegatives: number;
  };
  killSwitchActive: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  actor: string;
  eventType: string;
  environmentId?: string;
  experimentId?: string;
  action: string;
  target?: string;
  result: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  reason?: string;
  payload: Record<string, unknown>;
}
