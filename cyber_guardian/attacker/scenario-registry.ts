import { AdversaryScenario, ZoneType } from '../types';

export const ADVERSARY_SCENARIOS: AdversaryScenario[] = [
  {
    id: 'scenario-ssh-brute-force',
    name: 'SSH Brute Force',
    description: 'Simulates repeated failed SSH login attempts against a target endpoint',
    mitreTechnique: 'T1110.001',
    mitreTactic: 'Credential Access',
    preconditions: ['Target SSH service is running', 'Attacker zone has network access to target zone'],
    authorizedTargetScope: [ZoneType.TARGET],
    expectedTelemetry: ['authentication_failure', 'ssh_failed_login', 'sshd_failed'],
    expectedDetection: true,
    expectedResponse: 'BLOCK_SOURCE' as any,
    cleanupRequirements: ['Reset failed login counters', 'Unblock test source IP']
  },
  {
    id: 'scenario-port-scan',
    name: 'Network Port Scan',
    description: 'Simulates network reconnaissance via port scanning',
    mitreTechnique: 'T1046',
    mitreTactic: 'Discovery',
    preconditions: ['Attacker zone has network access to target zone'],
    authorizedTargetScope: [ZoneType.TARGET],
    expectedTelemetry: ['port_scan', 'network_scan'],
    expectedDetection: true,
    cleanupRequirements: ['Clear Suricata scan alerts']
  }
];

export function getScenarioById(id: string): AdversaryScenario | undefined {
  return ADVERSARY_SCENARIOS.find(s => s.id === id);
}

export function listScenarios(): AdversaryScenario[] {
  return [...ADVERSARY_SCENARIOS];
}
