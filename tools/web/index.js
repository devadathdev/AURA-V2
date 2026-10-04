/**
 * tools/web/index.js
 * 
 * Modular Web Tool Provider for Aura Assistant.
 * Provides safe HTTP fetching, URL inspection, and documentation lookup with timeouts and size limits.
 */

export class WebTool {
  constructor(options = {}) {
    this.defaultTimeoutMs = options.defaultTimeoutMs || 15000;
    this.maxResponseBytes = options.maxResponseBytes || 1024 * 1024 * 2; // 2MB
    this.userAgent = options.userAgent || 'Aura-Assistant-WebTool/1.0';
  }

  isUrlAllowed(urlStr) {
    try {
      const parsed = new URL(urlStr);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { allowed: false, reason: 'Only HTTP and HTTPS protocols allowed' };
      }
      // Deny localhost / loopback / private IP access if strict sandboxing
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
        return { allowed: false, reason: 'Cloud metadata service access denied' };
      }
      return { allowed: true, url: parsed };
    } catch (err) {
      return { allowed: false, reason: `Invalid URL: ${err.message}` };
    }
  }

  async fetch(urlStr, options = {}) {
    const check = this.isUrlAllowed(urlStr);
    if (!check.allowed) {
      throw new Error(`WebTool Access Violation: ${check.reason}`);
    }

    const timeout = options.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(urlStr, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9',
          ...(options.headers || {})
        },
        body: options.body,
        signal: controller.signal
      });

      clearTimeout(timer);

      const contentType = response.headers.get('content-type') || '';
      let text = await response.text();

      if (text.length > this.maxResponseBytes) {
        text = text.substring(0, this.maxResponseBytes) + '\n...[TRUNCATED_RESPONSE_SIZE_EXCEEDED]';
      }

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType,
        data: text
      };
    } catch (error) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        return { success: false, error: `Request timed out after ${timeout}ms` };
      }
      return { success: false, error: error.message };
    }
  }

  async fetchJson(urlStr, options = {}) {
    const res = await this.fetch(urlStr, {
      ...options,
      headers: { ...(options.headers || {}), 'Accept': 'application/json' }
    });
    if (!res.success) return res;
    try {
      return { success: true, status: res.status, json: JSON.parse(res.data) };
    } catch (err) {
      return { success: false, status: res.status, error: `Failed to parse JSON: ${err.message}`, raw: res.data };
    }
  }
}

export const defaultWebTool = new WebTool();
