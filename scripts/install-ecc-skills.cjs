#!/usr/bin/env node
/**
 * install-ecc-skills.js
 * 
 * Integrates all ECC (Everything Claude Code) skills into Aura Assistant.
 * Parses SKILL.md frontmatters, generates SkillManifest entries, and updates skills-data.json.
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const SKILLS_DATA_FILE = path.join(__dirname, '..', 'skills-data.json');

function titleCase(slug) {
  const acronyms = new Set(['ai', 'ui', 'db', 'io', 'vm', 'ip', 'os', 'qa', 'cd', 'ci', 'sre', 'pr', 'api', 'llm', 'rag', 'mcp', 'wcag', 'aria', 'rest', 'sdk', 'cli', 'jwt', 'css', 'html', 'js', 'ts', 'sql', 'php', 'aws', 'gcp', 'k8s', 'ssh', 'vpn', 'vlan', 'dns', 'emr', 'cdss', 'phi', 'hipaa', 'gerber', 'pcb', 'fea', 'cfd']);
  return slug
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) {
        return lower.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function classifyCategory(id, name, desc, tags) {
  const text = `${id} ${name} ${desc} ${(tags || []).join(' ')}`.toLowerCase();
  
  if (text.includes('security') || text.includes('vulnerability') || text.includes('vuln') || 
      text.includes('audit') || text.includes('compliance') || text.includes('phi') ||
      text.includes('hipaa') || text.includes('auth') || text.includes('sentinel') ||
      text.includes('guardrail') || text.includes('hardening') || text.includes('bounty') ||
      text.includes('red-team') || text.includes('defense') || text.includes('safety') ||
      text.includes('leak') || text.includes('penetration') || text.includes('zero-trust')) {
    return 'security';
  }
  
  if (text.includes('llm') || text.includes('agent') || text.includes('model') ||
      text.includes('prompt') || text.includes('autonomous') || text.includes('rag') ||
      text.includes('eval') || text.includes('harness') || text.includes('fine-tuning') ||
      text.includes('inference') || text.includes('embedding') || text.includes('ai-') ||
      text.includes('machine learning') || text.includes('deep-research')) {
    return 'ai';
  }

  if (text.includes('analytics') || text.includes('metric') || text.includes('benchmark') ||
      text.includes('telemetry') || text.includes('observability') || text.includes('tracing') ||
      text.includes('analysis') || text.includes('statistics') || text.includes('inspector') ||
      text.includes('research') || text.includes('scraper')) {
    return 'analysis';
  }

  if (text.includes('automation') || text.includes('workflow') || text.includes('pipeline') ||
      text.includes('ci/cd') || text.includes('deploy') || text.includes('ops') ||
      text.includes('scheduler') || text.includes('email') || text.includes('task') ||
      text.includes('jira') || text.includes('orchestrat') || text.includes('management') ||
      text.includes('loop')) {
    return 'productivity';
  }

  if (text.includes('tool') || text.includes('search') || text.includes('format') ||
      text.includes('config') || text.includes('terminal') || text.includes('convert') ||
      text.includes('git') || text.includes('cache') || text.includes('util')) {
    return 'utility';
  }

  return 'development';
}

function extractPermissions(toolsStr, text) {
  const permissions = [];
  const toolsLower = (toolsStr || '').toLowerCase();
  const allText = (text + ' ' + toolsLower).toLowerCase();

  // Filesystem permission
  permissions.push({
    type: 'filesystem',
    scope: ['read', 'write'],
    description: 'Access and inspect project files and resources'
  });

  // Shell permission
  if (toolsLower.includes('bash') || toolsLower.includes('shell') || toolsLower.includes('terminal') || 
      allText.includes('terminal') || allText.includes('cli') || allText.includes('command')) {
    permissions.push({
      type: 'shell',
      scope: ['execute'],
      description: 'Execute build, test, and system operations'
    });
  }

  // Model permission
  permissions.push({
    type: 'model',
    scope: ['analysis', 'generation'],
    description: 'AI model reasoning and structured code synthesis'
  });

  // Network permission
  if (allText.includes('api') || allText.includes('http') || allText.includes('network') || 
      allText.includes('fetch') || allText.includes('cloud') || allText.includes('webhook')) {
    permissions.push({
      type: 'network',
      scope: ['fetch'],
      description: 'Access remote endpoints, APIs, and cloud services'
    });
  }

  return permissions;
}

function parseSkillMd(skillDir, skillName) {
  const skillMdPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return null;

  const raw = fs.readFileSync(skillMdPath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  let name = titleCase(skillName);
  let description = '';
  let tools = '';
  let author = 'ECC (Everything Claude Code)';
  let version = '2.0.0';
  let category = '';
  let tags = [skillName, 'claude-code', 'ecc'];

  if (match) {
    const yaml = match[1];
    
    // name
    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      const rawName = nameMatch[1].trim().replace(/^['\"]|['\"]$/g, '');
      if (rawName && rawName !== skillName) {
        name = rawName;
      }
    }

    // description
    const descMatch = yaml.match(/^description:\s*([\s\S]*?)(?=^[a-zA-Z0-9_-]+:|\Z)/m);
    if (descMatch) {
      description = descMatch[1].replace(/\n\s+/g, ' ').trim().replace(/^['\"]|['\"]$/g, '');
    }

    // tools
    const toolsMatch = yaml.match(/^tools:\s*(.+)$/m);
    if (toolsMatch) {
      tools = toolsMatch[1].trim();
    }

    // author
    const authorMatch = yaml.match(/^author:\s*(.+)$/m);
    if (authorMatch) {
      author = authorMatch[1].trim();
    }

    // tags
    const tagsMatch = yaml.match(/^tags:\s*(.+)$/m);
    if (tagsMatch) {
      const parsedTags = tagsMatch[1].split(/[\s,]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
      tags = Array.from(new Set([...tags, ...parsedTags]));
    }

    // category
    const catMatch = yaml.match(/^category:\s*(.+)$/m);
    if (catMatch) {
      category = catMatch[1].trim().toLowerCase();
    }
  }

  // Fallback description from first header/paragraph if empty
  if (!description) {
    const body = raw.replace(/^---[\s\S]*?---/, '').trim();
    const firstPara = body.split(/\n\s*\n/).find(p => !p.startsWith('#') && p.trim().length > 10);
    description = firstPara ? firstPara.replace(/\n/g, ' ').trim().slice(0, 240) : `Advanced Claude Code skill for ${name}.`;
  }

  // Id-derived tags
  skillName.split('-').forEach(part => {
    if (part.length > 2 && !tags.includes(part)) tags.push(part);
  });

  const finalCategory = category && ['development', 'productivity', 'security', 'analysis', 'utility', 'ai'].includes(category)
    ? category
    : classifyCategory(skillName, name, description, tags);

  return {
    id: skillName,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    version,
    description,
    author,
    category: finalCategory,
    tags,
    permissions: extractPermissions(tools, `${skillName} ${name} ${description}`),
    configSchema: {
      type: 'object',
      properties: {
        autoInvoke: {
          type: 'boolean',
          description: 'Automatically invoke when context matches',
          default: true
        },
        strictMode: {
          type: 'boolean',
          description: 'Enforce strict execution guidelines',
          default: false
        }
      }
    },
    defaultConfig: {
      autoInvoke: true,
      strictMode: false
    },
    enabled: true,
    entryPoint: `skills/${skillName}/SKILL.md`,
    source: 'ECC'
  };
}

function main() {
  console.log('== AURA ASSISTANT: ECC SKILLS INTEGRATION ==');
  
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error('Skills directory not found:', SKILLS_DIR);
    process.exit(1);
  }

  let existingSkills = [];
  if (fs.existsSync(SKILLS_DATA_FILE)) {
    try {
      existingSkills = JSON.parse(fs.readFileSync(SKILLS_DATA_FILE, 'utf8'));
      console.log(`Loaded ${existingSkills.length} existing skills from ${SKILLS_DATA_FILE}`);
    } catch (e) {
      console.warn('Could not parse existing skills-data.json, starting fresh');
    }
  }

  const skillMap = new Map();
  // Add existing skills first
  existingSkills.forEach(s => skillMap.set(s.id, s));

  // Find all skill subdirectories
  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory());

  console.log(`Found ${skillDirs.length} skill directories in ${SKILLS_DIR}`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const skillName of skillDirs) {
    const manifest = parseSkillMd(SKILLS_DIR, skillName);
    if (!manifest) continue;

    if (skillMap.has(skillName)) {
      // Preserve existing configuration if already present, but ensure metadata is rich
      const existing = skillMap.get(skillName);
      skillMap.set(skillName, {
        ...manifest,
        ...existing,
        entryPoint: manifest.entryPoint,
        tags: Array.from(new Set([...(existing.tags || []), ...manifest.tags]))
      });
      updatedCount++;
    } else {
      skillMap.set(skillName, manifest);
      addedCount++;
    }
  }

  // Sort alphabetically by ID for clean deterministic file diffs
  const finalSkills = Array.from(skillMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(SKILLS_DATA_FILE, JSON.stringify(finalSkills, null, 2), 'utf8');
  console.log(`\nSuccessfully wrote ${finalSkills.length} total skills to ${SKILLS_DATA_FILE}!`);
  console.log(`- Newly Added: ${addedCount}`);
  console.log(`- Updated: ${updatedCount}`);

  // Summary by category
  const categories = {};
  finalSkills.forEach(s => {
    categories[s.category] = (categories[s.category] || 0) + 1;
  });
  console.log('\nSkills by Category:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  • ${cat}: ${count}`);
  });
}

main();
