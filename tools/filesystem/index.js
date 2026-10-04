/**
 * tools/filesystem/index.js
 * 
 * Modular Filesystem Tool Provider for Aura Assistant.
 * Enforces path containment and sandboxing.
 */

import fs from 'fs/promises';
import path from 'path';

export class FilesystemTool {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.allowEscape = options.allowEscape || false;
  }

  resolveSafePath(targetPath) {
    const resolved = path.isAbsolute(targetPath)
      ? path.normalize(targetPath)
      : path.normalize(path.join(this.workspaceRoot, targetPath));

    if (!this.allowEscape && !resolved.startsWith(this.workspaceRoot) && !resolved.startsWith('/tmp')) {
      throw new Error(`Sandbox Violation: Access to path outside workspace denied: ${targetPath}`);
    }
    return resolved;
  }

  async readFile(filePath, encoding = 'utf-8') {
    const safe = this.resolveSafePath(filePath);
    return await fs.readFile(safe, encoding);
  }

  async writeFile(filePath, content, options = {}) {
    const safe = this.resolveSafePath(filePath);
    await fs.mkdir(path.dirname(safe), { recursive: true });
    await fs.writeFile(safe, content, options);
    return { success: true, path: safe, bytesWritten: Buffer.byteLength(content) };
  }

  async listDirectory(dirPath = '.') {
    const safe = this.resolveSafePath(dirPath);
    const entries = await fs.readdir(safe, { withFileTypes: true });
    return entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      isFile: e.isFile()
    }));
  }

  async deleteFile(filePath) {
    const safe = this.resolveSafePath(filePath);
    await fs.unlink(safe);
    return { success: true, deletedPath: safe };
  }

  async fileExists(filePath) {
    try {
      const safe = this.resolveSafePath(filePath);
      await fs.access(safe);
      return true;
    } catch {
      return false;
    }
  }
}

export const defaultFilesystemTool = new FilesystemTool();
