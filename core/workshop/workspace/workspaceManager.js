/**
 * AURA Holographic Workshop — Workspace Manager (V2 Spatial Editor Engine)
 * Subsystem: Infinite Grid, Multi-Selection, Grouping, Layers, Transforms, & Snapping
 */

import fs from 'fs';
import path from 'path';
import { ActionValidator } from '../validation/actionValidator.js';
import { SimulationEngine } from '../simulation/simulationEngine.js';
import { ProjectionEngine } from '../renderer/projectionEngine.js';

const STORAGE_PATH = path.resolve('config', 'workshop_workspaces.json');

export class WorkspaceManager {
  constructor() {
    this.workspaces = new Map();
    this.activeWorkspaceId = 'ws_electric_motor';
    this.selectedObjectIds = new Set();
    this.snapGrid = {
      enabled: true,
      size: 10
    };
    this.explodedFactor = 0.0; // 0.0 (compact) to 1.0 (fully exploded)
    this.xrayMode = false;
  }

  /**
   * Initializes or loads persisted workspaces.
   */
  loadFromDisk() {
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [id, ws] of Object.entries(parsed)) {
          this.workspaces.set(id, ws);
        }
        return true;
      }
    } catch (err) {
      console.warn('[WorkspaceManager] Load from disk failed:', err.message);
    }
    return false;
  }

  persistToDisk() {
    try {
      const data = {};
      for (const [id, ws] of this.workspaces.entries()) {
        data[id] = ws;
      }
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.warn('[WorkspaceManager] Persist to disk failed:', err.message);
      return false;
    }
  }

  getActiveWorkspace() {
    return this.workspaces.get(this.activeWorkspaceId) || null;
  }

  setActiveWorkspace(id) {
    if (this.workspaces.has(id)) {
      this.activeWorkspaceId = id;
      this.selectedObjectIds.clear();
      return true;
    }
    return false;
  }

  getWorkspace(id) {
    return this.workspaces.get(id);
  }

  getAllWorkspaces() {
    return Array.from(this.workspaces.values());
  }

  createWorkspace(name, description = '', category = 'Custom Systems') {
    const id = `ws_${Date.now()}`;
    const newWs = {
      workspace_id: id,
      name,
      description,
      category,
      objects: [],
      connections: [],
      annotations: [],
      layers: [
        { id: 'layer_default', name: 'Default', visible: true, locked: false, color: '#00F0FF' },
        { id: 'layer_mechanical', name: 'Mechanical', visible: true, locked: false, color: '#94A3B8' },
        { id: 'layer_electrical', name: 'Electrical', visible: true, locked: false, color: '#F59E0B' },
        { id: 'layer_magnetic', name: 'Magnetic', visible: true, locked: false, color: '#2EE6C5' }
      ],
      groups: [],
      simulation: {
        running: false,
        speed: 1.0,
        step: 0,
        parameters: {}
      },
      camera: { rotX: 0.25, rotY: 0.45, rotZ: 0, panX: 0, panY: 0, zoom: 1.0 },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '2.0.0',
        author: 'AURA Holographic Workshop'
      }
    };
    this.workspaces.set(id, newWs);
    this.activeWorkspaceId = id;
    this.persistToDisk();
    return newWs;
  }

  deleteWorkspace(id) {
    if (this.workspaces.has(id)) {
      this.workspaces.delete(id);
      if (this.activeWorkspaceId === id) {
        this.activeWorkspaceId = this.workspaces.keys().next().value || '';
      }
      this.persistToDisk();
      return true;
    }
    return false;
  }

  // ── Snap-to-Grid Utility ──
  snap(val) {
    if (!this.snapGrid.enabled || !this.snapGrid.size) return val;
    return Math.round(val / this.snapGrid.size) * this.snapGrid.size;
  }

  // ── Multi-Selection & Object Selection ──
  selectObject(objectId, isMultiSelect = false) {
    if (!isMultiSelect) {
      this.selectedObjectIds.clear();
    }
    if (this.selectedObjectIds.has(objectId)) {
      this.selectedObjectIds.delete(objectId);
    } else {
      this.selectedObjectIds.add(objectId);
    }
    return Array.from(this.selectedObjectIds);
  }

  selectAll(workspaceId = this.activeWorkspaceId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) return [];
    this.selectedObjectIds.clear();
    ws.objects.forEach(o => {
      if (!o.locked) this.selectedObjectIds.add(o.id);
    });
    return Array.from(this.selectedObjectIds);
  }

  clearSelection() {
    this.selectedObjectIds.clear();
    return [];
  }

  getSelectedObjects(workspaceId = this.activeWorkspaceId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) return [];
    return ws.objects.filter(o => this.selectedObjectIds.has(o.id));
  }

  // ── V2 Spatial Manipulation & Transforms ──
  createObject(workspaceId, objectData) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);

    const id = objectData.id || `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newObj = {
      id,
      name: objectData.name || 'Component',
      type: objectData.type || 'box',
      layerId: objectData.layerId || 'layer_default',
      groupId: objectData.groupId || null,
      locked: !!objectData.locked,
      visible: objectData.visible !== false,
      position: {
        x: this.snap(objectData.position?.x ?? 0),
        y: this.snap(objectData.position?.y ?? 0),
        z: this.snap(objectData.position?.z ?? 0)
      },
      rotation: {
        x: objectData.rotation?.x ?? 0,
        y: objectData.rotation?.y ?? 0,
        z: objectData.rotation?.z ?? 0
      },
      scale: {
        x: objectData.scale?.x ?? 1,
        y: objectData.scale?.y ?? 1,
        z: objectData.scale?.z ?? 1
      },
      properties: objectData.properties || { color: '#00F0FF', material: 'Standard' },
      connections: objectData.connections || [],
      metadata: objectData.metadata || { createdAt: new Date().toISOString() }
    };

    ws.objects.push(newObj);
    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return newObj;
  }

  moveObject(workspaceId, objectId, position) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const obj = ws.objects.find(o => o.id === objectId);
    if (!obj) throw new Error(`Object ${objectId} not found`);
    if (obj.locked) throw new Error(`Object ${objectId} is locked`);

    if (position.x !== undefined) obj.position.x = this.snap(position.x);
    if (position.y !== undefined) obj.position.y = this.snap(position.y);
    if (position.z !== undefined) obj.position.z = this.snap(position.z);

    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return obj;
  }

  rotateObject(workspaceId, objectId, rotation) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const obj = ws.objects.find(o => o.id === objectId);
    if (!obj) throw new Error(`Object ${objectId} not found`);
    if (obj.locked) throw new Error(`Object ${objectId} is locked`);

    if (rotation.x !== undefined) obj.rotation.x = rotation.x;
    if (rotation.y !== undefined) obj.rotation.y = rotation.y;
    if (rotation.z !== undefined) obj.rotation.z = rotation.z;

    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return obj;
  }

  scaleObject(workspaceId, objectId, scale) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const obj = ws.objects.find(o => o.id === objectId);
    if (!obj) throw new Error(`Object ${objectId} not found`);
    if (obj.locked) throw new Error(`Object ${objectId} is locked`);

    if (scale.x !== undefined) obj.scale.x = Math.max(0.01, scale.x);
    if (scale.y !== undefined) obj.scale.y = Math.max(0.01, scale.y);
    if (scale.z !== undefined) obj.scale.z = Math.max(0.01, scale.z);

    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return obj;
  }

  resetTransform(workspaceId, objectId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const obj = ws.objects.find(o => o.id === objectId);
    if (!obj) throw new Error(`Object ${objectId} not found`);
    if (obj.locked) throw new Error(`Object ${objectId} is locked`);

    obj.position = { x: 0, y: 0, z: 0 };
    obj.rotation = { x: 0, y: 0, z: 0 };
    obj.scale = { x: 1, y: 1, z: 1 };

    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return obj;
  }

  toggleLock(workspaceId, objectId, locked) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const obj = ws.objects.find(o => o.id === objectId);
    if (!obj) throw new Error(`Object ${objectId} not found`);

    obj.locked = locked !== undefined ? !!locked : !obj.locked;
    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return obj;
  }

  toggleVisibility(workspaceId, objectId, visible) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const obj = ws.objects.find(o => o.id === objectId);
    if (!obj) throw new Error(`Object ${objectId} not found`);

    obj.visible = visible !== undefined ? !!visible : !obj.visible;
    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return obj;
  }

  duplicateObject(workspaceId, objectId, offset = { x: 25, y: 0, z: 25 }) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const source = ws.objects.find(o => o.id === objectId);
    if (!source) throw new Error(`Object ${objectId} not found`);

    const cloneData = JSON.parse(JSON.stringify(source));
    cloneData.id = `obj_${Date.now()}_copy`;
    cloneData.name = `${source.name} (Copy)`;
    cloneData.position.x = this.snap(source.position.x + (offset.x || 25));
    cloneData.position.y = this.snap(source.position.y + (offset.y || 0));
    cloneData.position.z = this.snap(source.position.z + (offset.z || 25));
    cloneData.locked = false;

    ws.objects.push(cloneData);
    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return cloneData;
  }

  deleteObject(workspaceId, objectId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idx = ws.objects.findIndex(o => o.id === objectId);
    if (idx === -1) return false;
    if (ws.objects[idx].locked) throw new Error(`Object ${objectId} is locked`);

    ws.objects.splice(idx, 1);
    this.selectedObjectIds.delete(objectId);
    // Remove all connections referencing this object
    ws.connections = ws.connections.filter(c => c.source !== objectId && c.target !== objectId);
    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return true;
  }

  // ── Grouping & Hierarchy ──
  groupObjects(workspaceId, objectIds, groupId, groupName = 'Assembly Group') {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    if (!objectIds || objectIds.length < 2) throw new Error('At least two objects are required to form a group');

    const gid = groupId || `group_${Date.now()}`;
    if (!ws.groups) ws.groups = [];
    ws.groups.push({ id: gid, name: groupName, memberIds: [...objectIds] });

    for (const id of objectIds) {
      const obj = ws.objects.find(o => o.id === id);
      if (obj) obj.groupId = gid;
    }

    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return { groupId: gid, memberIds: objectIds };
  }

  ungroupObjects(workspaceId, groupId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    if (!ws.groups) return false;

    ws.groups = ws.groups.filter(g => g.id !== groupId);
    for (const obj of ws.objects) {
      if (obj.groupId === groupId) obj.groupId = null;
    }

    ws.metadata.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return true;
  }

  // ── Layers Management ──
  getLayers(workspaceId = this.activeWorkspaceId) {
    const ws = this.getWorkspace(workspaceId);
    return ws ? ws.layers || [] : [];
  }

  addLayer(workspaceId, layer) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    if (!ws.layers) ws.layers = [];

    const newLayer = {
      id: layer.id || `layer_${Date.now()}`,
      name: layer.name || 'Custom Layer',
      visible: layer.visible !== false,
      locked: !!layer.locked,
      color: layer.color || '#3B82F6'
    };
    ws.layers.push(newLayer);
    this.persistToDisk();
    return newLayer;
  }

  setLayerVisibility(workspaceId, layerId, visible) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws || !ws.layers) return false;
    const layer = ws.layers.find(l => l.id === layerId);
    if (!layer) return false;
    layer.visible = !!visible;

    // Apply to objects belonging to layer
    for (const obj of ws.objects) {
      if (obj.layerId === layerId) obj.visible = layer.visible;
    }
    this.persistToDisk();
    return true;
  }

  // ── 3D Measurement Tool ──
  measureBetween(workspaceId, objId1, objId2) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const o1 = ws.objects.find(o => o.id === objId1);
    const o2 = ws.objects.find(o => o.id === objId2);
    if (!o1 || !o2) throw new Error('Both objects must exist to measure distance');

    const metrics = ProjectionEngine.computeDistance(o1.position, o2.position);
    return {
      source: { id: o1.id, name: o1.name, position: o1.position },
      target: { id: o2.id, name: o2.name, position: o2.position },
      ...metrics
    };
  }

  // ── Exploded View & Visual Expansion ──
  setExplodedFactor(factor) {
    this.explodedFactor = Math.max(0, Math.min(1.0, factor));
    return this.explodedFactor;
  }

  getExplodedPosition(obj, centroid = { x: 0, y: 0, z: 0 }) {
    if (this.explodedFactor === 0) return obj.position;

    const dx = obj.position.x - centroid.x;
    const dy = obj.position.y - centroid.y;
    const dz = obj.position.z - centroid.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    const expandMult = 1.0 + this.explodedFactor * 1.5;
    return {
      x: centroid.x + (dx / dist) * dist * expandMult,
      y: centroid.y + (dy / dist) * dist * expandMult,
      z: centroid.z + (dz / dist) * dist * expandMult
    };
  }
}

export const workspaceManager = new WorkspaceManager();
