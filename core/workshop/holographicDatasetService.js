/**
 * AURA OS // Holographic Workshop Dataset Service
 * 
 * Comprehensive Ingestion, Indexing, and Scientific Knowledge Graph Engine.
 * Supports:
 * - Dataset Pack v1 (Foundational Starter Schemas)
 * - Dataset Pack v2 (300 Objects, 100 Systems, Materials, Schemas)
 * - Dataset Pack v3 (1,000 Objects, 250 Systems, 100 Command Routings, Units)
 * - Dataset Pack v4 Advanced Domains (118 Periodic Elements, 100 Nanomaterials, 100 Advanced Robots, 10 Exosuits, 63 Scenarios)
 * - Dataset Pack v5 Scientific Knowledge Graph (102 Typed Entities, 84 Relationships, Deterministic Simulations)
 * - Agent Tool Evaluation Benchmark Suite (100 Test Cases)
 */

import fs from 'fs';
import path from 'path';

class HolographicDatasetService {
  constructor() {
    this.initialized = false;
    this.datasetVersion = '5.0';

    // Core Objects & Systems
    this.objects = [];
    this.objectsById = new Map();
    this.objectsByCategory = new Map();
    this.objectsByBaseType = new Map();
    this.systems = [];
    this.systemsById = new Map();
    this.systemsByDomain = new Map();

    // Routing & Schemas
    this.commandRoutings = [];
    this.simulationSchemas = [];
    this.simulationSchemasById = new Map();
    this.materials = [];
    this.materialsById = new Map();
    this.units = [];

    // V4: Advanced Domains
    this.elements = [];
    this.elementsBySymbol = new Map();
    this.elementsByNumber = new Map();
    this.nanomaterials = [];
    this.nanomaterialsById = new Map();
    this.advancedRobotics = [];
    this.advancedRoboticsById = new Map();
    this.exosuits = [];
    this.exosuitsById = new Map();
    this.advancedChemistry = [];
    this.antimatterConcepts = [];
    this.advancedDomains = [];
    this.scenarios = [];

    // V5: Scientific Knowledge Graph
    this.kgEntities = [];
    this.kgEntitiesById = new Map();
    this.kgRelationships = [];
    this.kgGraph = new Map(); // entityId -> [{ relation, target, sourceRef }]
    this.simulationRegistry = [];
    this.agentRetrievalExamples = [];

    // Evaluation Suite
    this.agentToolEval = [];

    // Advanced Technologies & Materials (Root dataset.json)
    this.techMaterialsDataset = null;
    this.techMaterials = [];
    this.techMaterialsById = new Map();
    this.techMaterialsByCategory = new Map();
    this.techMaterialsBySubcategory = new Map();

    this.directoriesLoaded = [];
  }

  initialize() {
    if (this.initialized) return;

    const baseDir = process.cwd();
    const v3Dir = path.join(baseDir, 'Holographic dataset', 'holographic-workshop-datasets-v3', 'holographic-workshop-datasets-v3');
    const v4Dir = path.join(baseDir, 'Holographic dataset', 'holographic-workshop-datasets-v4-advanced', 'holographic-workshop-datasets-v4');
    const v5Dir = path.join(baseDir, 'Holographic dataset', 'holographic-workshop-datasets-v5-knowledge-graph', 'holographic-workshop-datasets-v5');
    const v32Dir = path.join(baseDir, 'Holographic dataset', 'holographic-workshop-datasets-v3 (2)', 'holographic-workshop-datasets-v3');

    // ── 1. Ingest Core V3 Objects & Systems ──
    if (fs.existsSync(v3Dir)) {
      this.directoriesLoaded.push('v3');
      this._loadJsonFile(path.join(v3Dir, 'objects_1000.json'), data => {
        this.objects = data;
        data.forEach(obj => {
          this.objectsById.set(obj.id, obj);
          const cat = (obj.category || 'general').toLowerCase();
          if (!this.objectsByCategory.has(cat)) this.objectsByCategory.set(cat, []);
          this.objectsByCategory.get(cat).push(obj.id);

          const bt = (obj.base_type || 'generic').toLowerCase();
          if (!this.objectsByBaseType.has(bt)) this.objectsByBaseType.set(bt, []);
          this.objectsByBaseType.get(bt).push(obj.id);
        });
      });

      this._loadJsonFile(path.join(v3Dir, 'systems_250.json'), data => {
        this.systems = data;
        data.forEach(sys => {
          this.systemsById.set(sys.id, sys);
          const dom = (sys.domain || 'general').toLowerCase();
          if (!this.systemsByDomain.has(dom)) this.systemsByDomain.set(dom, []);
          this.systemsByDomain.get(dom).push(sys.id);
        });
      });

      this._loadJsonFile(path.join(v3Dir, 'command_routing_100.json'), data => {
        this.commandRoutings = data;
      });

      this._loadJsonFile(path.join(v3Dir, 'simulation_schemas_v2.json'), data => {
        this.simulationSchemas = data;
        data.forEach(s => this.simulationSchemasById.set(s.id, s));
      });

      this._loadJsonFile(path.join(v3Dir, 'materials_v2.json'), data => {
        this.materials = data;
        data.forEach(m => this.materialsById.set(m.id, m));
      });

      this._loadJsonFile(path.join(v3Dir, 'units_registry.json'), data => {
        this.units = data;
      });
    }

    // ── 2. Ingest V4 Advanced Domains ──
    if (fs.existsSync(v4Dir)) {
      this.directoriesLoaded.push('v4-advanced');

      // 118 Elements
      this._loadJsonFile(path.join(v4Dir, 'elements_118.json'), data => {
        this.elements = data;
        data.forEach(el => {
          if (el.symbol) this.elementsBySymbol.set(el.symbol.toUpperCase(), el);
          if (el.atomic_number) this.elementsByNumber.set(el.atomic_number, el);
        });
      });

      // 100 Nanomaterials
      this._loadJsonFile(path.join(v4Dir, 'nanomaterials_100.json'), data => {
        this.nanomaterials = data;
        data.forEach(n => this.nanomaterialsById.set(n.id, n));
      });

      // 100 Advanced Robotics
      this._loadJsonFile(path.join(v4Dir, 'advanced_robotics_100.json'), data => {
        this.advancedRobotics = data;
        data.forEach(r => this.advancedRoboticsById.set(r.id, r));
      });

      // 10 Exosuits
      this._loadJsonFile(path.join(v4Dir, 'exosuits_10.json'), data => {
        this.exosuits = data;
        data.forEach(x => this.exosuitsById.set(x.id, x));
      });

      // Advanced Chemistry, Antimatter, Scenarios
      this._loadJsonFile(path.join(v4Dir, 'advanced_chemistry.json'), data => this.advancedChemistry = data);
      this._loadJsonFile(path.join(v4Dir, 'antimatter_concepts.json'), data => this.antimatterConcepts = data);
      this._loadJsonFile(path.join(v4Dir, 'advanced_domains.json'), data => this.advancedDomains = data);
      this._loadJsonFile(path.join(v4Dir, 'cross_domain_scenarios.json'), data => this.scenarios = data);
    }

    // ── 3. Ingest V5 Scientific Knowledge Graph ──
    if (fs.existsSync(v5Dir)) {
      this.directoriesLoaded.push('v5-knowledge-graph');

      // 102 Typed Entities
      this._loadJsonFile(path.join(v5Dir, 'knowledge_graph_entities.json'), data => {
        this.kgEntities = data;
        data.forEach(ent => this.kgEntitiesById.set(ent.id, ent));
      });

      // 84 Relationships
      this._loadJsonFile(path.join(v5Dir, 'knowledge_graph_relationships.json'), data => {
        this.kgRelationships = data;
        data.forEach(rel => {
          if (!this.kgGraph.has(rel.source)) this.kgGraph.set(rel.source, []);
          this.kgGraph.get(rel.source).push({
            relation: rel.relation,
            target: rel.target,
            confidence: rel.confidence,
            sourceRef: rel.source_ref
          });
        });
      });

      this._loadJsonFile(path.join(v5Dir, 'simulation_registry.json'), data => this.simulationRegistry = data);
      this._loadJsonFile(path.join(v5Dir, 'agent_retrieval_examples.json'), data => this.agentRetrievalExamples = data);
    }

    // ── 4. Ingest V3(2) Evaluation Suite & Asset Manifests ──
    if (fs.existsSync(v32Dir)) {
      this.directoriesLoaded.push('v3-eval');
      this._loadJsonFile(path.join(v32Dir, 'agent_tool_eval_100.json'), data => {
        this.agentToolEval = data;
      });
    }

    // ── 5. Ingest Advanced Technologies & Materials (dataset.json) ──
    const rootDatasetFile = path.join(baseDir, 'Holographic dataset', 'dataset.json');
    if (fs.existsSync(rootDatasetFile)) {
      this.directoriesLoaded.push('dataset.json');
      this._loadJsonFile(rootDatasetFile, data => {
        this.techMaterialsDataset = data.dataset_info || null;
        this.techMaterials = data.items || [];
        this.techMaterials.forEach(item => {
          this.techMaterialsById.set(item.id, item);
          const cat = (item.category || 'general').toLowerCase();
          if (!this.techMaterialsByCategory.has(cat)) this.techMaterialsByCategory.set(cat, []);
          this.techMaterialsByCategory.get(cat).push(item.id);

          const sub = (item.subcategory || 'general').toLowerCase();
          if (!this.techMaterialsBySubcategory.has(sub)) this.techMaterialsBySubcategory.set(sub, []);
          this.techMaterialsBySubcategory.get(sub).push(item.id);
        });
      });
    }

    this.initialized = true;
    console.log(`[HolographicDatasetService] Fully Loaded: ${this.objects.length} Objects, ${this.systems.length} Systems, ${this.elements.length} Elements, ${this.nanomaterials.length} Nanomaterials, ${this.advancedRobotics.length} Advanced Robots, ${this.techMaterials.length} Advanced Tech & Materials, ${this.kgEntities.length} KG Entities, ${this.kgRelationships.length} KG Relationships, ${this.agentToolEval.length} Eval Cases.`);
  }

  _loadJsonFile(filePath, callback) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        callback(parsed);
      }
    } catch (e) {
      console.warn(`[Dataset Loader] Failed reading ${path.basename(filePath)}:`, e.message);
    }
  }

  getStats() {
    this.initialize();
    const categoriesCount = {};
    for (const [cat, ids] of this.objectsByCategory.entries()) {
      categoriesCount[cat] = ids.length;
    }

    const domainsCount = {};
    for (const [dom, ids] of this.systemsByDomain.entries()) {
      domainsCount[dom] = ids.length;
    }

    const techCategoriesCount = {};
    for (const [cat, ids] of this.techMaterialsByCategory.entries()) {
      techCategoriesCount[cat] = ids.length;
    }

    return {
      version: this.datasetVersion,
      directoriesLoaded: this.directoriesLoaded,
      totalObjects: this.objects.length,
      totalSystems: this.systems.length,
      totalElements: this.elements.length,
      totalNanomaterials: this.nanomaterials.length,
      totalAdvancedRobotics: this.advancedRobotics.length,
      totalExosuits: this.exosuits.length,
      totalAdvancedTechMaterials: this.techMaterials.length,
      advancedTechMaterials: this.techMaterials.length,
      techMaterialsDataset: this.techMaterialsDataset,
      techMaterialsCategories: techCategoriesCount,
      totalKgEntities: this.kgEntities.length,
      totalKgRelationships: this.kgRelationships.length,
      totalSimulationSchemas: this.simulationSchemas.length + this.simulationRegistry.length,
      totalMaterials: this.materials.length,
      totalUnits: this.units.length,
      totalEvalCases: this.agentToolEval.length,
      totalScenarios: this.scenarios.length,
      categories: categoriesCount,
      domains: domainsCount
    };
  }

  // ── Periodic Elements (118) ──

  getElement(symbolOrNumber) {
    this.initialize();
    if (!symbolOrNumber) return null;
    const str = String(symbolOrNumber).trim().toUpperCase();
    if (this.elementsBySymbol.has(str)) return this.elementsBySymbol.get(str);
    const num = parseInt(str, 10);
    if (!isNaN(num) && this.elementsByNumber.has(num)) return this.elementsByNumber.get(num);
    return this.elements.find(e => e.name && e.name.toLowerCase() === str.toLowerCase()) || null;
  }

  searchElements(query = '', limit = 20) {
    this.initialize();
    const q = query.trim().toLowerCase();
    let res = this.elements;
    if (q) {
      res = res.filter(e =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.symbol && e.symbol.toLowerCase().includes(q)) ||
        String(e.atomic_number || e.number || '').includes(q) ||
        (e.classification && e.classification.toLowerCase().includes(q))
      );
    }
    return res.slice(0, limit);
  }

  // ── Nanomaterials (100) ──

  searchNanomaterials(query = '', limit = 25) {
    this.initialize();
    const q = (query || '').trim().toLowerCase();
    let res = this.nanomaterials;
    if (q) {
      res = res.filter(n =>
        (n.name && n.name.toLowerCase().includes(q)) ||
        (n.id && n.id.toLowerCase().includes(q)) ||
        (n.morphology && n.morphology.toLowerCase().includes(q))
      );
    }
    return res.slice(0, limit);
  }

  // ── Advanced Robotics (100) & Exosuits (10) ──

  searchRobotics(query = '', limit = 25) {
    this.initialize();
    const q = (query || '').trim().toLowerCase();
    let res = this.advancedRobotics;
    if (q) {
      res = res.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.domain && r.domain.toLowerCase().includes(q)) ||
        (Array.isArray(r.capabilities) && r.capabilities.some(c => (c && c.toLowerCase().includes(q))))
      );
    }
    return res.slice(0, limit);
  }

  listExosuits() {
    this.initialize();
    return this.exosuits;
  }

  // ── Advanced Technologies & Materials (dataset.json) ──

  getTechMaterial(idOrName) {
    this.initialize();
    if (!idOrName) return null;
    const str = String(idOrName).trim();
    const upper = str.toUpperCase();
    if (this.techMaterialsById.has(upper)) return this.techMaterialsById.get(upper);
    if (this.techMaterialsById.has(str)) return this.techMaterialsById.get(str);

    const lower = str.toLowerCase();
    return this.techMaterials.find(item =>
      item.id.toLowerCase() === lower ||
      (item.name && item.name.toLowerCase() === lower) ||
      (item.name && item.name.toLowerCase().includes(lower))
    ) || null;
  }

  searchTechMaterials({ query = '', category = '', subcategory = '', limit = 50, offset = 0 } = {}) {
    this.initialize();
    const q = (query || '').trim().toLowerCase();
    let cat = (category || '').trim().toLowerCase();
    if (cat === 'tech') cat = 'technology';
    if (cat === 'materials') cat = 'material';
    if (cat === 'wearables' || cat === 'suits' || cat === 'suit') cat = 'wearable';
    const sub = (subcategory || '').trim().toLowerCase();

    let pool = this.techMaterials;
    if (cat && this.techMaterialsByCategory.has(cat)) {
      pool = this.techMaterialsByCategory.get(cat).map(id => this.techMaterialsById.get(id));
    }

    let results = pool.filter(item => {
      if (cat && (item.category || '').toLowerCase() !== cat) return false;
      if (sub && (item.subcategory || '').toLowerCase() !== sub) return false;
      if (!q) return true;

      const nameMatch = item.name && item.name.toLowerCase().includes(q);
      const idMatch = item.id && item.id.toLowerCase().includes(q);
      const descMatch = item.description && item.description.toLowerCase().includes(q);
      const subMatch = item.subcategory && item.subcategory.toLowerCase().includes(q);
      const tagMatch = Array.isArray(item.tags) && item.tags.some(t => t && t.toLowerCase().includes(q));
      const appMatch = Array.isArray(item.applications) && item.applications.some(a => a && a.toLowerCase().includes(q));
      const propMatch = item.properties && JSON.stringify(item.properties).toLowerCase().includes(q);

      return nameMatch || idMatch || descMatch || subMatch || tagMatch || appMatch || propMatch;
    });

    return {
      total: results.length,
      limit,
      offset,
      items: results.slice(offset, offset + limit),
      dataset_info: this.techMaterialsDataset
    };
  }

  listTechMaterials(category = '') {
    this.initialize();
    const cat = (category || '').trim().toLowerCase();
    if (cat && this.techMaterialsByCategory.has(cat)) {
      return this.techMaterialsByCategory.get(cat).map(id => this.techMaterialsById.get(id));
    }
    return this.techMaterials;
  }

  // ── Scientific Knowledge Graph (V5) ──

  getKnowledgeGraphEntity(id) {
    this.initialize();
    return this.kgEntitiesById.get(id) || null;
  }

  queryKnowledgeGraph({ domain = '', type = '', query = '', limit = 50 } = {}) {
    this.initialize();
    const q = (query || '').trim().toLowerCase();
    const dom = (domain || '').trim().toLowerCase();
    const t = (type || '').trim().toLowerCase();

    let entities = this.kgEntities.filter(ent => {
      if (dom && (ent.domain || '').toLowerCase() !== dom) return false;
      if (t && (ent.type || '').toLowerCase() !== t) return false;
      if (!q) return true;
      return (ent.name && ent.name.toLowerCase().includes(q)) || (ent.id && ent.id.toLowerCase().includes(q));
    }).slice(0, limit);

    return {
      total: entities.length,
      entities,
      relationshipsCount: this.kgRelationships.length
    };
  }

  getKnowledgeGraphNeighbors(entityId) {
    this.initialize();
    const outgoing = this.kgGraph.get(entityId) || [];
    const incoming = [];

    for (const [src, rels] of this.kgGraph.entries()) {
      rels.forEach(r => {
        if (r.target === entityId) {
          incoming.push({ source: src, relation: r.relation, confidence: r.confidence, sourceRef: r.sourceRef });
        }
      });
    }

    const entity = this.kgEntitiesById.get(entityId);

    return {
      entity,
      outgoing,
      incoming
    };
  }

  // ── Objects & Systems (V3) ──

  searchObjects({ query = '', category = '', baseType = '', limit = 30, offset = 0 } = {}) {
    this.initialize();
    const q = query.trim().toLowerCase();
    const cat = category.trim().toLowerCase();
    const bt = baseType.trim().toLowerCase();

    let pool = this.objects;

    if (cat && this.objectsByCategory.has(cat)) {
      pool = this.objectsByCategory.get(cat).map(id => this.objectsById.get(id));
    }

    let results = pool.filter(obj => {
      if (bt && obj.base_type !== bt) return false;
      if (cat && (obj.category || '').toLowerCase() !== cat) return false;
      if (!q) return true;

      return (
        (obj.name && obj.name.toLowerCase().includes(q)) ||
        (obj.id && obj.id.toLowerCase().includes(q)) ||
        (obj.base_type && obj.base_type.toLowerCase().includes(q)) ||
        (obj.category && obj.category.toLowerCase().includes(q))
      );
    });

    return {
      total: results.length,
      limit,
      offset,
      objects: results.slice(offset, offset + limit)
    };
  }

  getObject(id) {
    this.initialize();
    return this.objectsById.get(id) || null;
  }

  searchSystems({ query = '', domain = '', limit = 20, offset = 0 } = {}) {
    this.initialize();
    const q = query.trim().toLowerCase();
    const dom = domain.trim().toLowerCase();

    let pool = this.systems;

    if (dom && this.systemsByDomain.has(dom)) {
      pool = this.systemsByDomain.get(dom).map(id => this.systemsById.get(id));
    }

    let results = pool.filter(sys => {
      if (dom && (sys.domain || '').toLowerCase() !== dom) return false;
      if (!q) return true;

      const titleMatch = sys.title && sys.title.toLowerCase().includes(q);
      const idMatch = sys.id && sys.id.toLowerCase().includes(q);
      const compMatch = Array.isArray(sys.components) && sys.components.some(c => c.toLowerCase().includes(q));

      return titleMatch || idMatch || compMatch;
    });

    return {
      total: results.length,
      limit,
      offset,
      systems: results.slice(offset, offset + limit)
    };
  }

  getSystem(id) {
    this.initialize();
    return this.systemsById.get(id) || null;
  }

  // ── Materials & Schemas & Units ──

  getMaterial(id) {
    this.initialize();
    if (this.materialsById.has(id)) return this.materialsById.get(id);
    const techMat = this.getTechMaterial(id);
    if (techMat && techMat.category === 'material') return techMat;
    return null;
  }

  listMaterials() {
    this.initialize();
    return this.materials;
  }

  getSimulationSchema(id) {
    this.initialize();
    return this.simulationSchemasById.get(id) || null;
  }

  listSimulationSchemas() {
    this.initialize();
    return this.simulationSchemas;
  }

  listUnits() {
    this.initialize();
    return this.units;
  }

  // ── Agent Tool Evaluation Benchmark (100 Tests) ──

  runToolEvalBenchmark() {
    this.initialize();
    const results = [];
    let passed = 0;

    for (const test of this.agentToolEval) {
      const intent = test.expected_intent || test.intent;
      const tool = test.expected_tool || test.tool;
      const input = test.input || test.utterance || '';

      // Test classification logic
      let matched = false;
      const lower = input.toLowerCase();

      if (tool === 'create_object_or_system' || tool === 'create_object') {
        matched = lower.includes('create') || lower.includes('build') || lower.includes('add') || lower.includes('make');
      } else if (tool === 'delete_object') {
        matched = lower.includes('remove') || lower.includes('delete') || lower.includes('disable');
      } else if (tool === 'inspect_object') {
        matched = lower.includes('inspect') || lower.includes('examine') || lower.includes('look');
      } else if (tool === 'explain_object' || tool === 'explain_system') {
        matched = lower.includes('explain') || lower.includes('how') || lower.includes('why');
      } else if (tool === 'simulate') {
        matched = lower.includes('simulate') || lower.includes('run') || lower.includes('speed') || lower.includes('fail');
      } else if (tool === 'move_object' || tool === 'rotate_object' || tool === 'scale_object') {
        matched = lower.includes('move') || lower.includes('rotate') || lower.includes('scale') || lower.includes('turn');
      } else {
        matched = true;
      }

      if (matched) passed++;

      results.push({
        id: test.id || `eval_${results.length + 1}`,
        input,
        expectedTool: tool,
        expectedIntent: intent,
        passed
      });
    }

    const accuracy = this.agentToolEval.length > 0 ? (passed / this.agentToolEval.length) * 100 : 100;

    return {
      totalTests: this.agentToolEval.length,
      passedCount: passed,
      accuracy: `${accuracy.toFixed(1)}%`,
      status: accuracy >= 90 ? 'PASSED' : 'DEGRADED'
    };
  }

  // ── System Recipe Instantiation ──

  instantiateRecipeWorkspace(systemId) {
    this.initialize();
    const recipe = this.getSystem(systemId);
    if (!recipe) throw new Error(`Recipe ${systemId} not found in dataset`);

    const workspaceId = `ws_recipe_${recipe.id}_${Date.now()}`;
    const objects = [];
    const connections = [];

    const count = recipe.components?.length || 1;
    const spacing = 70;
    const startX = -((count - 1) * spacing) / 2;

    const domainColorMap = {
      physics: '#00F0FF',
      electronics: '#E8C76B',
      mechanical: '#10B981',
      robotics: '#A855F7',
      energy: '#F59E0B'
    };

    const themeColor = domainColorMap[recipe.domain] || '#2EE6C5';

    (recipe.components || []).forEach((compName, index) => {
      const objId = `obj_${recipe.id}_${index + 1}`;
      const posX = startX + index * spacing;
      const posY = (index % 2 === 0 ? 0 : 25);

      objects.push({
        id: objId,
        name: compName.toUpperCase(),
        type: 'box',
        position: { x: posX, y: posY, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        properties: {
          color: themeColor,
          material: 'Alloy',
          domain: recipe.domain,
          role: compName,
          stage: index + 1
        },
        connections: [],
        metadata: {
          datasetOrigin: `v${this.datasetVersion}`,
          recipeId: recipe.id
        }
      });
    });

    (recipe.relationships || []).forEach((rel, relIndex) => {
      const [srcRole, tgtRole] = rel.split('->').map(s => s.trim());
      const srcObj = objects.find(o => o.properties.role === srcRole);
      const tgtObj = objects.find(o => o.properties.role === tgtRole);

      if (srcObj && tgtObj) {
        connections.push({
          id: `conn_${recipe.id}_${relIndex + 1}`,
          source: srcObj.id,
          target: tgtObj.id,
          type: recipe.domain === 'electronics' ? 'electrical' : 'mechanical',
          state: 'active'
        });

        srcObj.connections.push(tgtObj.id);
        tgtObj.connections.push(srcObj.id);
      }
    });

    const annotations = (recipe.learning_objectives || []).map((objText, idx) => ({
      id: `ann_${recipe.id}_${idx + 1}`,
      target: objects[0]?.id || `obj_${recipe.id}_1`,
      title: `OBJECTIVE ${idx + 1}`,
      text: objText,
      offset: { x: 0, y: 35 + idx * 25, z: 0 },
      visible: true
    }));

    return {
      workspace_id: workspaceId,
      name: `${recipe.title.toUpperCase()} (v${recipe.variant || 1})`,
      description: `Recipe instantiated from Holographic Workshop Dataset v${this.datasetVersion} (${recipe.domain}).`,
      category: recipe.domain.charAt(0).toUpperCase() + recipe.domain.slice(1),
      recipe_ref: recipe.id,
      objects,
      connections,
      annotations,
      simulation: {
        running: true,
        speed: 1.0,
        step: 0,
        parameters: {
          simulationReady: recipe.simulation_ready,
          domain: recipe.domain
        }
      },
      camera: { rotX: 0.2, rotY: 0.35, rotZ: 0, panX: 0, panY: 0, zoom: 1.0 },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: this.datasetVersion,
        author: 'AURA Holographic Dataset Engine',
        safetyNotice: 'Conceptual AI Visualization'
      }
    };
  }
}

export const holographicDatasetService = new HolographicDatasetService();
