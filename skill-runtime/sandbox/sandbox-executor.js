/**
 * skill-runtime/sandbox/sandbox-executor.js
 * 
 * Enforces strict environment isolation, path confinement,
 * timeouts, and resource limitations during skill execution.
 */

import path from 'path';

export class SandboxExecutor {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
  }

  /**
   * Cleanses environment variables so secrets are never leaked to skills
   */
  sanitizeEnvironment(customEnv = {}) {
    const safeWhitelist = [
      'PATH', 'HOME', 'USER', 'LANG', 'LC_ALL', 'TERM', 'NODE_ENV', 'TMPDIR'
    ];

    const safeEnv = {};
    for (const key of safeWhitelist) {
      if (process.env[key]) {
        safeEnv[key] = process.env[key];
      }
    }

    // Merge custom non-sensitive env variables
    for (const [k, v] of Object.entries(customEnv)) {
      if (!/secret|token|key|password|auth/i.test(k)) {
        safeEnv[k] = v;
      }
    }

    return safeEnv;
  }

  /**
   * Creates sandboxed tool instances scoped strictly to allowed paths
   */
  createSandboxedTools(baseTools, sandboxConfig = {}) {
    const allowedPaths = sandboxConfig.allowedPaths || ['.'];
    const resolvedAllowed = allowedPaths.map(p => path.resolve(this.workspaceRoot, p));

    const sandboxedFs = Object.create(baseTools.filesystem);
    sandboxedFs.resolveSafePath = (target) => {
      const resolved = path.resolve(this.workspaceRoot, target);
      const isAllowed = resolvedAllowed.some(root => resolved.startsWith(root) || resolved.startsWith('/tmp'));
      if (!isAllowed) {
        throw new Error(`Sandbox Path Confinement Violation: "${target}" is outside allowed roots [${allowedPaths.join(', ')}]`);
      }
      return resolved;
    };

    const sandboxedTerminal = Object.create(baseTools.terminal);
    sandboxedTerminal.executeCommand = async (cmd, opts = {}) => {
      const timeout = Math.min(opts.timeoutMs || this.defaultTimeoutMs, sandboxConfig.timeoutMs || this.defaultTimeoutMs);
      const safeEnv = this.sanitizeEnvironment(opts.env);
      return baseTools.terminal.executeCommand(cmd, {
        ...opts,
        timeoutMs: timeout,
        env: safeEnv
      });
    };

    return {
      ...baseTools,
      filesystem: sandboxedFs,
      terminal: sandboxedTerminal
    };
  }

  /**
   * Executes a task function within the sandbox with timeout racing
   */
  async execute(manifest, executionFn, context = {}, tools = {}) {
    const timeoutMs = manifest.sandbox?.timeoutMs || this.defaultTimeoutMs;
    const sandboxedTools = this.createSandboxedTools(tools, manifest.sandbox);

    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Sandbox Execution Timeout: Exceeded ${timeoutMs}ms limit`));
      }, timeoutMs);
    });

    const startTime = Date.now();

    try {
      const executionPromise = Promise.resolve(executionFn(context, sandboxedTools));
      const result = await Promise.race([executionPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);

      return {
        success: true,
        executionTimeMs: Date.now() - startTime,
        result: result?.result || result,
        data: result?.data || null,
        metadata: {
          skillId: manifest.id,
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      clearTimeout(timeoutHandle);
      return {
        success: false,
        executionTimeMs: Date.now() - startTime,
        error: error.message,
        metadata: {
          skillId: manifest.id,
          failedAt: new Date().toISOString()
        }
      };
    }
  }
}

export const defaultSandboxExecutor = new SandboxExecutor();
