/**
 * skills/core/code-analysis/index.js
 */

export async function execute(context, tools) {
  const target = context.inputs?.targetPath || '.';
  const fsTool = tools.filesystem;
  
  const entries = await fsTool.listDirectory(target);
  const summary = {
    totalEntries: entries.length,
    directories: entries.filter(e => e.isDirectory).length,
    files: entries.filter(e => e.isFile).length,
    languages: {}
  };

  return {
    success: true,
    result: `Analyzed ${summary.totalEntries} items in ${target}: ${summary.files} files, ${summary.directories} directories.`,
    data: summary
  };
}
