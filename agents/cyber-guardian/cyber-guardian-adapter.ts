import { Agent, AgentType, AgentCapability, Task, Mission } from '../../shared/types';
import { getCyberGuardianController } from '../../cyber_guardian/controller/controller';
import { ExperimentConfig } from '../../cyber_guardian/types';

export interface CyberGuardianAdapter extends Agent {
  executeCyberGuardianTask(task: Task, mission: Mission): Promise<unknown>;
  handleNaturalLanguageCommand(command: string): Promise<unknown>;
}

export function createCyberGuardianAdapter(): CyberGuardianAdapter {
  const controller = getCyberGuardianController();

  const capabilities: AgentCapability[] = [
    AgentCapability.CYBER_RANGE_MANAGEMENT,
    AgentCapability.SECURITY_EXPERIMENTATION,
    AgentCapability.THREAT_DETECTION,
    AgentCapability.INCIDENT_RESPONSE,
    AgentCapability.SECURITY_MONITORING,
    AgentCapability.SECURITY_REPORTING
  ];

  const adapter: CyberGuardianAdapter = {
    id: 'cyber-guardian-adapter',
    type: AgentType.CYBER_GUARDIAN,
    name: 'Aura Cyber Guardian',
    capabilities,
    status: 'IDLE',
    health: 100,
    lastHeartbeat: new Date(),

    async executeCyberGuardianTask(task: Task, mission: Mission): Promise<unknown> {
      adapter.status = 'BUSY';
      adapter.lastHeartbeat = new Date();

      try {
        let result: unknown;

        switch (task.type) {
          case 'CYBER_RANGE_START':
            result = await controller.startCyberRange();
            break;
          case 'CYBER_RANGE_STOP':
            result = await controller.stopCyberRange(task.metadata?.environmentId as string);
            break;
          case 'SECURITY_STATUS':
            result = controller.getSecurityStatus();
            break;
          case 'RUN_EXPERIMENT':
            result = await controller.runExperiment(task.metadata?.config as ExperimentConfig);
            break;
          case 'EXPERIMENT_REPORT':
            result = controller.getExperimentReport(task.metadata?.reportId as string);
            break;
          case 'KILL_SWITCH':
            controller.activateKillSwitch('aura-core', task.description || 'Manual activation');
            result = { killSwitchActive: true };
            break;
          default:
            result = await adapter.handleNaturalLanguageCommand(task.description || task.title);
        }

        adapter.status = 'IDLE';
        return result;
      } catch (error) {
        adapter.status = 'ERROR';
        adapter.health = 50;
        throw error;
      }
    },

    async handleNaturalLanguageCommand(command: string): Promise<unknown> {
      const lower = command.toLowerCase();

      if (lower.includes('start') && (lower.includes('cyber range') || lower.includes('range'))) {
        return controller.startCyberRange();
      }

      if (lower.includes('security status') || lower.includes('check my security')) {
        return controller.getSecurityStatus();
      }

      if (lower.includes('run') && lower.includes('experiment')) {
        const config: ExperimentConfig = {
          id: `exp-${Date.now()}`,
          name: 'SSH Brute Force Detection Test',
          description: 'MVP detection experiment for SSH brute force',
          environmentProfileId: 'mvp-range',
          targetProfile: 'ubuntu-22.04',
          backgroundActivityProfileId: 'profile-developer',
          adversaryScenarioId: 'scenario-ssh-brute-force',
          detectionRequirements: ['rule-ssh-brute-force'],
          responsePolicyId: 'playbook-contain-ssh-brute-force',
          timeoutSeconds: 300,
          cleanupBehavior: 'DESTROY'
        };
        return controller.runExperiment(config);
      }

      if (lower.includes('incident') || lower.includes('alert')) {
        const status = controller.getSecurityStatus();
        return {
          activeAlerts: status.security.activeAlerts,
          criticalAlerts: status.security.criticalAlerts,
          detectedThreats: status.security.detectedThreats
        };
      }

      if (lower.includes('kill switch') || lower.includes('emergency stop')) {
        controller.activateKillSwitch('user', 'Natural language emergency stop');
        return { killSwitchActive: true, message: 'Kill switch activated — all experiments halted' };
      }

      if (lower.includes('weakness') || lower.includes('not detected')) {
        const reports = controller.listReports();
        const gaps = reports.flatMap(r => r.evaluation.detectionGaps);
        return { detectionGaps: gaps, reportCount: reports.length };
      }

      if (lower.includes('experiment') && lower.includes('report')) {
        const reports = controller.listReports();
        return reports.length > 0 ? reports[reports.length - 1] : { message: 'No experiment reports available' };
      }

      return {
        message: 'Cyber Guardian is ready. Try: "Start the cyber range", "Check my security status", or "Run the latest detection experiment".',
        status: controller.getSecurityStatus()
      };
    }
  };

  return adapter;
}
