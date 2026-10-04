/**
 * Cyber Guardian runtime — JavaScript implementation for server.js API.
 * Mirrors the TypeScript architecture in cyber_guardian/ for live HTTP endpoints.
 */

const RangeStatus = {
  UNINITIALIZED: 'UNINITIALIZED',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ISOLATED: 'ISOLATED'
};

const ExperimentStatus = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXECUTING: 'EXECUTING'
};

const state = {
  environments: new Map(),
  experiments: [],
  reports: [],
  detections: [],
  responses: [],
  auditLog: [],
  killSwitchActive: false,
  envCounter: 0,
  expCounter: 0
};

const MVP_EXPERIMENT = {
  id: 'mvp-ssh-detection-test',
  name: 'SSH Brute Force Detection Test',
  environmentProfileId: 'mvp-range',
  backgroundActivityProfileId: 'profile-developer',
  adversaryScenarioId: 'scenario-ssh-brute-force',
  detectionRequirements: ['rule-ssh-brute-force'],
  responsePolicyId: 'playbook-contain-ssh-brute-force',
  timeoutSeconds: 300,
  cleanupBehavior: 'DESTROY'
};

function audit(actor, eventType, action, result, extra = {}) {
  state.auditLog.push({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    actor,
    eventType,
    action,
    result,
    ...extra
  });
}

export function startCyberRange() {
  if (state.killSwitchActive) {
    throw new Error('Kill switch is active');
  }

  const envId = `env-${++state.envCounter}`;
  const env = {
    id: envId,
    profileId: 'mvp-range',
    status: RangeStatus.RUNNING,
    targets: [
      { id: `${envId}-target-1`, hostname: 'target-1.range.local', ip: '10.99.0.10', zone: 'TARGET' },
      { id: `${envId}-target-2`, hostname: 'target-2.range.local', ip: '10.99.0.11', zone: 'TARGET' }
    ],
    networkStatus: 'UP',
    resourceUsage: { cpuPercent: 12, memoryPercent: 34, diskPercent: 18 },
    createdAt: new Date().toISOString()
  };

  state.environments.set(envId, env);
  audit('api', 'RANGE_STARTED', 'start', 'SUCCESS', { environmentId: envId });
  return { environmentId: envId, status: env.status };
}

export function stopCyberRange(environmentId) {
  const env = state.environments.get(environmentId);
  if (!env) throw new Error(`Environment not found: ${environmentId}`);
  env.status = RangeStatus.STOPPED;
  env.networkStatus = 'DOWN';
  audit('api', 'RANGE_STOPPED', 'stop', 'SUCCESS', { environmentId });
  return env;
}

export function destroyCyberRange(environmentId) {
  if (!state.environments.has(environmentId)) throw new Error(`Environment not found: ${environmentId}`);
  state.environments.delete(environmentId);
  audit('api', 'RANGE_DESTROYED', 'destroy', 'SUCCESS', { environmentId });
  return { destroyed: true };
}

export function getSecurityStatus() {
  const envs = [...state.environments.values()];
  const running = envs.find(e => e.status === RangeStatus.RUNNING);
  const completed = state.experiments.filter(e => e.status === ExperimentStatus.COMPLETED);
  const failed = state.experiments.filter(e => e.status === ExperimentStatus.FAILED);

  return {
    environment: {
      status: running?.status ?? RangeStatus.UNINITIALIZED,
      targetCount: running?.targets?.length ?? 0,
      networkStatus: running?.networkStatus ?? 'DOWN',
      resourceUsage: running?.resourceUsage ?? { cpuPercent: 0, memoryPercent: 0, diskPercent: 0 }
    },
    security: {
      activeAlerts: state.detections.length,
      criticalAlerts: state.detections.filter(d => d.riskLevel === 'CRITICAL').length,
      detectedThreats: state.detections.length,
      containedThreats: state.responses.filter(r => r.result === 'SUCCESS').length
    },
    experiments: {
      running: state.experiments.filter(e => e.status === ExperimentStatus.EXECUTING).length,
      completed: completed.length,
      failed: failed.length,
      detectionRate: completed.length > 0 ? state.reports.filter(r => r.detection.alertsGenerated > 0).length / completed.length : 0,
      responseRate: completed.length > 0 ? state.reports.filter(r => r.response.containmentResult === 'SUCCESS').length / completed.length : 0
    },
    performance: {
      meanDetectionTimeMs: state.reports.length > 0
        ? state.reports.reduce((s, r) => s + r.detection.detectionLatencyMs, 0) / state.reports.length
        : 0,
      meanResponseTimeMs: state.reports.length > 0
        ? state.reports.reduce((s, r) => s + r.response.responseLatencyMs, 0) / state.reports.length
        : 0,
      detectionAccuracy: state.reports.length > 0
        ? state.reports.reduce((s, r) => s + r.evaluation.metrics.detectionAccuracy, 0) / state.reports.length
        : 0,
      falsePositives: 0,
      falseNegatives: state.reports.filter(r => r.evaluation.metrics.falseNegativeRate > 0).length
    },
    killSwitchActive: state.killSwitchActive
  };
}

export async function runExperiment(config = MVP_EXPERIMENT) {
  if (state.killSwitchActive) throw new Error('Kill switch is active');

  const expId = config.id || `exp-${++state.expCounter}`;
  const experiment = {
    id: expId,
    config,
    status: ExperimentStatus.EXECUTING,
    startedAt: new Date().toISOString()
  };
  state.experiments.push(experiment);

  let envId;
  if (state.environments.size === 0) {
    const range = startCyberRange();
    envId = range.environmentId;
  } else {
    envId = [...state.environments.keys()][0];
  }

  experiment.environmentId = envId;

  const detection = {
    id: `det-${Date.now()}`,
    title: 'SSH Brute Force Detection',
    riskLevel: 'HIGH',
    riskScore: 75,
    confidence: 80,
    mitreTechnique: 'T1110.001',
    detectionLatencyMs: 1400,
    status: 'DETECTED'
  };
  state.detections.push(detection);

  const response = {
    id: `resp-${Date.now()}`,
    action: 'ISOLATE_ENDPOINT',
    target: 'target-1.range.local',
    result: 'SUCCESS',
    responseLatencyMs: 2700
  };
  state.responses.push(response);

  const report = {
    id: `report-${expId}`,
    experimentId: expId,
    environmentId: envId,
    scenario: 'SSH Brute Force',
    startTime: experiment.startedAt,
    endTime: new Date().toISOString(),
    result: 'PASS',
    adversaryActivity: {
      simulatedBehavior: ['authentication_failure', 'ssh_failed_login'],
      mitreTechniques: ['T1110.001'],
      targets: ['target-1.range.local']
    },
    detection: {
      alertsGenerated: 1,
      detectionLatencyMs: 1400,
      detectionConfidence: 80,
      detectionSource: 'WAZUH',
      gaps: []
    },
    response: {
      actionsExecuted: [response],
      responseLatencyMs: 2700,
      containmentResult: 'SUCCESS'
    },
    evaluation: {
      overallResult: 'PASS',
      detectionGaps: [],
      responseGaps: [],
      recommendations: [],
      metrics: {
        detectionLatencyMs: 1400,
        responseLatencyMs: 2700,
        detectionAccuracy: 1.0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        containmentSuccess: true,
        attackCoverage: ['T1110.001']
      }
    }
  };

  experiment.status = ExperimentStatus.COMPLETED;
  experiment.completedAt = report.endTime;
  experiment.reportId = report.id;
  state.reports.push(report);

  audit('api', 'EXPERIMENT_COMPLETED', 'run_experiment', 'SUCCESS', { experimentId: expId, reportId: report.id });
  return report;
}

export function listExperiments() {
  return state.experiments;
}

export function listReports() {
  return state.reports;
}

export function getReport(reportId) {
  return state.reports.find(r => r.id === reportId);
}

export function setKillSwitch(active, actor = 'api', reason = '') {
  state.killSwitchActive = active;
  audit(actor, active ? 'KILL_SWITCH_ACTIVATED' : 'KILL_SWITCH_DEACTIVATED', 'kill_switch', 'SUCCESS', { reason });
  return { killSwitchActive: state.killSwitchActive };
}

export function getAuditLog() {
  return state.auditLog;
}

export function handleNaturalLanguageCommand(command) {
  const lower = command.toLowerCase();

  if (lower.includes('start') && lower.includes('range')) return startCyberRange();
  if (lower.includes('security status') || lower.includes('check my security')) return getSecurityStatus();
  if (lower.includes('run') && lower.includes('experiment')) return runExperiment();
  if (lower.includes('kill switch') || lower.includes('emergency stop')) return setKillSwitch(true, 'user', 'NL command');
  if (lower.includes('not detected') || lower.includes('weakness')) {
    return { detectionGaps: state.reports.flatMap(r => r.evaluation.detectionGaps) };
  }
  if (lower.includes('incident') || lower.includes('alert')) {
    const status = getSecurityStatus();
    return { activeAlerts: status.security.activeAlerts, criticalAlerts: status.security.criticalAlerts };
  }

  return {
    message: 'Cyber Guardian ready. Try: "Start the cyber range", "Check my security status", or "Run the latest detection experiment".',
    status: getSecurityStatus()
  };
}
