# Holographic Workshop Dataset Pack V5 — Scientific Knowledge Graph

V5 changes the database architecture from flat datasets to a typed knowledge graph.

## Core files
- knowledge_graph_entities.json — typed entities across chemistry, materials, nanotechnology, robotics, particle physics and advanced domains
- knowledge_graph_relationships.json — typed relationships connecting elements, materials, concepts, robots and particles
- knowledge_graph_edges.csv — graph edge index
- simulation_registry.json — deterministic simulation registry
- provenance_schema.json — source/version/license/confidence requirements
- agent_retrieval_examples.json — example retrieval + visualization routes

## Source grounding
The element/reference model is designed to point to IUPAC's periodic-table resources. IUPAC identifies its current periodic table release and provides an education-focused elements/isotopes resource.

Nanomaterial records are designed to link to NIST nanomaterials/metrology resources rather than treating generated properties as authoritative.

## Architecture
User -> Aura -> Workshop Agent -> Retriever -> Knowledge Graph -> Planner -> Validator -> Renderer/Simulation

## Critical rule
Do not let the language model invent scientific constants or equations. Retrieve structured records, validate units/ranges, and execute deterministic simulation code.

## Safety
High-risk chemistry, biological engineering, weaponization, and hazardous experimental procedures are intentionally excluded. Antimatter and advanced physics are represented as conceptual educational entities, not operational procedures.
