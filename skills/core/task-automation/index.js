/**
 * skills/core/task-automation/index.js
 */

export async function execute(context, tools) {
  const task = context.inputs?.taskName || 'node --version';
  const term = tools.terminal;

  const res = await term.executeCommand(task, {
    cwd: context.workspaceRoot
  });

  return {
    success: res.success,
    result: res.success ? `Task executed successfully: ${task}` : `Task failed: ${res.stderr}`,
    data: res
  };
}
