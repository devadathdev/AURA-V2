export enum MissionStatus {
  CREATED = 'CREATED',
  PLANNING = 'PLANNING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ROLLING_BACK = 'ROLLING_BACK',
  ROLLED_BACK = 'ROLLED_BACK'
}

export enum TaskStatus {
  CREATED = 'CREATED',
  ANALYZING = 'ANALYZING',
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  IMPLEMENTING = 'IMPLEMENTING',
  TESTING = 'TESTING',
  REVIEWING = 'REVIEWING',
  SECURITY_CHECK = 'SECURITY_CHECK',
  READY_FOR_PR = 'READY_FOR_PR',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
  WAITING_FOR_USER = 'WAITING_FOR_USER'
}

export enum AgentType {
  FORGE = 'FORGE',
  SENTINEL = 'SENTINEL',
  RESEARCH = 'RESEARCH',
  AUTOMATION = 'AUTOMATION',
  CYBER_GUARDIAN = 'CYBER_GUARDIAN',
  WORKSHOP = 'WORKSHOP'
}

export enum AgentCapability {
  SPATIAL_MODELING = 'SPATIAL_MODELING',
  SYSTEM_SIMULATION = 'SYSTEM_SIMULATION',
  OBJECT_MANIPULATION = 'OBJECT_MANIPULATION',
  SPATIAL_EXPLANATION = 'SPATIAL_EXPLANATION',
  WORKSPACE_MANAGEMENT = 'WORKSPACE_MANAGEMENT',
  REPOSITORY_INSPECTION = 'REPOSITORY_INSPECTION',
  ARCHITECTURE_PLANNING = 'ARCHITECTURE_PLANNING',
  FILE_CREATION = 'FILE_CREATION',
  CODE_MODIFICATION = 'CODE_MODIFICATION',
  DEPENDENCY_MANAGEMENT = 'DEPENDENCY_MANAGEMENT',
  BUILD_EXECUTION = 'BUILD_EXECUTION',
  UNIT_TESTING = 'UNIT_TESTING',
  INTEGRATION_TESTING = 'INTEGRATION_TESTING',
  FAILURE_ANALYSIS = 'FAILURE_ANALYSIS',
  PATCH_GENERATION = 'PATCH_GENERATION',
  CODE_REVIEW = 'CODE_REVIEW',
  GIT_CHECKPOINT = 'GIT_CHECKPOINT',
  DIFF_GENERATION = 'DIFF_GENERATION',
  ROLLBACK = 'ROLLBACK',
  BUILD_ARTIFACTS = 'BUILD_ARTIFACTS',
  THREAT_MODELING = 'THREAT_MODELING',
  STATIC_ANALYSIS = 'STATIC_ANALYSIS',
  DEPENDENCY_ANALYSIS = 'DEPENDENCY_ANALYSIS',
  SECRET_DETECTION = 'SECRET_DETECTION',
  AUTH_REVIEW = 'AUTH_REVIEW',
  AUTHZ_REVIEW = 'AUTHZ_REVIEW',
  API_SECURITY_REVIEW = 'API_SECURITY_REVIEW',
  CONFIG_SECURITY_REVIEW = 'CONFIG_SECURITY_REVIEW',
  FINDING_NORMALIZATION = 'FINDING_NORMALIZATION',
  SEVERITY_CLASSIFICATION = 'SEVERITY_CLASSIFICATION',
  REMEDIATION_RECOMMENDATION = 'REMEDIATION_RECOMMENDATION',
  INDEPENDENT_VERIFICATION = 'INDEPENDENT_VERIFICATION',
  BASELINE_VALIDATION = 'BASELINE_VALIDATION',
  SECURITY_REPORTING = 'SECURITY_REPORTING',
  WEB_RESEARCH = 'WEB_RESEARCH',
  DOCUMENTATION_RETRIEVAL = 'DOCUMENTATION_RETRIEVAL',
  REPOSITORY_RESEARCH = 'REPOSITORY_RESEARCH',
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  FACT_VERIFICATION = 'FACT_VERIFICATION',
  EVIDENCE_SYNTHESIS = 'EVIDENCE_SYNTHESIS',
  DEVICE_OPERATIONS = 'DEVICE_OPERATIONS',
  FILE_WORKFLOWS = 'FILE_WORKFLOWS',
  APPLICATION_CONTROL = 'APPLICATION_CONTROL',
  CLOUD_OPERATIONS = 'CLOUD_OPERATIONS',
  DEPLOYMENT = 'DEPLOYMENT',
  SERVICE_MANAGEMENT = 'SERVICE_MANAGEMENT',
  MONITORING = 'MONITORING',
  SCHEDULED_WORKFLOWS = 'SCHEDULED_WORKFLOWS',
  CYBER_RANGE_MANAGEMENT = 'CYBER_RANGE_MANAGEMENT',
  SECURITY_EXPERIMENTATION = 'SECURITY_EXPERIMENTATION',
  THREAT_DETECTION = 'THREAT_DETECTION',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  SECURITY_MONITORING = 'SECURITY_MONITORING'
}

export enum PermissionScope {
  FILESYSTEM_READ = 'filesystem.read',
  FILESYSTEM_WORKSPACE_WRITE = 'filesystem.workspace.write',
  GIT_COMMIT = 'git.commit',
  GIT_PUSH = 'git.push',
  GIT_BRANCH = 'git.branch',
  SANDBOX_EXECUTE = 'sandbox.execute',
  NETWORK_HTTP_ALLOWLISTED = 'network.http.allowlisted',
  SECRETS_REQUEST = 'secrets.request',
  DEPLOYMENT_STAGING = 'deployment.staging',
  DEPLOYMENT_PRODUCTION = 'deployment.production',
  CYBER_RANGE_CONTROL = 'cyber.range.control',
  CYBER_EXPERIMENT_EXECUTE = 'cyber.experiment.execute',
  CYBER_RESPONSE_EXECUTE = 'cyber.response.execute',
  WORKSHOP_SPATIAL_CONTROL = 'workshop.spatial.control',
  WORKSHOP_SIMULATION_EXECUTE = 'workshop.simulation.execute'
}

export enum GovernanceDecision {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
  SANDBOX_ONLY = 'SANDBOX_ONLY',
  ALLOW_WITH_LIMITS = 'ALLOW_WITH_LIMITS'
}

export enum FindingSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum FindingStatus {
  NEW = 'NEW',
  TRIAGED = 'TRIAGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  DISMISSED = 'DISMISSED',
  VERIFIED = 'VERIFIED',
  REOPENED = 'REOPENED'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface Mission {
  id: string;
  objective: string;
  status: MissionStatus;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  goals: Goal[];
  metadata: Record<string, unknown>;
}

export interface Goal {
  id: string;
  missionId: string;
  title: string;
  description: string;
  milestones: Milestone[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  tasks: Task[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface Task {
  id: string;
  milestoneId: string;
  type: string;
  title: string;
  description: string;
  assignedAgent?: AgentType;
  capabilities: AgentCapability[];
  dependencies: string[];
  status: TaskStatus;
  requiredPermissions: PermissionScope[];
  requiresApproval: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  result?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  capabilities: AgentCapability[];
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE';
  health: number;
  lastHeartbeat: Date;
}

export interface AgentMessage {
  id: string;
  missionId: string;
  taskId?: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  type: 'TASK_REQUEST' | 'TASK_RESPONSE' | 'FINDING' | 'VERIFICATION' | 'APPROVAL_REQUEST' | 'STATUS_UPDATE';
  payload: unknown;
  timestamp: Date;
}

export interface SecurityFinding {
  id: string;
  missionId: string;
  taskId?: string;
  findingId: string;
  severity: FindingSeverity;
  category: string;
  component: string;
  location?: { file: string; line?: number };
  description: string;
  evidence: string;
  confidence: number;
  recommendation: string;
  status: FindingStatus;
  verificationState: 'UNVERIFIED' | 'VERIFIED' | 'REOPENED';
  detectedBy: AgentType;
  verifiedBy?: AgentType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRequest {
  id: string;
  missionId: string;
  taskId?: string;
  requestingAgent: AgentType;
  action: string;
  target: string;
  reason: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedResources: string[];
  rollbackAvailable: boolean;
  sentinelStatus?: string;
  status: ApprovalStatus;
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  response?: unknown;
}

export interface ToolRequest {
  id: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tool: string;
  capability: PermissionScope;
  parameters: Record<string, unknown>;
  workspace: string;
  timeout: number;
  timestamp: Date;
}

export interface ToolExecution {
  id: string;
  requestId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tool: string;
  capability: PermissionScope;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  governanceDecision: GovernanceDecision;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface GitCheckpoint {
  id: string;
  missionId: string;
  taskId?: string;
  repository: string;
  startingHead: string;
  branch: string;
  changes: FileChange[];
  commands: string[];
  tests: string[];
  findings: string[];
  artifacts: string[];
  finalHead?: string;
  createdAt: Date;
}

export interface FileChange {
  path: string;
  action: 'CREATE' | 'MODIFY' | 'DELETE';
  content?: string;
  diff?: string;
}

export interface ContextLayer {
  userContext: Record<string, unknown>;
  projectContext: Record<string, unknown>;
  missionContext: Record<string, unknown>;
  agentContext: Record<string, unknown>;
  taskContext: Record<string, unknown>;
}

export interface ModelRoute {
  taskType: string;
  preferredModel: string;
  fallbackModels: string[];
  reasoning: string;
}

export interface AuditEvent {
  id: string;
  missionId?: string;
  taskId?: string;
  agentId?: string;
  actor: string;
  eventType: string;
  objectRef?: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  previousHash?: string;
  eventHash: string;
}

// ── Holographic Workshop Agent Data Model (PRD v1.0) ──

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface WorkshopObject {
  id: string;
  name: string;
  type: string; // 'cylinder' | 'box' | 'coil' | 'field' | 'sphere' | 'magnet' | 'wire' | 'custom'
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  properties: {
    material?: string;
    color?: string;
    size?: string | number;
    radius?: number;
    height?: number;
    width?: number;
    depth?: number;
    windings?: number;
    fieldStrength?: number;
    voltage?: number;
    polarity?: 'positive' | 'negative' | 'north' | 'south';
    [key: string]: unknown;
  };
  connections?: string[]; // IDs of connected objects (Section 12)
  visible: boolean;
  groupId?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkshopConnection {
  id: string;
  source: string; // source object ID
  target: string; // target object ID
  type: 'electrical' | 'magnetic' | 'mechanical' | 'data' | 'logical';
  state: 'active' | 'inactive' | 'fault';
  properties?: Record<string, unknown>;
}

export interface WorkshopAnnotation {
  id: string;
  target: string; // object ID or coordinate
  title: string;
  text: string;
  offset?: Vector3D;
  visible?: boolean;
}

export interface WorkshopSimulation {
  running: boolean;
  speed: number;
  step: number;
  parameters: Record<string, unknown>;
  history?: Array<Record<string, unknown>>;
}

export interface WorkshopCamera {
  rotX: number;
  rotY: number;
  rotZ: number;
  panX: number;
  panY: number;
  zoom: number;
  target?: Vector3D;
}

export interface WorkshopWorkspace {
  workspace_id: string;
  name: string;
  description?: string;
  category?: string;
  objects: WorkshopObject[];
  connections: WorkshopConnection[];
  annotations: WorkshopAnnotation[];
  simulation: WorkshopSimulation;
  camera: WorkshopCamera;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    author?: string;
    safetyNotice?: string;
    [key: string]: unknown;
  };
}

export interface WorkshopActionRequest {
  action: string;
  type?: string;
  workspace_id?: string;
  object_id?: string;
  properties?: Record<string, unknown>;
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
  source?: string;
  target?: string;
  speed?: number;
  [key: string]: unknown;
}

// ── Aura State Integration (PRD Section 14) ──
export type WorkshopAgentStatus =
  | 'IDLE'
  | 'PLANNING'
  | 'BUILDING'
  | 'SIMULATING'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'ERROR';

export interface WorkshopAgentState {
  status: WorkshopAgentStatus;
  message: string;
  activeWorkspaceId?: string;
  timestamp: string;
}

// ── Agent-to-Agent (A2A) Communication (PRD Section 17) ──
export interface WorkshopA2ARequest {
  request_id: string;
  source_agent: string; // e.g. 'aura'
  target_agent: string; // 'holographic_workshop'
  intent: string;       // e.g. 'create_visualization' | 'modify_workspace' | 'simulate'
  task: string;         // e.g. 'Create a working model of a four-stroke engine'
  context?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  response_mode?: 'interactive' | 'batch';
}

export interface WorkshopA2AResponse {
  request_id: string;
  status: 'completed' | 'in_progress' | 'failed';
  workspace_id: string;
  summary: string;
  actions: number;
  interactive: boolean;
  error?: string;
}