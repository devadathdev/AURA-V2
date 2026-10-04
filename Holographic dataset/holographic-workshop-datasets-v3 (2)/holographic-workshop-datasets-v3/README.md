# Holographic Workshop Dataset Pack V3

Expansion for the standalone Holographic Workshop Agent.

## Included
- objects_1000.json — 1,000 conceptual object/component records
- objects_index.csv — searchable tabular object index
- systems_250.json — 250 reusable system/learning recipes
- materials.json — starter conceptual material properties
- units.json — unit/dimension registry
- simulation_schemas.json — deterministic starter equations and schemas
- agent_tool_eval_100.json — 100 routing/tool-call evaluation examples
- asset_manifest_1000.json — 3D asset registry with provenance/licensing gates

## 3D asset policy
This pack intentionally contains metadata, not third-party 3D binaries. External assets should only be imported after provenance and license fields are verified. Procedural or user-supplied assets can be attached to the stable asset IDs.

## Recommended ingestion
1. Index object/system descriptions for retrieval.
2. Keep simulation schemas structured and execute them deterministically.
3. Use the evaluation set for routing regression tests.
4. Resolve asset IDs to actual GLB/glTF files in a separate asset store.
5. Add provenance and license verification before distribution.

## Safety
The dataset is conceptual/educational starter data. It is not engineering certification, medical guidance, or a validated physics/engineering solver.
