import {
  AuthorizationScope,
  AuditEvent,
  ResponseActionType,
  ZoneType,
  RiskLevel
} from '../types';

export interface AuthorizationRequest {
  action: string;
  target: string;
  targetIp?: string;
  targetZone?: ZoneType;
  environmentId: string;
  experimentId?: string;
  actor: string;
  riskLevel?: RiskLevel;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason: string;
  policyId?: string;
}

export class AuthorizationLayer {
  private scopes: Map<string, AuthorizationScope> = new Map();
  private auditLog: AuditEvent[] = [];
  private killSwitchActive = false;

  registerScope(scope: AuthorizationScope): void {
    this.scopes.set(scope.environmentId, scope);
  }

  getScope(environmentId: string): AuthorizationScope | undefined {
    return this.scopes.get(environmentId);
  }

  activateKillSwitch(actor: string, reason: string): void {
    this.killSwitchActive = true;
    this.recordAudit({
      actor,
      eventType: 'KILL_SWITCH_ACTIVATED',
      action: 'KILL_SWITCH',
      result: 'SUCCESS',
      reason,
      payload: { killSwitchActive: true }
    });
  }

  deactivateKillSwitch(actor: string): void {
    this.killSwitchActive = false;
    this.recordAudit({
      actor,
      eventType: 'KILL_SWITCH_DEACTIVATED',
      action: 'KILL_SWITCH',
      result: 'SUCCESS',
      payload: { killSwitchActive: false }
    });
  }

  isKillSwitchActive(): boolean {
    return this.killSwitchActive;
  }

  authorize(request: AuthorizationRequest): AuthorizationResult {
    if (this.killSwitchActive) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: 'Kill switch is active — all autonomous actions are blocked'
      };
      this.recordRejection(request, result.reason);
      return result;
    }

    const scope = this.scopes.get(request.environmentId);
    if (!scope) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: `No authorization scope registered for environment ${request.environmentId}`
      };
      this.recordRejection(request, result.reason);
      return result;
    }

    if (scope.expiresAt && scope.expiresAt < new Date()) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: 'Authorization scope has expired'
      };
      this.recordRejection(request, result.reason);
      return result;
    }

    if (!this.isTargetAuthorized(request, scope)) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: `Target "${request.target}" is not within authorized scope for environment ${request.environmentId}`
      };
      this.recordRejection(request, result.reason);
      return result;
    }

    if (!scope.allowedActions.includes(request.action) && !scope.allowedActions.includes('*')) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: `Action "${request.action}" is not in the allowed actions list`
      };
      this.recordRejection(request, result.reason);
      return result;
    }

    if (request.riskLevel === RiskLevel.CRITICAL && !this.isDefensiveAction(request.action)) {
      const result: AuthorizationResult = {
        authorized: false,
        reason: 'Critical-risk offensive actions require explicit human approval'
      };
      this.recordRejection(request, result.reason);
      return result;
    }

    this.recordAudit({
      actor: request.actor,
      eventType: 'AUTHORIZATION_GRANTED',
      environmentId: request.environmentId,
      experimentId: request.experimentId,
      action: request.action,
      target: request.target,
      result: 'SUCCESS',
      payload: { riskLevel: request.riskLevel }
    });

    return { authorized: true, reason: 'Authorized', policyId: scope.environmentId };
  }

  private isTargetAuthorized(request: AuthorizationRequest, scope: AuthorizationScope): boolean {
    const assetMatch = scope.authorizedAssets.find(
      a => a.hostname === request.target || a.id === request.target || a.ipAddress === request.targetIp
    );
    if (assetMatch) return true;

    if (request.targetIp) {
      return scope.authorizedNetworks.some(cidr => this.ipInCidr(request.targetIp!, cidr));
    }

    return false;
  }

  private ipInCidr(ip: string, cidr: string): boolean {
    const [network, bits] = cidr.split('/');
    if (!bits) return ip === network;
    const ipParts = ip.split('.').map(Number);
    const netParts = network.split('.').map(Number);
    const mask = parseInt(bits, 10);
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const netNum = (netParts[0] << 24) | (netParts[1] << 16) | (netParts[2] << 8) | netParts[3];
    const maskNum = ~((1 << (32 - mask)) - 1);
    return (ipNum & maskNum) === (netNum & maskNum);
  }

  private isDefensiveAction(action: string): boolean {
    return Object.values(ResponseActionType).includes(action as ResponseActionType);
  }

  private recordRejection(request: AuthorizationRequest, reason: string): void {
    this.recordAudit({
      actor: request.actor,
      eventType: 'AUTHORIZATION_REJECTED',
      environmentId: request.environmentId,
      experimentId: request.experimentId,
      action: request.action,
      target: request.target,
      result: 'REJECTED',
      reason,
      payload: {}
    });
  }

  private recordAudit(partial: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.auditLog.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      ...partial
    });
  }

  getAuditLog(environmentId?: string): AuditEvent[] {
    if (!environmentId) return [...this.auditLog];
    return this.auditLog.filter(e => e.environmentId === environmentId);
  }
}
