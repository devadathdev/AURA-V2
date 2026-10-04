/**
 * skills/core/data-analysis/index.js
 */

export async function execute(context, tools) {
  const fsTool = tools.filesystem;
  const filePath = context.inputs?.dataPath || 'learning-data.json';

  try {
    const raw = await fsTool.readFile(filePath);
    const parsed = JSON.parse(raw);
    const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;

    return {
      success: true,
      result: `Successfully parsed ${filePath}: contains ${count} top-level items.`,
      recordCount: count,
      data: { isArray: Array.isArray(parsed), keys: Array.isArray(parsed) ? [] : Object.keys(parsed) }
    };
  } catch (err) {
    return {
      success: false,
      result: `Data analysis failed: ${err.message}`,
      error: err.message
    };
  }
}
