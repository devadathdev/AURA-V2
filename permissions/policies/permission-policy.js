/**
 * permissions/policies/permission-policy.js
 * 
 * Defines granular permission levels, risk tiers, and validation policies
 * for the Aura Assistant Skills Engine.
 */

export const PermissionLevel = Object.freeze({
  READ: 'READ',
  WRITE: 'WRITE',
  EXECUTE: 'EXECUTE',
  NETWORK: 'NETWORK',
  GITHUB: 'GITHUB',
  DEPLOY: 'DEPLOY',
  DATABASE: 'DATABASE',
  SYSTEM: 'SYSTEM',
  SECRET: 'SECRET'
});

export const RiskTier = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
});

// Mapping permission levels to default risk classification
export const PermissionRiskMap = {
  [PermissionLevel.READ]: RiskTier.LOW,
  [PermissionLevel.NETWORK]: RiskTier.MEDIUM,
  [PermissionLevel.WRITE]: RiskTier.MEDIUM,
  [PermissionLevel.EXECUTE]: RiskTier.HIGH,
  [PermissionLevel.GITHUB]: RiskTier.HIGH,
  [PermissionLevel.DATABASE]: RiskTier.HIGH,
  [PermissionLevel.DEPLOY]: RiskTier.CRITICAL,
  [PermissionLevel.SYSTEM]: RiskTier.CRITICAL,
  [PermissionLevel.SECRET]: RiskTier.CRITICAL
};

// Explicit High-Risk Operations requiring mandatory human approval
export const HighRiskOperationPatterns = [
  { pattern: /delete|remove|unlink|rm\s+-rf|drop\s+table|drop\s+database/i, risk: RiskTier.CRITICAL, type: 'DESTRUCTIVE_DELETE', reason: 'Destructive deletion of files or data structures' },
  { pattern: /push\s+--force|git\s+push|publish|release/i, risk: RiskTier.HIGH, type: 'CODE_PUBLISH', reason: 'Publishing or pushing code changes upstream' },
  { pattern: /deploy|kubectl|terraform\s+apply|docker\s+run|helm\s+upgrade/i, risk: RiskTier.CRITICAL, type: 'PRODUCTION_DEPLOY', reason: 'Modifying deployment infrastructure or container runtime' },
  { pattern: /export\s+[A-Z_]+=|setenv|process\.env\./i, risk: RiskTier.HIGH, type: 'ENV_MUTATION', reason: 'Modifying environment configuration or runtime secrets' },
  { pattern: /api[_-]?key|secret|password|token|private[_-]?key|credentials/i, risk: RiskTier.CRITICAL, type: 'SECRET_ACCESS', reason: 'Accessing or manipulating authentication tokens or private keys' },
  { pattern: /chmod|chown|sudo|systemctl|kill|reboot/i, risk: RiskTier.CRITICAL, type: 'SYSTEM_MODIFICATION', reason: 'Modifying system-level privileges or daemon state' }
];

export class PermissionPolicy {
  constructor(customRules = {}) {
    this.trustedSources = new Set(['core', 'system', ...(customRules.trustedSources || [])]);
    this.autoApprovedPermissions = new Set([PermissionLevel.READ, ...(customRules.autoApproved || [])]);
    this.restrictedPaths = [
      '/etc', '/var/run', '/root/.ssh', '/root/.aws', '/root/.gnupg',
      ...(customRules.restrictedPaths || [])
    ];
  }

  /**
   * Evaluates if a permission set requires user approval
   */
  evaluateRisk(permissions = [], operationContext = {}) {
    const activeRisk = {
      level: RiskTier.LOW,
      requiresApproval: false,
      reasons: [],
      matchedOperations: []
    };

    // 1. Check permission level tiers
    for (const perm of permissions) {
      const tier = PermissionRiskMap[perm] || RiskTier.MEDIUM;
      if (this._compareRisk(tier, activeRisk.level) > 0) {
        activeRisk.level = tier;
      }
      if (tier === RiskTier.HIGH || tier === RiskTier.CRITICAL) {
        activeRisk.requiresApproval = true;
        activeRisk.reasons.push(`Declares high-risk permission: ${perm}`);
      }
    }

    // 2. Check operation payload for high-risk patterns
    const commandText = operationContext.command || operationContext.action || operationContext.input || '';
    if (commandText) {
      for (const rule of HighRiskOperationPatterns) {
        if (rule.pattern.test(commandText)) {
          activeRisk.requiresApproval = true;
          activeRisk.level = RiskTier.CRITICAL;
          activeRisk.reasons.push(`${rule.reason} (${rule.type})`);
          activeRisk.matchedOperations.push(rule.type);
        }
      }
    }

    // 3. Path confinement audit
    const targetPath = operationContext.path || '';
    if (targetPath) {
      for (const restricted of this.restrictedPaths) {
        if (targetPath.startsWith(restricted)) {
          activeRisk.requiresApproval = true;
          activeRisk.level = RiskTier.CRITICAL;
          activeRisk.reasons.push(`Attempted access to restricted path: ${restricted}`);
        }
      }
    }

    return activeRisk;
  }

  /**
   * Helper to rank risk tiers
   */
  _compareRisk(a, b) {
    const ranks = { [RiskTier.LOW]: 1, [RiskTier.MEDIUM]: 2, [RiskTier.HIGH]: 3, [RiskTier.CRITICAL]: 4 };
    return (ranks[a] || 0) - (ranks[b] || 0);
  }

  /**
   * Normalizes arbitrary permission strings to typed levels
   */
  normalizePermission(raw) {
    if (!raw) return PermissionLevel.READ;
    const upper = String(raw).toUpperCase().trim();
    if (PermissionLevel[upper]) return PermissionLevel[upper];
    
    // Fuzzy matching
    if (upper.includes('READ') || upper.includes('GET') || upper.includes('VIEW')) return PermissionLevel.READ;
    if (upper.includes('WRITE') || upper.includes('EDIT') || upper.includes('CREATE')) return PermissionLevel.WRITE;
    if (upper.includes('EXEC') || upper.includes('BASH') || upper.includes('SHELL') || upper.includes('RUN')) return PermissionLevel.EXECUTE;
    if (upper.includes('NET') || upper.includes('HTTP') || upper.includes('WEB') || upper.includes('FETCH')) return PermissionLevel.NETWORK;
    if (upper.includes('GIT') || upper.includes('PR') || upper.includes('ISSUE')) return PermissionLevel.GITHUB;
    if (upper.includes('DEPLOY') || upper.includes('K8S') || upper.includes('DOCKER')) return PermissionLevel.DEPLOY;
    if (upper.includes('DB') || upper.includes('SQL') || upper.includes('DATA')) return PermissionLevel.DATABASE;
    if (upper.includes('SYS') || upper.includes('ADMIN') || upper.includes('ROOT')) return PermissionLevel.SYSTEM;
    if (upper.includes('SECRET') || upper.includes('KEY') || upper.includes('TOKEN')) return PermissionLevel.SECRET;
    
    return PermissionLevel.READ;
  }
}

export const defaultPermissionPolicy = new PermissionPolicy();
