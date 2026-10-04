import { DetectionRule } from './rules';

export const DEFAULT_DETECTION_RULES: DetectionRule[] = [
  {
    id: 'rule-ssh-brute-force',
    name: 'SSH Brute Force Detection',
    description: 'Detects multiple failed SSH authentication attempts from the same source',
    mitreTechnique: 'T1110.001',
    eventTypes: ['authentication_failure', 'ssh_failed_login', 'sshd_failed'],
    sources: ['WAZUH', 'SYSTEM_LOG'],
    correlationWindowMs: 60000,
    minEventCount: 5,
    severity: 'HIGH',
    riskScore: 75
  },
  {
    id: 'rule-port-scan',
    name: 'Port Scan Detection',
    description: 'Detects network port scanning activity via Suricata',
    mitreTechnique: 'T1046',
    eventTypes: ['port_scan', 'network_scan', 'ET SCAN'],
    sources: ['SURICATA'],
    correlationWindowMs: 30000,
    minEventCount: 3,
    severity: 'MEDIUM',
    riskScore: 55
  },
  {
    id: 'rule-suspicious-process',
    name: 'Suspicious Process Execution',
    description: 'Detects execution of suspicious processes on target endpoints',
    mitreTechnique: 'T1059',
    eventTypes: ['process_created', 'syscheck', 'command_execution'],
    sources: ['WAZUH', 'SYSTEM_LOG'],
    correlationWindowMs: 10000,
    minEventCount: 1,
    severity: 'HIGH',
    riskScore: 70
  },
  {
    id: 'rule-lateral-movement',
    name: 'Lateral Movement Detection',
    description: 'Detects SSH connections between internal targets suggesting lateral movement',
    mitreTechnique: 'T1021.004',
    eventTypes: ['ssh_login', 'authentication_success', 'session_opened'],
    sources: ['WAZUH', 'SYSTEM_LOG', 'NETWORK'],
    correlationWindowMs: 120000,
    minEventCount: 2,
    severity: 'CRITICAL',
    riskScore: 90
  }
];
