/**
 * skill-runtime/loader/aura-skill-adapter.js
 * 
 * Aura Skill Adapter
 * Transforms upstream Claude Code skill definitions (SKILL.md + frontmatter)
 * into standardized Aura Skill Specifications with permissions, tool mappings,
 * and sandbox requirements.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { PermissionLevel, RiskTier, PermissionRiskMap } from '../../permissions/policies/permission-policy.js';

export class AuraSkillAdapter {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.importedDir = path.resolve(this.workspaceRoot, options.importedDir || 'skills/claude-code/imported');
    this.adaptedDir = path.resolve(this.workspaceRoot, options.adaptedDir || 'skills/claude-code/adapted');
    this.masterManifestPath = path.resolve(this.workspaceRoot, options.masterManifestPath || 'skills/claude-code/manifest.json');
  }

  /**
   * Simple YAML frontmatter parser for node environments without external dependencies
   */
  parseFrontmatter(content) {
    const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
      return { frontmatter: {}, body: content.trim() };
    }

    const rawYaml = match[1];
    const body = content.slice(match[0].length).trim();
    const frontmatter = {};

    const lines = rawYaml.split('\n');
    let currentKey = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;

      // Handle key-value
      const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kvMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
        currentKey = kvMatch[1];
        let val = kvMatch[2].trim();

        if (val === '') {
          // Could be multiline or list or object
          frontmatter[currentKey] = '';
        } else if (val === 'true') {
          frontmatter[currentKey] = true;
        } else if (val === 'false') {
          frontmatter[currentKey] = false;
        } else if (!isNaN(Number(val)) && val !== '') {
          frontmatter[currentKey] = Number(val);
        } else {
          // Remove surrounding quotes if any
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          frontmatter[currentKey] = val;
        }
      } else if (currentKey && (line.startsWith(' ') || line.startsWith('\t'))) {
        // Continuation of current key or nested field
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
          if (!Array.isArray(frontmatter[currentKey])) {
            frontmatter[currentKey] = [];
          }
          let item = trimmed.slice(2).trim();
          if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
            item = item.slice(1, -1);
          }
          frontmatter[currentKey].push(item);
        } else if (typeof frontmatter[currentKey] === 'string') {
          frontmatter[currentKey] += (frontmatter[currentKey] ? ' ' : '') + trimmed;
        }
      }
    }

    return { frontmatter, body };
  }

  /**
   * Infers categorization based on skill content and name
   */
  inferCategory(skillId, frontmatter, body) {
    const text = `${skillId} ${frontmatter.name || ''} ${frontmatter.description || ''} ${body.slice(0, 500)}`.toLowerCase();

    if (text.includes('security') || text.includes('vulnerability') || text.includes('audit') || 
        text.includes('cve') || text.includes('auth') || text.includes('pentest') || 
        text.includes('compliance') || text.includes('firewall') || text.includes('pci') || text.includes('soc2')) {
      return 'security';
    }
    if (text.includes('llm') || text.includes('agent') || text.includes('prompt') || 
        text.includes('inference') || text.includes('rag') || text.includes('eval') || 
        text.includes('fine-tuning') || text.includes('model') || text.includes('openai') || text.includes('claude')) {
      return 'ai';
    }
    if (text.includes('kubernetes') || text.includes('docker') || text.includes('aws') || 
        text.includes('gcp') || text.includes('azure') || text.includes('terraform') || 
        text.includes('infra') || text.includes('linux') || text.includes('nginx') || text.includes('sre')) {
      return 'infrastructure';
    }
    if (text.includes('test') || text.includes('tdd') || text.includes('coverage') || 
        text.includes('benchmark') || text.includes('quality') || text.includes('lint')) {
      return 'quality';
    }
    if (text.includes('postgres') || text.includes('mysql') || text.includes('database') || 
        text.includes('sql') || text.includes('redis') || text.includes('clickhouse') || text.includes('storage')) {
      return 'database';
    }
    if (text.includes('react') || text.includes('vue') || text.includes('angular') || 
        text.includes('api') || text.includes('backend') || text.includes('frontend') || 
        text.includes('python') || text.includes('rust') || text.includes('golang') || text.includes('node')) {
      return 'development';
    }
    if (text.includes('jira') || text.includes('workflow') || text.includes('docs') || 
        text.includes('email') || text.includes('guide') || text.includes('management')) {
      return 'productivity';
    }
    return 'utility';
  }

  /**
   * Infers necessary permissions based on skill requirements
   */
  inferPermissions(frontmatter, body) {
    const text = `${frontmatter.name || ''} ${frontmatter.description || ''} ${body.slice(0, 1000)}`.toLowerCase();
    const permissions = new Set([PermissionLevel.READ]); // All skills can read context

    if (text.includes('write') || text.includes('create') || text.includes('generate') || 
        text.includes('scaffold') || text.includes('edit') || text.includes('patch')) {
      permissions.add(PermissionLevel.WRITE);
    }
    if (text.includes('execute') || text.includes('run') || text.includes('command') || 
        text.includes('bash') || text.includes('cli') || text.includes('terminal') || text.includes('script')) {
      permissions.add(PermissionLevel.EXECUTE);
    }
    if (text.includes('web') || text.includes('http') || text.includes('api') || 
        text.includes('fetch') || text.includes('download') || text.includes('curl') || text.includes('crawl')) {
      permissions.add(PermissionLevel.NETWORK);
    }
    if (text.includes('git') || text.includes('github') || text.includes('pr') || 
        text.includes('pull request') || text.includes('commit') || text.includes('repo')) {
      permissions.add(PermissionLevel.GITHUB);
    }
    if (text.includes('deploy') || text.includes('k8s') || text.includes('cluster') || 
        text.includes('helm') || text.includes('cloudformation') || text.includes('terraform apply')) {
      permissions.add(PermissionLevel.DEPLOY);
    }
    if (text.includes('database') || text.includes('query') || text.includes('migration') || 
        text.includes('sql') || text.includes('postgres') || text.includes('mysql')) {
      permissions.add(PermissionLevel.DATABASE);
    }
    if (text.includes('system') || text.includes('root') || text.includes('kernel') || 
        text.includes('systemd') || text.includes('daemon') || text.includes('admin')) {
      permissions.add(PermissionLevel.SYSTEM);
    }
    if (text.includes('secret') || text.includes('token') || text.includes('key') || 
        text.includes('credential') || text.includes('password')) {
      permissions.add(PermissionLevel.SECRET);
    }

    return Array.from(permissions);
  }

  /**
   * Infers required tools based on permissions and text
   */
  inferTools(permissions, body) {
    const tools = new Set(['filesystem']);
    if (permissions.includes(PermissionLevel.EXECUTE) || permissions.includes(PermissionLevel.SYSTEM)) {
      tools.add('terminal');
    }
    if (permissions.includes(PermissionLevel.GITHUB) || body.includes('git ') || body.includes('git_')) {
      tools.add('git');
      if (body.includes('gh ') || body.includes('issue') || body.includes('pull request')) {
        tools.add('github');
      }
    }
    if (permissions.includes(PermissionLevel.NETWORK) || permissions.includes(PermissionLevel.DEPLOY)) {
      tools.add('web');
    }
    return Array.from(tools);
  }

  /**
   * Extracts tags from skill content
   */
  extractTags(skillId, frontmatter, body) {
    const tags = new Set();
    // Split id by dashes
    skillId.split('-').forEach(p => {
      if (p.length > 2) tags.add(p);
    });

    if (Array.isArray(frontmatter.tags)) {
      frontmatter.tags.forEach(t => tags.add(String(t).toLowerCase()));
    }

    // Common technical tokens
    const commonTokens = ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'python', 'node', 'react', 'vue', 'security', 'ai', 'testing', 'database', 'git'];
    const lowerBody = body.toLowerCase();
    commonTokens.forEach(token => {
      if (lowerBody.includes(token)) tags.add(token);
    });

    return Array.from(tags).slice(0, 8);
  }

  /**
   * Adapts a single skill directory
   */
  adaptSkill(skillId) {
    const skillPath = path.join(this.importedDir, skillId);
    const skillMdFile = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillMdFile)) {
      throw new Error(`SKILL.md not found in ${skillPath}`);
    }

    const rawContent = fs.readFileSync(skillMdFile, 'utf-8');
    const { frontmatter, body } = this.parseFrontmatter(rawContent);

    const name = frontmatter.name || skillId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const description = frontmatter.description || body.split('\n\n')[0].replace(/^#.*\n/, '').trim();
    const category = this.inferCategory(skillId, frontmatter, body);
    const permissions = this.inferPermissions(frontmatter, body);
    const tools = this.inferTools(permissions, body);
    const tags = this.extractTags(skillId, frontmatter, body);

    const relativeOriginalPath = `skills/claude-code/imported/${skillId}/SKILL.md`;

    // Aura Skill Specification Manifest
    const manifest = {
      schemaVersion: '1.0.0',
      id: skillId,
      name,
      version: frontmatter.version ? String(frontmatter.version) : '1.0.0',
      description,
      source: 'claude-code',
      category,
      tags,
      lifecycle: 'ENABLED',
      entrypoint: 'SKILL.md',
      originalSkillPath: relativeOriginalPath,
      permissions,
      tools,
      sandbox: {
        allowedPaths: ['.'],
        timeoutMs: 30000,
        allowNetwork: permissions.includes(PermissionLevel.NETWORK) || permissions.includes(PermissionLevel.GITHUB),
        maxMemoryMb: 512
      },
      inputs: {
        instruction: {
          type: 'string',
          required: false,
          description: 'Contextual prompt or instruction for executing this skill'
        },
        params: {
          type: 'object',
          required: false,
          description: 'Optional execution parameters'
        }
      },
      outputs: {
        success: { type: 'boolean' },
        result: { type: 'string' },
        artifacts: { type: 'array' }
      },
      adaptedAt: new Date().toISOString()
    };

    // Write to adapted destination: skills/claude-code/adapted/<skillId>/manifest.json
    const destDir = path.join(this.adaptedDir, skillId);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    return manifest;
  }

  /**
   * Adapts all skills from imported directory and creates master manifest
   */
  adaptAll() {
    if (!fs.existsSync(this.importedDir)) {
      throw new Error(`Imported directory not found: ${this.importedDir}`);
    }

    const entries = fs.readdirSync(this.importedDir, { withFileTypes: true });
    const manifests = [];
    const summary = {
      total: 0,
      categories: {},
      permissions: {},
      adaptedSkills: []
    };

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillId = entry.name;
      try {
        const manifest = this.adaptSkill(skillId);
        manifests.push(manifest);

        summary.total++;
        summary.categories[manifest.category] = (summary.categories[manifest.category] || 0) + 1;
        manifest.permissions.forEach(p => {
          summary.permissions[p] = (summary.permissions[p] || 0) + 1;
        });
        summary.adaptedSkills.push({
          id: manifest.id,
          name: manifest.name,
          category: manifest.category,
          permissions: manifest.permissions,
          tools: manifest.tools
        });
      } catch (err) {
        console.warn(`[AuraSkillAdapter] Skipping skill ${skillId}: ${err.message}`);
      }
    }

    // Write master manifest at skills/claude-code/manifest.json
    const masterManifest = {
      version: '1.0.0',
      source: 'https://github.com/affaan-m/ECC',
      generatedAt: new Date().toISOString(),
      skillCount: manifests.length,
      categories: summary.categories,
      permissionDistribution: summary.permissions,
      skills: manifests
    };

    const masterDir = path.dirname(this.masterManifestPath);
    if (!fs.existsSync(masterDir)) {
      fs.mkdirSync(masterDir, { recursive: true });
    }
    fs.writeFileSync(this.masterManifestPath, JSON.stringify(masterManifest, null, 2), 'utf-8');

    return masterManifest;
  }
}

export const defaultSkillAdapter = new AuraSkillAdapter();
