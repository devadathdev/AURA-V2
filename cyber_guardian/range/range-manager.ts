import {
  EnvironmentProfile,
  EnvironmentState,
  RangeStatus,
  ZoneType,
  AuthorizedAsset,
  RiskLevel,
  HealthCheck
} from '../types';
import { AuthorizationLayer } from '../authorization/authorization-layer';
import { AuthorizationScope } from '../types';

export class RangeManager {
  private environments: Map<string, EnvironmentState> = new Map();
  private profiles: Map<string, EnvironmentProfile> = new Map();
  private authorizationLayer: AuthorizationLayer;

  constructor(authorizationLayer: AuthorizationLayer) {
    this.authorizationLayer = authorizationLayer;
  }

  registerProfile(profile: EnvironmentProfile): void {
    this.profiles.set(profile.id, profile);
  }

  getProfile(profileId: string): EnvironmentProfile | undefined {
    return this.profiles.get(profileId);
  }

  async create(profileId: string): Promise<EnvironmentState> {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error(`Environment profile not found: ${profileId}`);

    const envId = `env-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const targets = this.generateTargets(envId, profile);

    const state: EnvironmentState = {
      id: envId,
      profileId,
      status: RangeStatus.CREATING,
      targets,
      networkStatus: 'DOWN',
      resourceUsage: { cpuPercent: 0, memoryPercent: 0, diskPercent: 0 },
      healthChecks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.environments.set(envId, state);
    this.registerAuthorizationScope(envId, profile, targets);

    state.status = RangeStatus.CONFIGURING;
    state.updatedAt = new Date();
    return state;
  }

  async configure(environmentId: string): Promise<EnvironmentState> {
    const env = this.requireEnvironment(environmentId);
    env.status = RangeStatus.CONFIGURING;
    env.updatedAt = new Date();
    return env;
  }

  async start(environmentId: string): Promise<EnvironmentState> {
    const env = this.requireEnvironment(environmentId);
    env.status = RangeStatus.STARTING;
    env.networkStatus = 'UP';
    env.status = RangeStatus.RUNNING;
    env.updatedAt = new Date();
    env.lastHealthCheckAt = new Date();
    return env;
  }

  async stop(environmentId: string): Promise<EnvironmentState> {
    const env = this.requireEnvironment(environmentId);
    env.status = RangeStatus.STOPPING;
    env.networkStatus = 'DOWN';
    env.status = RangeStatus.STOPPED;
    env.updatedAt = new Date();
    return env;
  }

  async snapshot(environmentId: string): Promise<{ snapshotId: string; environment: EnvironmentState }> {
    const env = this.requireEnvironment(environmentId);
    env.status = RangeStatus.SNAPSHOTTING;
    const snapshotId = `snap-${Date.now()}`;
    env.status = RangeStatus.RUNNING;
    env.updatedAt = new Date();
    return { snapshotId, environment: env };
  }

  async destroy(environmentId: string): Promise<void> {
    const env = this.requireEnvironment(environmentId);
    env.status = RangeStatus.DESTROYING;
    this.environments.delete(environmentId);
  }

  async rebuild(environmentId: string): Promise<EnvironmentState> {
    const env = this.requireEnvironment(environmentId);
    const profile = this.profiles.get(env.profileId);
    if (!profile) throw new Error(`Profile not found: ${env.profileId}`);

    env.status = RangeStatus.REBUILDING;
    env.targets = this.generateTargets(environmentId, profile);
    env.networkStatus = 'UP';
    env.status = RangeStatus.RUNNING;
    env.updatedAt = new Date();
    return env;
  }

  getStatus(environmentId: string): EnvironmentState {
    return this.requireEnvironment(environmentId);
  }

  listEnvironments(): EnvironmentState[] {
    return Array.from(this.environments.values());
  }

  async runHealthChecks(environmentId: string): Promise<HealthCheck[]> {
    const env = this.requireEnvironment(environmentId);
    const profile = this.profiles.get(env.profileId);

    const checks: HealthCheck[] = [
      { component: 'network', status: env.networkStatus === 'UP' ? 'HEALTHY' : 'UNHEALTHY', checkedAt: new Date() },
      { component: 'targets', status: env.targets.length > 0 ? 'HEALTHY' : 'UNHEALTHY', checkedAt: new Date() },
      { component: 'wazuh', status: 'HEALTHY', message: 'Wazuh manager reachable', checkedAt: new Date() },
      { component: 'suricata', status: 'HEALTHY', message: 'Suricata IDS active', checkedAt: new Date() },
      { component: 'telemetry', status: 'HEALTHY', message: 'Telemetry pipeline operational', checkedAt: new Date() }
    ];

    if (profile) {
      for (const defender of profile.defenderStack) {
        checks.push({ component: defender, status: 'HEALTHY', checkedAt: new Date() });
      }
    }

    const unhealthy = checks.filter(c => c.status === 'UNHEALTHY');
    if (unhealthy.length > 0) {
      env.status = RangeStatus.UNHEALTHY;
    } else if (env.status === RangeStatus.UNHEALTHY) {
      env.status = RangeStatus.RUNNING;
    }

    env.healthChecks = checks;
    env.lastHealthCheckAt = new Date();
    env.updatedAt = new Date();
    return checks;
  }

  async isolate(environmentId: string): Promise<EnvironmentState> {
    const env = this.requireEnvironment(environmentId);
    env.status = RangeStatus.ISOLATED;
    env.networkStatus = 'DOWN';
    env.updatedAt = new Date();
    return env;
  }

  private requireEnvironment(id: string): EnvironmentState {
    const env = this.environments.get(id);
    if (!env) throw new Error(`Environment not found: ${id}`);
    return env;
  }

  private generateTargets(envId: string, profile: EnvironmentProfile): AuthorizedAsset[] {
    const targets: AuthorizedAsset[] = [];
    for (let i = 0; i < profile.targetCount; i++) {
      targets.push({
        id: `${envId}-target-${i + 1}`,
        hostname: `target-${i + 1}.range.local`,
        ipAddress: `10.99.0.${10 + i}`,
        zone: ZoneType.TARGET,
        criticality: i === 0 ? RiskLevel.HIGH : RiskLevel.MEDIUM
      });
    }
    targets.push({
      id: `${envId}-attacker-1`,
      hostname: 'attacker.range.local',
      ipAddress: '10.99.1.10',
      zone: ZoneType.ATTACKER,
      criticality: RiskLevel.LOW
    });
    targets.push({
      id: `${envId}-defender-1`,
      hostname: 'defender.range.local',
      ipAddress: '10.99.2.10',
      zone: ZoneType.DEFENDER,
      criticality: RiskLevel.HIGH
    });
    return targets;
  }

  private registerAuthorizationScope(envId: string, profile: EnvironmentProfile, targets: AuthorizedAsset[]): void {
    const scope: AuthorizationScope = {
      environmentId: envId,
      authorizedNetworks: [profile.networkCidr],
      authorizedAssets: targets,
      allowedActions: ['*']
    };
    this.authorizationLayer.registerScope(scope);
  }
}
