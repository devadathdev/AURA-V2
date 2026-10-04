/**
 * tools/index.js
 * 
 * Unified tool registry and export hub for Aura Assistant.
 */

export { FilesystemTool, defaultFilesystemTool } from './filesystem/index.js';
export { TerminalTool, defaultTerminalTool } from './terminal/index.js';
export { GitTool, defaultGitTool } from './git/index.js';
export { GitHubTool, defaultGitHubTool } from './github/index.js';
export { WebTool, defaultWebTool } from './web/index.js';

import { defaultFilesystemTool } from './filesystem/index.js';
import { defaultTerminalTool } from './terminal/index.js';
import { defaultGitTool } from './git/index.js';
import { defaultGitHubTool } from './github/index.js';
import { defaultWebTool } from './web/index.js';

export const toolRegistry = {
  filesystem: defaultFilesystemTool,
  terminal: defaultTerminalTool,
  git: defaultGitTool,
  github: defaultGitHubTool,
  web: defaultWebTool
};

export default toolRegistry;
