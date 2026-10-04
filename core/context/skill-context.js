/**
 * core/context/skill-context.js
 * 
 * Manages runtime execution context, environment isolation boundaries,
 * inter-skill variable piping, and conversation tracking.
 */

export class SkillContext {
  constructor(options = {}) {
    this.sessionId = options.sessionId || `session_${Date.now()}`;
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.variables = new Map();
    this.executionHistory = [];
  }

  set(key, value) {
    this.variables.set(key, value);
    return this;
  }

  get(key, defaultValue = null) {
    return this.variables.has(key) ? this.variables.get(key) : defaultValue;
  }

  has(key) {
    return this.variables.has(key);
  }

  recordStep(skillId, inputs, output) {
    this.executionHistory.push({
      step: this.executionHistory.length + 1,
      skillId,
      inputs,
      output,
      timestamp: new Date().toISOString()
    });
  }

  getHistory() {
    return [...this.executionHistory];
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      workspaceRoot: this.workspaceRoot,
      variables: Object.fromEntries(this.variables),
      historyLength: this.executionHistory.length
    };
  }
}
