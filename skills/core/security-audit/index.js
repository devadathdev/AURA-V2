/**
 * skills/core/security-audit/index.js
 */

export async function execute(context, tools) {
  const fsTool = tools.filesystem;
  const target = context.inputs?.scanPath || '.';

  const findings = [];
  const entries = await fsTool.listDirectory(target);

  for (const entry of entries) {
    if (entry.isFile && (entry.name.endsWith('.env') || entry.name.endsWith('.pem') || entry.name.endsWith('.key'))) {
      findings.push({
        file: entry.name,
        severity: 'HIGH',
        message: `Sensitive credential file found in workspace: ${entry.name}`
      });
    }
  }

  return {
    success: true,
    result: `Security audit completed with ${findings.length} findings.`,
    findings,
    riskLevel: findings.length > 0 ? 'HIGH' : 'LOW'
  };
}
