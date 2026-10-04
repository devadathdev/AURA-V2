/**
 * skills/core/documentation/index.js
 */

export async function execute(context, tools) {
  const fsTool = tools.filesystem;
  const docPath = context.inputs?.docPath || 'docs/skills/OVERVIEW.md';
  const title = context.inputs?.title || 'System Documentation';
  const content = context.inputs?.content || 'Auto-generated documentation content.';

  const fileBody = `# ${title}\n\n*Generated on: ${new Date().toISOString()}*\n\n${content}\n`;
  const res = await fsTool.writeFile(docPath, fileBody);

  return {
    success: true,
    result: `Documentation written to ${docPath} (${res.bytesWritten} bytes)`,
    data: res
  };
}
