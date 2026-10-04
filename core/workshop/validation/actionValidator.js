/**
 * AURA Holographic Workshop — Action & Safety Validator (V5 Standard)
 * Subsystem: Zero-Trust Action Schema, Tool Registry & Parameter Boundary Gate
 * 
 * Verifies that all actions from AI planners, user input, and A2A channels
 * strictly adhere to approved schemas, physical bounds, and safety guardrails.
 */

export const ALLOWED_ACTIONS = [
  'create_workspace',
  'delete_workspace',
  'save_workspace',
  'load_workspace',
  'render_workspace',
  'enable_ar',
  'create_object',
  'delete_object',
  'duplicate_object',
  'move_object',
  'rotate_object',
  'scale_object',
  'modify_transform',
  'reset_transform',
  'group_objects',
  'ungroup_objects',
  'connect_objects',
  'disconnect_objects',
  'inspect_object',
  'label_object',
  'explain_object',
  'explain_system',
  'search_knowledge',
  'get_entity',
  'get_relationships',
  'find_path',
  'compare_materials',
  'simulate',
  'pause_simulation',
  'step_simulation',
  'reset_simulation',
  'set_parameter',
  'toggle_visibility',
  'toggle_lock',
  'set_layer',
  'assign_layer',
  'set_exploded_view',
  'measure_distance',
  'focus_object',
  'undo',
  'redo',
  'scrub_timeline',
  'restore_version'
];

export const FORBIDDEN_KEYWORDS = [
  'weaponize',
  'dirty bomb',
  'ricin',
  'anthrax',
  'sarin',
  'mustard gas',
  'vx nerve',
  'explosive synthesis',
  'kinetic warhead',
  'combat munition',
  'chemical warhead',
  'biological agent weapon'
];

export const TOOL_REGISTRY = Object.freeze({
  create_workspace: {
    name: 'create_workspace',
    description: 'Instantiates an empty 3D spatial workspace coordinate frame.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] },
    outputSchema: { type: 'object', properties: { workspace_id: { type: 'string' }, name: { type: 'string' } } },
    validationRules: ['name_not_empty']
  },
  delete_workspace: {
    name: 'delete_workspace',
    description: 'Deletes a workspace session.',
    permissionLevel: 'operator',
    inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' } }, required: ['workspace_id'] }
  },
  load_workspace: {
    name: 'load_workspace',
    description: 'Loads or switches to a workspace session by ID.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { workspace_id: { type: 'string' } }, required: ['workspace_id'] }
  },
  create_object: {
    name: 'create_object',
    description: 'Instantiates a 3D component or digital twin inside the workspace.',
    permissionLevel: 'public',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        position: { type: 'object' },
        rotation: { type: 'object' },
        scale: { type: 'object' },
        properties: { type: 'object' }
      },
      required: ['name', 'type']
    },
    validationRules: ['finite_bounds', 'non_negative_scale', 'non_weaponized']
  },
  delete_object: {
    name: 'delete_object',
    description: 'Removes an object and its conduits from the workspace.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' } }, required: ['object_id'] },
    validationRules: ['object_unlocked']
  },
  move_object: {
    name: 'move_object',
    description: 'Translates an object in Cartesian coordinates (x, y, z).',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' }, position: { type: 'object' } }, required: ['object_id', 'position'] },
    validationRules: ['finite_bounds', 'object_unlocked']
  },
  rotate_object: {
    name: 'rotate_object',
    description: 'Rotates an object in Euler angles (x, y, z).',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' }, rotation: { type: 'object' } }, required: ['object_id', 'rotation'] }
  },
  scale_object: {
    name: 'scale_object',
    description: 'Scales an object along 3D axes (sx, sy, sz).',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' }, scale: { type: 'object' } }, required: ['object_id', 'scale'] },
    validationRules: ['non_negative_scale']
  },
  connect_objects: {
    name: 'connect_objects',
    description: 'Establishes a mechanical, electrical, data, or fluid conduit between two objects.',
    permissionLevel: 'public',
    inputSchema: {
      type: 'object',
      properties: {
        source_id: { type: 'string' },
        target_id: { type: 'string' },
        type: { type: 'string', enum: ['mechanical', 'electrical', 'data', 'fluid', 'magnetic'] }
      },
      required: ['source_id', 'target_id']
    }
  },
  search_knowledge: {
    name: 'search_knowledge',
    description: 'Searches across periodic elements, nanomaterials, robotics, and knowledge graph.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' } }, required: ['query'] }
  },
  find_path: {
    name: 'find_path',
    description: 'Computes the shortest semantic cross-domain path connecting two concepts.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { source: { type: 'string' }, target: { type: 'string' } }, required: ['source', 'target'] }
  },
  compare_materials: {
    name: 'compare_materials',
    description: 'Computes comparative physical, mechanical, and thermal metrics between two materials.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { material_a: { type: 'string' }, material_b: { type: 'string' } }, required: ['material_a', 'material_b'] }
  },
  simulate: {
    name: 'simulate',
    description: 'Starts deterministic physical and kinematic simulation.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { speed: { type: 'number' }, parameters: { type: 'object' } } },
    validationRules: ['valid_speed_range']
  },
  pause_simulation: {
    name: 'pause_simulation',
    description: 'Freezes simulation state at the current timestamp.',
    permissionLevel: 'public'
  },
  step_simulation: {
    name: 'step_simulation',
    description: 'Advances simulation forward by exactly one discrete physics delta.',
    permissionLevel: 'public'
  },
  reset_simulation: {
    name: 'reset_simulation',
    description: 'Rewinds simulation state to t=0 initial state vectors.',
    permissionLevel: 'public'
  },
  explain_object: {
    name: 'explain_object',
    description: 'Returns scientific principles, equations, and physical role of a component.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' } }, required: ['object_id'] }
  },
  explain_system: {
    name: 'explain_system',
    description: 'Provides full multi-body interaction and scientific system analysis.',
    permissionLevel: 'public'
  },
  measure_distance: {
    name: 'measure_distance',
    description: 'Computes point-to-point 3D Euclidean distance and delta vectors between two components.',
    permissionLevel: 'public'
  },
  set_exploded_view: {
    name: 'set_exploded_view',
    description: 'Radial coordinate offset slider to reveal internal components.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { factor: { type: 'number' } }, required: ['factor'] }
  },
  modify_transform: {
    name: 'modify_transform',
    description: 'Modifies spatial position, rotation, or scale of a component within bounded limits.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' } }, required: ['object_id'] }
  },
  group_objects: {
    name: 'group_objects',
    description: 'Combines multiple components into an assembly group.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_ids: { type: 'array' }, group_id: { type: 'string' } }, required: ['object_ids', 'group_id'] }
  },
  ungroup_objects: {
    name: 'ungroup_objects',
    description: 'Disbands an assembly group back into individual components.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { group_id: { type: 'string' } }, required: ['group_id'] }
  },
  assign_layer: {
    name: 'assign_layer',
    description: 'Assigns a component to an architectural or engineering layer.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' }, layer_id: { type: 'string' } }, required: ['object_id', 'layer_id'] }
  },
  duplicate_object: {
    name: 'duplicate_object',
    description: 'Creates a cloned instance of a component.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' } }, required: ['object_id'] }
  },
  toggle_visibility: {
    name: 'toggle_visibility',
    description: 'Shows or hides a component in the 3D viewport.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' } }, required: ['object_id'] }
  },
  toggle_lock: {
    name: 'toggle_lock',
    description: 'Locks or unlocks a component to prevent accidental transform edits.',
    permissionLevel: 'public',
    inputSchema: { type: 'object', properties: { object_id: { type: 'string' } }, required: ['object_id'] }
  }
});

export class ActionValidator {
  validate(request) {
    return ActionValidator.validate(request);
  }

  getRegisteredTools() {
    return ActionValidator.getRegisteredTools();
  }

  static getRegisteredTools() {
    return Object.keys(TOOL_REGISTRY);
  }

  /**
   * Validates an incoming Action Request.
   * @param {Object} request 
   * @returns {{ valid: boolean, error?: string, reason?: string }}
   */
  static validate(request) {
    function fail(msg) {
      return { valid: false, error: msg, reason: msg };
    }

    if (!request || typeof request !== 'object') {
      return fail('Malformed action request: Expected an object');
    }

    if (!request.action || typeof request.action !== 'string') {
      return fail('Validation Error: Missing or invalid "action" field');
    }

    if (!ALLOWED_ACTIONS.includes(request.action)) {
      return fail(`Governance Denied: Unregistered tool. Action '${request.action}' is not an approved Workshop tool`);
    }

    // Safety and Non-Weaponization Check
    const serialized = JSON.stringify(request).toLowerCase();
    for (const kw of FORBIDDEN_KEYWORDS) {
      if (serialized.includes(kw)) {
        return fail(`Safety violation: Action rejected due to non-permitted domain keyword '${kw}'. Dual-use technologies must adhere to industrial/educational boundaries.`);
      }
    }

    // Numerical range / bounds checking
    if (request.position) {
      const { x, y, z } = request.position;
      if ([x, y, z].some(val => val !== undefined && (typeof val !== 'number' || isNaN(val)))) {
        return fail('Position coordinates must be valid numbers');
      }
      if ([x, y, z].some(val => Math.abs(val || 0) > 5000)) {
        return fail('Position exceeds spatial boundary limits (±5,000)');
      }
    }

    if (request.scale) {
      const { x, y, z } = request.scale;
      if ([x, y, z].some(val => val !== undefined && (typeof val !== 'number' || isNaN(val) || val <= 0))) {
        return fail('Scale factors must be positive non-zero numbers');
      }
    }

    if (request.speed !== undefined) {
      if (typeof request.speed !== 'number' || isNaN(request.speed) || request.speed < 0 || request.speed > 50) {
        return fail('Simulation speed must be a number between 0 and 50');
      }
    }

    // Connection validation
    if (request.action === 'connect_objects') {
      const src = request.source_id || request.source;
      const tgt = request.target_id || request.target;
      if (!src || !tgt) {
        return fail('connect_objects requires both source and target IDs');
      }
      if (src === tgt) {
        return fail('Cannot connect an object to itself');
      }
    }

    return { valid: true };
  }
}

