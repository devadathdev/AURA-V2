/**
 * skill-runtime/registry/skill-registry.js
 * 
 * Central registry for all Aura skills. Manages discovery, lifecycle state machine,
 * indexing, source isolation (core, claude-code, custom, community), and version tracking.
 */

import fs from 'fs';
import path from 'path';
import { defaultSkillValidator, ValidLifecycleStates } from '../validator/skill-validator.js';

export class SkillRegistry {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.validator = options.validator || defaultSkillValidator;

    this.skills = new Map();
    this.indices = {
      byCategory: new Map(),
      bySource: new Map(),
      byPermission: new Map(),
      byTag: new Map()
    };

    this.skillDirectories = [
      { source: 'core', path: 'skills/core' },
      { source: 'claude-code', path: 'skills/claude-code/adapted' },
      { source: 'custom', path: 'skills/custom' },
      { source: 'community', path: 'skills/community' }
    ];
  }

  /**
   * Scans skill directories and discovers all skill manifests
   */
  async scan() {
    let discoveredCount = 0;

    for (const dirConfig of this.skillDirectories) {
      const fullPath = path.resolve(this.workspaceRoot, dirConfig.path);
      if (!fs.existsSync(fullPath)) continue;

      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillDir = path.join(fullPath, entry.name);
        const manifestFile = path.join(skillDir, 'manifest.json');

        if (fs.existsSync(manifestFile)) {
          try {
            const raw = fs.readFileSync(manifestFile, 'utf-8');
            const manifest = JSON.parse(raw);
            if (!manifest.source) manifest.source = dirConfig.source;
            manifest.skillDir = skillDir;

            this.register(manifest, { skipSave: true, autoValidate: true });
            discoveredCount++;
          } catch (err) {
            console.warn(`[SkillRegistry] Failed loading ${manifestFile}: ${err.message}`);
          }
        }
      }
    }

    return {
      discoveredCount,
      totalRegistered: this.skills.size
    };
  }

  /**
   * Registers a skill in the registry
   */
  register(manifest, options = {}) {
    if (!manifest.id) {
      throw new Error('Cannot register skill without an "id"');
    }

    const initialLifecycle = options.initialLifecycle || manifest.lifecycle || 'VALIDATED';

    const record = {
      id: manifest.id,
      manifest,
      source: manifest.source || 'custom',
      category: manifest.category || 'utility',
      lifecycle: 'DISCOVERED',
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionStats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        lastExecutedAt: null,
        avgExecutionTimeMs: 0
      }
    };

    this.skills.set(manifest.id, record);

    if (options.autoValidate !== false) {
      this.validate(manifest.id);
      if (initialLifecycle === 'ENABLED') {
        this.enable(manifest.id);
      }
    }

    this.index(manifest.id);
    return record;
  }

  /**
   * Validates a skill and transitions lifecycle state
   */
  validate(skillId) {
    const record = this.skills.get(skillId);
    if (!record) throw new Error(`Skill "${skillId}" not found in registry`);

    record.lifecycle = 'VALIDATING';
    const validationResult = this.validator.validateManifest(record.manifest);

    if (!validationResult.valid) {
      record.lifecycle = 'ERROR';
      record.validationErrors = validationResult.errors;
      return { valid: false, errors: validationResult.errors };
    }

    record.lifecycle = 'VALIDATED';
    record.validatedAt = new Date().toISOString();
    record.validationErrors = null;
    return { valid: true, warnings: validationResult.warnings };
  }

  /**
   * Indexes a skill for fast queries
   */
  index(skillId) {
    const record = this.skills.get(skillId);
    if (!record) return;

    const m = record.manifest;

    // Index by Category
    const cat = m.category || 'uncategorized';
    if (!this.indices.byCategory.has(cat)) this.indices.byCategory.set(cat, new Set());
    this.indices.byCategory.get(cat).add(skillId);

    // Index by Source
    const src = record.source || 'unknown';
    if (!this.indices.bySource.has(src)) this.indices.bySource.set(src, new Set());
    this.indices.bySource.get(src).add(skillId);

    // Index by Permission
    if (Array.isArray(m.permissions)) {
      m.permissions.forEach(p => {
        if (!this.indices.byPermission.has(p)) this.indices.byPermission.set(p, new Set());
        this.indices.byPermission.get(p).add(skillId);
      });
    }

    // Index by Tag
    if (Array.isArray(m.tags)) {
      m.tags.forEach(t => {
        const lower = String(t).toLowerCase();
        if (!this.indices.byTag.has(lower)) this.indices.byTag.set(lower, new Set());
        this.indices.byTag.get(lower).add(skillId);
      });
    }
  }

  /**
   * Enables a validated skill
   */
  enable(skillId) {
    const record = this.skills.get(skillId);
    if (!record) throw new Error(`Skill "${skillId}" not found`);
    if (record.lifecycle === 'ERROR') {
      throw new Error(`Cannot enable skill "${skillId}" in ERROR state: ${record.validationErrors?.join('; ')}`);
    }
    record.lifecycle = 'ENABLED';
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Disables an enabled skill
   */
  disable(skillId) {
    const record = this.skills.get(skillId);
    if (!record) throw new Error(`Skill "${skillId}" not found`);
    record.lifecycle = 'DISABLED';
    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * Updates a skill manifest
   */
  update(skillId, partialManifest) {
    const record = this.skills.get(skillId);
    if (!record) throw new Error(`Skill "${skillId}" not found`);

    record.manifest = { ...record.manifest, ...partialManifest, id: skillId };
    record.updatedAt = new Date().toISOString();
    this.validate(skillId);
    this.index(skillId);
    return record;
  }

  /**
   * Removes a skill from the registry and indices
   */
  remove(skillId) {
    const record = this.skills.get(skillId);
    if (!record) return false;

    // Remove from indices
    for (const set of this.indices.byCategory.values()) set.delete(skillId);
    for (const set of this.indices.bySource.values()) set.delete(skillId);
    for (const set of this.indices.byPermission.values()) set.delete(skillId);
    for (const set of this.indices.byTag.values()) set.delete(skillId);

    return this.skills.delete(skillId);
  }

  /**
   * Retrieves a single skill
   */
  get(skillId) {
    return this.skills.get(skillId) || null;
  }

  /**
   * Lists skills with optional filtering
   */
  list(filter = {}) {
    let result = Array.from(this.skills.values());

    if (filter.source) {
      result = result.filter(r => r.source === filter.source);
    }
    if (filter.category) {
      result = result.filter(r => r.manifest.category === filter.category);
    }
    if (filter.lifecycle) {
      result = result.filter(r => r.lifecycle === filter.lifecycle);
    }
    if (filter.permission) {
      result = result.filter(r => r.manifest.permissions?.includes(filter.permission));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.manifest.name.toLowerCase().includes(q) ||
        (r.manifest.description && r.manifest.description.toLowerCase().includes(q))
      );
    }

    return result;
  }

  /**
   * Returns high-level statistics
   */
  getStats() {
    const countsBySource = {};
    const countsByCategory = {};
    const countsByLifecycle = {};

    for (const record of this.skills.values()) {
      countsBySource[record.source] = (countsBySource[record.source] || 0) + 1;
      const cat = record.manifest.category || 'other';
      countsByCategory[cat] = (countsByCategory[cat] || 0) + 1;
      countsByLifecycle[record.lifecycle] = (countsByLifecycle[record.lifecycle] || 0) + 1;
    }

    return {
      total: this.skills.size,
      bySource: countsBySource,
      byCategory: countsByCategory,
      byLifecycle: countsByLifecycle
    };
  }
}

export const defaultSkillRegistry = new SkillRegistry();
