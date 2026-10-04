/**
 * tools/terminal/index.js
 * 
 * Modular Terminal Tool Provider for Aura Assistant.
 * Provides restricted shell execution with timeouts and environment isolation.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TerminalTool {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
    this.maxBuffer = options.maxBuffer || 1024 * 1024 * 4; // 4MB
    this.blockedCommands = [
      /\brm\s+(-[a-zA-Z]*\s+)*\/(?:\s|$|\*)/,
      /\bmkfs\b/,
      /\bdd\s+if=.*of=\/dev/,
      /\bchmod\s+(-[a-zA-Z]*\s+)*777\s+\//,
      /:\(\)\s*\{\s*:\|:&\s*\};:/ // fork bomb
    ];
  }

  isCommandBlocked(command) {
    for (const pattern of this.blockedCommands) {
      if (pattern.test(command)) {
        return true;
      }
    }
    return false;
  }

  async executeCommand(command, options = {}) {
    if (this.isCommandBlocked(command)) {
      throw new Error(`Security Violation: Command blocked by safety policy: "${command}"`);
    }

    const timeout = options.timeoutMs || this.defaultTimeoutMs;
    const cwd = options.cwd || this.workspaceRoot;

    // Filter environment to avoid leaking sensitive credentials
    const safeEnv = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      NODE_ENV: process.env.NODE_ENV || 'production',
      HOME: process.env.HOME || '/root',
      TERM: 'xterm-256color',
      ...(options.env || {})
    };

    const startTime = Date.now();
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        env: safeEnv,
        timeout,
        maxBuffer: this.maxBuffer
      });

      return {
        success: true,
        exitCode: 0,
        stdout: stdout || '',
        stderr: stderr || '',
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        exitCode: error.code || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        executionTimeMs: Date.now() - startTime,
        killed: error.killed || false
      };
    }
  }
}

export const defaultTerminalTool = new TerminalTool();
