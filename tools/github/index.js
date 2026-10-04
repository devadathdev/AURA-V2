/**
 * tools/github/index.js
 * 
 * Modular GitHub Tool Provider for Aura Assistant.
 * Uses GitHub CLI (gh) or fallback fetch to interact with GitHub APIs.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitHubTool {
  constructor(options = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
  }

  async isGhAvailable() {
    try {
      await execAsync('gh --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async runGhCommand(args) {
    try {
      const { stdout, stderr } = await execAsync(`gh ${args}`, {
        timeout: this.defaultTimeoutMs,
        env: {
          ...process.env,
          GH_TOKEN: this.token || process.env.GH_TOKEN
        }
      });
      return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout ? error.stdout.trim() : '',
        stderr: error.stderr ? error.stderr.trim() : error.message,
        code: error.code
      };
    }
  }

  async listIssues(repo, state = 'open', limit = 10) {
    const ghAvailable = await this.isGhAvailable();
    if (ghAvailable) {
      const repoFlag = repo ? `-R ${repo}` : '';
      const res = await this.runGhCommand(`issue list ${repoFlag} --state ${state} --limit ${limit} --json number,title,state,author,url,createdAt`);
      if (res.success) {
        try {
          return { success: true, issues: JSON.parse(res.stdout) };
        } catch {
          return { success: true, raw: res.stdout };
        }
      }
      return { success: false, error: res.stderr };
    }

    // Direct REST API fallback
    try {
      if (!repo) return { success: false, error: 'Repository name required (owner/repo)' };
      const headers = { 'User-Agent': 'Aura-Assistant' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=${state}&per_page=${limit}`, { headers });
      if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        success: true,
        issues: data.map(i => ({
          number: i.number,
          title: i.title,
          state: i.state,
          url: i.html_url,
          author: i.user?.login,
          createdAt: i.created_at
        }))
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async listPullRequests(repo, state = 'open', limit = 10) {
    const ghAvailable = await this.isGhAvailable();
    if (ghAvailable) {
      const repoFlag = repo ? `-R ${repo}` : '';
      const res = await this.runGhCommand(`pr list ${repoFlag} --state ${state} --limit ${limit} --json number,title,state,headRefName,url,createdAt`);
      if (res.success) {
        try {
          return { success: true, pullRequests: JSON.parse(res.stdout) };
        } catch {
          return { success: true, raw: res.stdout };
        }
      }
      return { success: false, error: res.stderr };
    }

    try {
      if (!repo) return { success: false, error: 'Repository name required (owner/repo)' };
      const headers = { 'User-Agent': 'Aura-Assistant' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=${state}&per_page=${limit}`, { headers });
      if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        success: true,
        pullRequests: data.map(pr => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          branch: pr.head?.ref,
          url: pr.html_url,
          author: pr.user?.login,
          createdAt: pr.created_at
        }))
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getRepoInfo(repo) {
    if (!repo) return { success: false, error: 'Repository required (owner/repo)' };
    const ghAvailable = await this.isGhAvailable();
    if (ghAvailable) {
      const res = await this.runGhCommand(`repo view ${repo} --json name,owner,description,visibility,defaultBranchRef`);
      if (res.success) {
        try {
          return { success: true, repo: JSON.parse(res.stdout) };
        } catch {
          return { success: true, raw: res.stdout };
        }
      }
    }

    try {
      const headers = { 'User-Agent': 'Aura-Assistant' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
      if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
      const data = await res.json();
      return {
        success: true,
        repo: {
          name: data.name,
          owner: data.owner?.login,
          description: data.description,
          defaultBranch: data.default_branch,
          stars: data.stargazers_count,
          forks: data.forks_count
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const defaultGitHubTool = new GitHubTool();
