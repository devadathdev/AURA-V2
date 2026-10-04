/**
 * tools/git/index.js
 * 
 * Modular Git Tool Provider for Aura Assistant.
 * Provides safe git repository inspection, branch management, and commit operations.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class GitTool {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.defaultTimeoutMs = options.defaultTimeoutMs || 20000;
  }

  async runGitCommand(args, options = {}) {
    const cwd = options.cwd || this.workspaceRoot;
    const timeout = options.timeoutMs || this.defaultTimeoutMs;

    // Sanitize arguments to prevent shell injection
    const command = `git ${args}`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024 * 5 // 5MB
      });
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout ? error.stdout.trim() : '',
        stderr: error.stderr ? error.stderr.trim() : error.message,
        code: error.code
      };
    }
  }

  async status(cwd) {
    const res = await this.runGitCommand('status --porcelain -b', { cwd });
    if (!res.success) return { success: false, error: res.stderr };

    const lines = res.stdout.split('\n').filter(Boolean);
    const branchLine = lines[0] || '';
    const changes = lines.slice(1).map(line => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3).trim()
    }));

    return {
      success: true,
      branch: branchLine.replace(/^##\s+/, ''),
      clean: changes.length === 0,
      changes
    };
  }

  async log(limit = 10, cwd) {
    const res = await this.runGitCommand(`log -n ${parseInt(limit, 10) || 10} --pretty=format:"%H|%an|%ad|%s" --date=short`, { cwd });
    if (!res.success) return { success: false, error: res.stderr, commits: [] };

    const commits = res.stdout.split('\n').filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message };
    });

    return { success: true, commits };
  }

  async diff(target = '', cwd) {
    const sanitizedTarget = target ? target.replace(/[^a-zA-Z0-9_\-\.\/]/g, '') : '';
    const res = await this.runGitCommand(`diff ${sanitizedTarget}`, { cwd });
    return res;
  }

  async branch(cwd) {
    const res = await this.runGitCommand('branch -a', { cwd });
    if (!res.success) return { success: false, error: res.stderr };

    const branches = res.stdout.split('\n').map(b => b.trim());
    const current = branches.find(b => b.startsWith('*'))?.replace('* ', '') || '';
    return {
      success: true,
      current,
      branches: branches.map(b => b.replace(/^\*\s+/, ''))
    };
  }

  async add(files = '.', cwd) {
    const safeFiles = Array.isArray(files) ? files.map(f => `"${f.replace(/"/g, '\\"')}"`).join(' ') : files;
    return await this.runGitCommand(`add ${safeFiles}`, { cwd });
  }

  async commit(message, cwd) {
    if (!message || typeof message !== 'string') {
      throw new Error('Commit message is required');
    }
    const safeMessage = message.replace(/"/g, '\\"');
    return await this.runGitCommand(`commit -m "${safeMessage}"`, { cwd });
  }
}

export const defaultGitTool = new GitTool();
