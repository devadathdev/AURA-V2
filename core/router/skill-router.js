/**
 * core/router/skill-router.js
 * 
 * Intelligent Skill Router for Aura Assistant.
 * Routes user queries to optimal skills by evaluating semantic intent,
 * keywords, tags, required tools, and permission risk profiles.
 */

import { defaultSkillRegistry } from '../../skill-runtime/registry/skill-registry.js';
import { defaultPermissionPolicy, RiskTier } from '../../permissions/policies/permission-policy.js';

export class SkillRouter {
  constructor(options = {}) {
    this.registry = options.registry || defaultSkillRegistry;
    this.policy = options.policy || defaultPermissionPolicy;
  }

  /**
   * Tokenizes and normalizes text for matching
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const rawTokens = text.toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    const expanded = new Set(rawTokens);
    for (const t of rawTokens) {
      if (t === 'analyze' || t === 'analyzing' || t === 'analyzed') {
        expanded.add('analysis');
      } else if (t === 'analysis') {
        expanded.add('analyze');
      } else if (t === 'codebase') {
        expanded.add('code');
      } else if (t.endsWith('ing') && t.length > 5) {
        expanded.add(t.slice(0, -3));
      } else if (t.endsWith('s') && t.length > 3) {
        expanded.add(t.slice(0, -1));
      }
    }
    return Array.from(expanded);
  }

  /**
   * Routes a user prompt/intent to the best matching skills
   */
  route(query, options = {}) {
    if (!query || typeof query !== 'string') {
      return { matches: [], selected: null, query: '' };
    }

    const queryTokens = new Set(this.tokenize(query));
    const allSkills = this.registry.list();
    const scoredSkills = [];

    const lowerQuery = query.toLowerCase();

    for (const record of allSkills) {
      if (record.lifecycle === 'DISABLED') continue;

      const m = record.manifest;
      let score = 0;
      const reasons = [];

      // 1. Direct ID or Name Match
      if (m.id === lowerQuery || m.name?.toLowerCase() === lowerQuery) {
        score += 100;
        reasons.push('Exact skill ID or name match');
      } else if (lowerQuery.includes(m.id)) {
        score += 60;
        reasons.push(`Query explicitly mentions skill "${m.id}"`);
      }

      // 2. ID tokens match
      const idParts = m.id.split('-');
      let idMatchCount = 0;
      for (const part of idParts) {
        if (queryTokens.has(part)) {
          score += 15;
          idMatchCount++;
        }
      }
      if (idMatchCount > 0) {
        reasons.push(`Matched ${idMatchCount} keyword(s) from skill identifier`);
      }

      // 3. Tags match
      if (Array.isArray(m.tags)) {
        let tagMatches = 0;
        for (const tag of m.tags) {
          if (queryTokens.has(tag.toLowerCase())) {
            score += 10;
            tagMatches++;
          }
        }
        if (tagMatches > 0) {
          reasons.push(`Matched ${tagMatches} tag(s)`);
        }
      }

      // 4. Description tokens overlap
      if (m.description) {
        const descTokens = this.tokenize(m.description);
        let overlap = 0;
        for (const token of descTokens) {
          if (queryTokens.has(token)) {
            overlap++;
          }
        }
        if (overlap > 0) {
          // Normalize score by log of overlap
          const descScore = Math.min(25, overlap * 3);
          score += descScore;
          reasons.push(`Description relevance match (${overlap} common terms)`);
        }
      }

      // 5. Category Boost if user mentions category
      if (m.category && queryTokens.has(m.category.toLowerCase())) {
        score += 12;
        reasons.push(`Matches specified category: ${m.category}`);
      }

      // 6. Source preference (Aura-core skills slightly favored when tied for reliability)
      if (record.source === 'core' && score > 15) {
        score += 5;
        reasons.push('Native Aura-core stability preference');
      }

      // 7. Filter by max allowed risk tier if requested
      const risk = this.policy.evaluateRisk(m.permissions || []);
      if (options.maxRisk && this.policy._compareRisk(risk.level, options.maxRisk) > 0) {
        continue; // Skip skills above acceptable risk threshold
      }

      if (score > 10) {
        const confidence = Math.min(0.99, Math.round((score / 120) * 100) / 100);
        scoredSkills.push({
          skillId: m.id,
          name: m.name,
          source: record.source,
          category: m.category,
          score,
          confidence,
          reasons,
          permissions: m.permissions || [],
          riskLevel: risk.level,
          requiresApproval: risk.requiresApproval,
          tools: m.tools || []
        });
      }
    }

    // Sort descending by score
    scoredSkills.sort((a, b) => b.score - a.score);

    const limit = options.limit || 5;
    const matches = scoredSkills.slice(0, limit);
    const selected = matches.length > 0 ? matches[0] : null;

    return {
      query,
      selected,
      matches,
      totalConsidered: allSkills.length
    };
  }
}

export const defaultSkillRouter = new SkillRouter();
