/**
 * AURA Unified Intelligence Platform
 * Specialist Agent: Holographic Workshop Agent
 * Product Requirements Document (PRD) Version 1.0 Implementation
 *
 * Vision:
 * "If you can describe it, Aura can send it to the Workshop to visualize, build, modify, and experiment with it."
 */

import {
  Agent,
  AgentType,
  AgentCapability,
  PermissionScope,
  WorkshopWorkspace,
  WorkshopObject,
  WorkshopConnection,
  WorkshopAnnotation,
  WorkshopSimulation,
  WorkshopActionRequest,
  Vector3D
} from '../../shared/types';

export interface WorkshopAgent extends Agent {
  // Controlled Workshop Tools (PRD Section 10)
  createWorkspace(name: string, description?: string): Promise<WorkshopWorkspace>;
  deleteWorkspace(workspaceId: string): Promise<boolean>;
  createObject(workspaceId: string, objectData: Partial<WorkshopObject>): Promise<WorkshopObject>;
  deleteObject(workspaceId: string, objectId: string): Promise<boolean>;
  duplicateObject(workspaceId: string, objectId: string): Promise<WorkshopObject>;
  moveObject(workspaceId: string, objectId: string, position: Vector3D): Promise<WorkshopObject>;
  rotateObject(workspaceId: string, objectId: string, rotation: Vector3D): Promise<WorkshopObject>;
  scaleObject(workspaceId: string, objectId: string, scale: Vector3D): Promise<WorkshopObject>;
  groupObjects(workspaceId: string, objectIds: string[], groupId: string): Promise<WorkshopObject[]>;
  connectObjects(workspaceId: string, sourceId: string, targetId: string, type: WorkshopConnection['type']): Promise<WorkshopConnection>;
  inspectObject(workspaceId: string, objectId: string): Promise<{ object: WorkshopObject; physics: Record<string, unknown>; relationships: string[] }>;
  labelObject(workspaceId: string, objectId: string, title: string, text: string): Promise<WorkshopAnnotation>;
  simulate(workspaceId: string, speed?: number, parameters?: Record<string, unknown>): Promise<WorkshopSimulation>;
  pauseSimulation(workspaceId: string): Promise<WorkshopSimulation>;
  resetSimulation(workspaceId: string): Promise<WorkshopSimulation>;
  explainObject(workspaceId: string, objectId: string): Promise<{ title: string; explanation: string; principles: string[] }>;
  explainSystem(workspaceId: string): Promise<{ system: string; overview: string; steps: string[]; formula?: string }>;
  saveWorkspace(workspaceId: string): Promise<WorkshopWorkspace>;
  loadWorkspace(workspaceId: string): Promise<WorkshopWorkspace>;
  renderWorkspace(workspaceId: string): Promise<Record<string, unknown>>;
  enableAr(workspaceId: string): Promise<{ enabled: boolean; projectionMode: string }>;

  // Action Architecture (PRD Section 11)
  executeActionRequest(request: WorkshopActionRequest): Promise<{ success: boolean; result?: unknown; error?: string }>;
  handleNaturalLanguageCommand(workspaceId: string, command: string): Promise<{
    thoughtProcess: string;
    actionsExecuted: WorkshopActionRequest[];
    explanation: string;
    workspace: WorkshopWorkspace;
  }>;
}

export function createWorkshopAgent(engine: any): WorkshopAgent {
  const capabilities: AgentCapability[] = [
    AgentCapability.SPATIAL_MODELING,
    AgentCapability.SYSTEM_SIMULATION,
    AgentCapability.OBJECT_MANIPULATION,
    AgentCapability.SPATIAL_EXPLANATION,
    AgentCapability.WORKSPACE_MANAGEMENT
  ];

  const agent: WorkshopAgent = {
    id: 'workshop-agent',
    type: AgentType.WORKSHOP,
    name: 'AURA Holographic Workshop Agent',
    capabilities,
    status: 'IDLE',
    health: 100,
    lastHeartbeat: new Date(),

    async createWorkspace(name: string, description?: string): Promise<WorkshopWorkspace> {
      agent.status = 'BUSY';
      try {
        return await engine.createWorkspace(name, description);
      } finally {
        agent.status = 'IDLE';
      }
    },

    async deleteWorkspace(workspaceId: string): Promise<boolean> {
      return await engine.deleteWorkspace(workspaceId);
    },

    async createObject(workspaceId: string, objectData: Partial<WorkshopObject>): Promise<WorkshopObject> {
      return await engine.createObject(workspaceId, objectData);
    },

    async deleteObject(workspaceId: string, objectId: string): Promise<boolean> {
      return await engine.deleteObject(workspaceId, objectId);
    },

    async duplicateObject(workspaceId: string, objectId: string): Promise<WorkshopObject> {
      return await engine.duplicateObject(workspaceId, objectId);
    },

    async moveObject(workspaceId: string, objectId: string, position: Vector3D): Promise<WorkshopObject> {
      return await engine.moveObject(workspaceId, objectId, position);
    },

    async rotateObject(workspaceId: string, objectId: string, rotation: Vector3D): Promise<WorkshopObject> {
      return await engine.rotateObject(workspaceId, objectId, rotation);
    },

    async scaleObject(workspaceId: string, objectId: string, scale: Vector3D): Promise<WorkshopObject> {
      return await engine.scaleObject(workspaceId, objectId, scale);
    },

    async groupObjects(workspaceId: string, objectIds: string[], groupId: string): Promise<WorkshopObject[]> {
      return await engine.groupObjects(workspaceId, objectIds, groupId);
    },

    async connectObjects(workspaceId: string, sourceId: string, targetId: string, type: WorkshopConnection['type']): Promise<WorkshopConnection> {
      return await engine.connectObjects(workspaceId, sourceId, targetId, type);
    },

    async inspectObject(workspaceId: string, objectId: string) {
      return await engine.inspectObject(workspaceId, objectId);
    },

    async labelObject(workspaceId: string, objectId: string, title: string, text: string): Promise<WorkshopAnnotation> {
      return await engine.labelObject(workspaceId, objectId, title, text);
    },

    async simulate(workspaceId: string, speed?: number, parameters?: Record<string, unknown>): Promise<WorkshopSimulation> {
      return await engine.simulate(workspaceId, speed, parameters);
    },

    async pauseSimulation(workspaceId: string): Promise<WorkshopSimulation> {
      return await engine.pauseSimulation(workspaceId);
    },

    async resetSimulation(workspaceId: string): Promise<WorkshopSimulation> {
      return await engine.resetSimulation(workspaceId);
    },

    async explainObject(workspaceId: string, objectId: string) {
      return await engine.explainObject(workspaceId, objectId);
    },

    async explainSystem(workspaceId: string) {
      return await engine.explainSystem(workspaceId);
    },

    async saveWorkspace(workspaceId: string): Promise<WorkshopWorkspace> {
      return await engine.saveWorkspace(workspaceId);
    },

    async loadWorkspace(workspaceId: string): Promise<WorkshopWorkspace> {
      return await engine.loadWorkspace(workspaceId);
    },

    async renderWorkspace(workspaceId: string) {
      return await engine.renderWorkspace(workspaceId);
    },

    async enableAr(workspaceId: string) {
      return await engine.enableAr(workspaceId);
    },

    /**
     * Action Architecture (PRD Section 11):
     * AI -> Action Schema -> Validation -> Permission / Safety Check -> Workshop Engine -> 3D Renderer
     */
    async executeActionRequest(request: WorkshopActionRequest): Promise<{ success: boolean; result?: unknown; error?: string }> {
      // 1. Validation check
      if (!request || !request.action) {
        return { success: false, error: 'Invalid Action Schema: missing action property' };
      }

      // 2. Safety / Permission Check (Zero-Trust Governance)
      const allowedActions = [
        'create_workspace', 'delete_workspace', 'create_object', 'delete_object',
        'duplicate_object', 'move_object', 'rotate_object', 'scale_object',
        'group_objects', 'connect_objects', 'inspect_object', 'label_object',
        'simulate', 'pause_simulation', 'reset_simulation', 'explain_object',
        'explain_system', 'save_workspace', 'load_workspace', 'render_workspace',
        'enable_ar', 'toggle_visibility', 'set_parameter'
      ];

      if (!allowedActions.includes(request.action)) {
        return { success: false, error: `Governance Denied: Action '${request.action}' not in approved tool schema` };
      }

      // 3. Execution via Workshop Engine
      try {
        const result = await engine.executeAction(request);
        return { success: true, result };
      } catch (err: any) {
        return { success: false, error: err.message || 'Execution error' };
      }
    },

    /**
     * Natural Language Interaction Handler (PRD Section 2 & 7):
     * Handles directives such as:
     * - "Build a simple electric motor"
     * - "Remove the coil"
     * - "Show me the magnetic field"
     * - "Slow down the animation"
     * - "Explain why the rotor moves"
     */
    async handleNaturalLanguageCommand(workspaceId: string, command: string) {
      agent.status = 'BUSY';
      agent.lastHeartbeat = new Date();

      try {
        return await engine.processNaturalLanguageCommand(workspaceId, command);
      } finally {
        agent.status = 'IDLE';
      }
    }
  };

  return agent;
}
