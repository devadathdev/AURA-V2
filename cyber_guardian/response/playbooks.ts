import { ResponseActionType } from '../types';

export interface PlaybookStep {
  action: ResponseActionType;
  target: string;
  reason: string;
  timeoutSeconds: number;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  triggerConditions: {
    minRiskLevel: string;
    mitreTechniques?: string[];
    detectionRuleIds?: string[];
  };
  steps: PlaybookStep[];
}

export const DEFAULT_PLAYBOOKS: Playbook[] = [
  {
    id: 'playbook-contain-ssh-brute-force',
    name: 'SSH Brute Force Containment',
    description: 'Block attacking source and isolate targeted endpoint on SSH brute force detection',
    triggerConditions: {
      minRiskLevel: 'HIGH',
      mitreTechniques: ['T1110.001'],
      detectionRuleIds: ['rule-ssh-brute-force']
    },
    steps: [
      {
        action: ResponseActionType.BLOCK_SOURCE,
        target: '${source_host}',
        reason: 'Block source IP after SSH brute force detection',
        timeoutSeconds: 10
      },
      {
        action: ResponseActionType.ISOLATE_ENDPOINT,
        target: '${destination_host}',
        reason: 'Isolate targeted endpoint to prevent further compromise',
        timeoutSeconds: 15
      },
      {
        action: ResponseActionType.CAPTURE_EVIDENCE,
        target: '${destination_host}',
        reason: 'Collect forensic evidence from isolated endpoint',
        timeoutSeconds: 30
      }
    ]
  }
];
