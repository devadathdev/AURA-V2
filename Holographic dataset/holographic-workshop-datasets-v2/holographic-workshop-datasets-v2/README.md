# Holographic Workshop Dataset Pack V2

This expansion is designed to move the Workshop Agent from a demo catalog toward a reusable agent dataset.

Contents:
- objects_300.json — 300 conceptual 3D object/component records
- objects_index.csv — tabular object index
- systems_100.json — 100 reusable educational/system recipes
- materials.json — starter conceptual material properties
- units.json — unit/dimension registry
- action_training_examples.json — natural-language command examples mapped to tools
- simulation_schemas.json — safe starter equations and input/output schemas

Recommended ingestion:
1. Index object/system descriptions for retrieval.
2. Keep simulation schemas structured and deterministic.
3. Use action examples for intent/tool-routing evaluation.
4. Keep 3D assets referenced by stable IDs.
5. Add licensing/provenance fields before importing external assets.

Safety:
These records are conceptual starter data. Material properties and simulations are not engineering certification or safety validation.
