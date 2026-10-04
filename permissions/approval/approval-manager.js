/**
 * permissions/approval/approval-manager.js
 * 
 * Manages user approvals, approval queues, timeouts, and audit trails
 * for high-risk operations in Aura Assistant.
 */

import { defaultPermissionPolicy, RiskTier } from '../policies/permission-policy.js';

export class ApprovalManager {
  constructor(policy = defaultPermissionPolicy) {
    this.policy = policy;
    this.pendingApprovals = new Map();
    this.approvalHistory = [];
    this.autoApproveInHeadless = false;
  }

  /**
   * Requests permission before executing an operation
   */
  async requestApproval(skillName, permissions = [], operationContext = {}) {
    const risk = this.policy.evaluateRisk(permissions, operationContext);

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      requestId,
      skillName,
      permissions,
      riskLevel: risk.level,
      reasons: risk.reasons,
      matchedOperations: risk.matchedOperations,
      context: operationContext,
      requestedAt: new Date().toISOString(),
      status: risk.requiresApproval ? 'PENDING' : 'AUTO_APPROVED',
      decidedAt: risk.requiresApproval ? null : new Date().toISOString()
    };

    if (!risk.requiresApproval) {
      this.approvalHistory.push(record);
      return { approved: true, record };
    }

    // High or Critical risk requires resolution
    this.pendingApprovals.set(requestId, record);

    // If headless/test mode is configured
    if (this.autoApproveInHeadless) {
      record.status = 'APPROVED';
      record.decidedAt = new Date().toISOString();
      this.pendingApprovals.delete(requestId);
      this.approvalHistory.push(record);
      return { approved: true, record };
    }

    return {
      approved: false,
      requiresUserConfirmation: true,
      requestId,
      riskLevel: risk.level,
      reasons: risk.reasons,
      record
    };
  }

  /**
   * User approves a pending request
   */
  approve(requestId, userComment = 'Approved by user') {
    const record = this.pendingApprovals.get(requestId);
    if (!record) {
      throw new Error(`Approval request ${requestId} not found or expired`);
    }

    record.status = 'APPROVED';
    record.decidedAt = new Date().toISOString();
    record.comment = userComment;
    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(record);
    return record;
  }

  /**
   * User or policy rejects a request
   */
  deny(requestId, reason = 'Rejected by security policy or operator') {
    const record = this.pendingApprovals.get(requestId);
    if (!record) {
      throw new Error(`Approval request ${requestId} not found or expired`);
    }

    record.status = 'DENIED';
    record.decidedAt = new Date().toISOString();
    record.denialReason = reason;
    this.pendingApprovals.delete(requestId);
    this.approvalHistory.push(record);
    return record;
  }

  getPending() {
    return Array.from(this.pendingApprovals.values());
  }

  getHistory(limit = 50) {
    return this.approvalHistory.slice(-limit);
  }
}

export const defaultApprovalManager = new ApprovalManager();
