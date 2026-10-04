/**
 * skill-runtime/validator/skill-validator.js
 * 
 * Validates skill manifests, dependencies, schema compliance,
 * and sandbox parameters before registration and execution.
 */

import fs from 'fs';
import path from 'path';
import { PermissionLevel } from '../../permissions/policies/permission-policy.js';

export const ValidLifecycleStates = Object.freeze([
  'DISCOVERED',
  'VALIDATING',
  'VALIDATED',
  'ENABLED',
  'DISABLED',
  'EXECUTING',
  'COMPLETED',
  'FAILED',
  'ERROR'
]);

export const ValidSkillSources = Object.freeze([
  'claude-code',
  'core',
  'custom',
  'community'
]);

export class SkillValidator {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.allowedTools = new Set(['filesystem', 'terminal', 'git', 'github', 'web']);
  }

  /**
   * Validates a skill manifest object against the Aura Skill Specification
   */
  validateManifest(manifest) {
    const errors = [];
    const warnings = [];

    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, errors: ['Manifest must be a non-null object'], warnings: [] };
    }

    // 1. Mandatory Identifier
    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('Manifest missing required field "id" (string)');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id)) {
      errors.push(`Manifest id "${manifest.id}" contains invalid characters (must match /^[a-zA-Z0-9_-]+$/)`);
    }

    // 2. Name & Description
    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Manifest missing required field "name" (string)');
    }
    if (!manifest.description || typeof manifest.description !== 'string') {
      warnings.push('Manifest missing or empty "description"');
    }

    // 3. Source & Category
    if (!manifest.source || !ValidSkillSources.includes(manifest.source)) {
      errors.push(`Invalid source "${manifest.source}". Allowed: ${ValidSkillSources.join(', ')}`);
    }

    if (!manifest.category || typeof manifest.category !== 'string') {
      warnings.push('Manifest missing category; default will be assigned');
    }

    // 4. Permissions Check
    if (!Array.isArray(manifest.permissions)) {
      errors.push('Manifest "permissions" must be an array');
    } else {
      for (const perm of manifest.permissions) {
        if (!PermissionLevel[perm]) {
          errors.push(`Invalid permission declared: "${perm}". Valid levels: ${Object.keys(PermissionLevel).join(', ')}`);
        }
      }
    }

    // 5. Tools Check
    if (!Array.isArray(manifest.tools)) {
      errors.push('Manifest "tools" must be an array');
    } else {
      for (const tool of manifest.tools) {
        if (!this.allowedTools.has(tool)) {
          warnings.push(`Tool "${tool}" is not in standard tool registry`);
        }
      }
    }

    // 6. Sandbox Check
    if (manifest.sandbox && typeof manifest.sandbox === 'object') {
      if (manifest.sandbox.timeoutMs && (typeof manifest.sandbox.timeoutMs !== 'number' || manifest.sandbox.timeoutMs <= 0)) {
        errors.push('sandbox.timeoutMs must be a positive number');
      }
      if (manifest.sandbox.allowedPaths && !Array.isArray(manifest.sandbox.allowedPaths)) {
        errors.push('sandbox.allowedPaths must be an array of paths');
      }
    }

    // 7. Lifecycle State Check (if present)
    if (manifest.lifecycle && !ValidLifecycleStates.includes(manifest.lifecycle)) {
      errors.push(`Invalid lifecycle state: "${manifest.lifecycle}"`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates skill files and dependencies on disk
   */
  validateDependencies(manifest, skillDir) {
    const errors = [];
    const warnings = [];

    // Check entrypoint or originalSkillPath
    if (manifest.entrypoint) {
      const entryPath = path.isAbsolute(manifest.entrypoint)
        ? manifest.entrypoint
        : path.join(skillDir, manifest.entrypoint);

      if (!fs.existsSync(entryPath)) {
        // If not in skillDir, check if originalSkillPath exists
        if (manifest.originalSkillPath) {
          const origPath = path.resolve(this.workspaceRoot, manifest.originalSkillPath);
          if (!fs.existsSync(origPath)) {
            errors.push(`Skill entrypoint not found at ${entryPath} or ${origPath}`);
          }
        } else {
          errors.push(`Skill entrypoint not found at: ${entryPath}`);
        }
      }
    }

    // Check tools availability
    if (manifest.tools?.includes('git')) {
      // Git is checked dynamically in tool
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const defaultSkillValidator = new SkillValidator();
