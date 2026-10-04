# AURA HOLOGRAPHIC WORKSHOP — Product & Technical Specification
**Master PRD (Product Requirements) + FRD (Functional Requirements) + TRD (Technical Requirements)**  
**Document Version:** 2.0  
**Status:** Implemented & Production-Ready  
**System:** AURA Unified Intelligence Platform  

---

## 1. Executive Summary & Core Concept

The **AURA Holographic Workshop** is the real-time 3D spatial intelligence and hologram projection studio for the AURA unified intelligence platform. It bridges the gap between abstract agent orchestration and human spatial perception, projecting the multi-agent neural topology, 4D computational lattices, and defensive security perimeters into an interactive, volumetric 3D environment.

### 1.1 Core Principles
* **Spatialized Intelligence**: Transforms abstract agent states (FORGE, SENTINEL, RESEARCH, OPS, GOVERNANCE) into an interactive 3D spatial DAG connected by real-time pulsating laser energy conduits.
* **Pure Local-First Rendering**: Zero external CDN runtime dependencies. 100% offline-capable mathematical 3D projection engine running directly on standard HTML5 canvas with sub-millisecond per-frame overhead.
* **Consequential Spatial Interaction**: Operators can select agent nodes directly in 3D holographic space via raycasting to inspect live telemetry (CPU, tasks, latency, clearance) and dispatch real-time actions (`PING`, `DIAGNOSTIC`, `BOOST`, `ISOLATE`).
* **Multi-Sensory Feedback**: Features a zero-dependency Web Audio API sci-fi synthesizer providing dynamic acoustic hums, beam ignition chimes, and scan sweep acoustics synchronized with holographic motion.

---

## 2. Spatial Architecture & Viewport Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TOPBAR: AURA // HOLOGRAPHIC WORKSHOP                                │
│ [ ⬡ PRISM ] AURA OS // HOLOGRAPHIC WORKSHOP | PROJECTION | RENDER | FPS: 60 | [SFX] [MAIN] [⛶] │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│    HOLOGRAM GENERATOR (WEST)  │    3D HOLOGRAPHIC STAGE (CENTER) │   SPATIAL AGENT NEXUS (EAST)  │
│                               │                                  │                               │
│  [ 3D GEOMETRY MATRIX ]       │    [ TOP VOLUMETRIC EMITTER ]    │   [ SELECTED NODE INSPECTOR ] │
│  • Brain Nexus (Neural Core)  │                 ▼                │   • AURA Core (Active, 78%)   │
│  • Tesseract (4D Hypercube)   │           ╭───────────╮          │   • Clearance: OMEGA-1        │
│  • Sentinel Aegis (Shield)    │           │  3D HOLO  │          │   • Load / Tasks / Latency    │
│  • Swarm DAG (Multi-Agent)    │           │ PROJECTION│          │   • [PING] [DIAG] [BOOST]     │
│  • Cyber DNA (Memory Helix)   │           │   STAGE   │          │                               │
│  • Vector Lattice (Embeddings)│           ╰───────────╯          │   [ TOPOLOGY AGENT LIST ]     │
│                               │                 ▲                │   • AURA, FORGE, SENTINEL,    │
│  [ SHADER RENDER MODES ]      │    [ FLOOR PERSPECTIVE GRID ]    │     RESEARCH, OPS, GOVERNANCE │
│  • Volumetric Wireframe       │                                  │                               │
│  • Point Cloud / Particles    │  [ HUD CONTROLS & GIMBAL ]       │   [ 3D WIDGET SPAWNER ]       │
│  • Holo-Mesh Shaded           │  • L-Drag: Orbit | R-Drag: Pan   │   • Scope, Radar, Gauge, Hex  │
│  • Matrix Flux Scan           │  • Wheel: Zoom   | Click: Select │                               │
│                               │  • [AUTO-ORBIT] [RESET CAM]      │   [ AI HOLO SYNTHESIZER ]     │
│  [ SPECTRAL PALETTES & KINEM] │                                  │   • Natural Language Prompt   │
│  • Sliders: Speed, Scale,     │                                  │   • [✦ SYNTHESIZE]            │
│    Particles, Bloom, Beam     │                                  │                               │
├───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┤
│                             BOTTOM BAR: PRESETS & CONTEXT TICKER                                 │
│ PRESETS: [AURA Master] [Sentinel Aegis] [Forge Reactor] [Vector Lab] | [SNAPSHOT PNG] [EXPORT]  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mathematical 3D Projection Engine

The rendering pipeline in `public/workshop.js` executes 3D vector transformations without external graphics libraries:

### 3.1 Kinematics & Euler Rotation
Given a 3D vertex $v = (x, y, z)^T$:
1. **Yaw (Y-axis rotation)** by angle $\theta_y$:
   $$x' = x \cos \theta_y + z \sin \theta_y, \quad y' = y, \quad z' = -x \sin \theta_y + z \cos \theta_y$$
2. **Pitch (X-axis rotation)** by angle $\theta_x$:
   $$x'' = x', \quad y'' = y' \cos \theta_x - z' \sin \theta_x, \quad z'' = y' \sin \theta_x + z' \cos \theta_x$$
3. **Roll (Z-axis rotation)** by angle $\theta_z$:
   $$x''' = x'' \cos \theta_z - y'' \sin \theta_z, \quad y''' = x'' \sin \theta_z + y'' \cos \theta_z, \quad z''' = z''$$

### 3.2 Perspective Projection & Depth Attenuation
With focal distance $f = 500$ and camera distance $d_{\text{cam}}$:
$$z_{\text{eff}} = z''' + \frac{d_{\text{cam}}}{\text{zoom}}$$
$$\text{scale} = \frac{f}{z_{\text{eff}}}$$
$$X_{\text{screen}} = \frac{\text{width}}{2} + \text{pan}_x + x''' \cdot \text{scale} \cdot \text{modelScale}$$
$$Y_{\text{screen}} = \frac{\text{height}}{2} + \text{pan}_y - y''' \cdot \text{scale} \cdot \text{modelScale}$$

Depth attenuation factor for holographic atmospheric fading:
$$\alpha_{\text{depth}} = \text{clamp}\left(\frac{z''' + 250}{450}, 0.12, 0.95\right)$$

### 3.3 4D Hypercube (Tesseract) Stereographic Projection
For 4D coordinates $(x, y, z, w)$ rotated in 4D $XW$ and $ZW$ planes with rotation angle $\alpha_{4D}$:
$$x_{4D}' = x \cos \alpha_{4D} - w \sin \alpha_{4D}, \quad w_{4D}' = x \sin \alpha_{4D} + w \cos \alpha_{4D}$$
Stereographic projection to 3D space with 4D viewing distance $D_{4D} = 240$:
$$\text{factor} = \frac{D_{4D}}{D_{4D} - w_{4D}'}$$
$$(x_{3D}, y_{3D}, z_{3D}) = (x_{4D}' \cdot \text{factor}, y \cdot \text{factor}, z_{4D}' \cdot \text{factor})$$

---

## 4. Multi-Agent Spatial Topology & Conduits

The workshop visualizes the live architecture of the AURA Unified Intelligence Platform:

| Node ID | Agent Identity | Spatial Coord $(x,y,z)$ | Security Clearance | Role & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| `aura-core` | **AURA Core** | $(0, 0, 0)$ | `OMEGA-1` | Central brain orchestrating goals, context, and delegates |
| `forge` | **FORGE Specialist** | $(-160, 60, 40)$ | `POLICY_CONTROLLED` | Software engineering, code generation, testing, git ops |
| `sentinel` | **SENTINEL Guardian** | $(160, 60, -40)$ | `INDEPENDENT_AUDIT` | Defensive security, zero-trust attestation, SAST, CVEs |
| `research` | **RESEARCH Enclave** | $(130, -80, 80)$ | `SAFE_READ` | Knowledge retrieval, web research, vector memory queries |
| `automation`| **OPS Automation** | $(-130, -80, -80)$ | `STRICT_APPROVAL` | Infrastructure, container runtimes, deployment pipelines |
| `governance`| **Governance Broker** | $(0, 130, 0)$ | `ZERO_TRUST` | Separates AI intelligence from tool execution authority |

### 4.1 Laser Conduits & Pulse Packets
Nodes are linked via directional laser conduits (`FORGE_RPC_STREAM`, `SENTINEL_ATTESTATION`, `KNOWLEDGE_SYNAPSE`, `OPS_DISPATCH`, `POLICY_ENCLAVE_BUS`, and `INDEPENDENT_VERIFICATION`).
Packets travel across the 3D projected vectors at speeds determined by real-time agent throughput.

---

## 5. REST API Specifications

The backend service in `core/workshop/holographicWorkshopEngine.js` exposes the following endpoints via `server.js`:

### 5.1 Endpoints Summary

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/workshop/state` | Returns complete workshop state, active model, nodes, conduits, presets, and system telemetry |
| `GET` | `/api/workshop/telemetry` | Lightweight real-time telemetry stream for nodes (load, tasks, latency) and conduits |
| `GET` | `/api/workshop/presets` | Retrieves available holographic scene presets |
| `POST` | `/api/workshop/presets` | Persists a new or modified custom holographic preset |
| `POST` | `/api/workshop/dispatch` | Dispatches an interactive command (`PING`, `DIAGNOSTIC`, `BOOST`, `ISOLATE`) to a node |
| `POST` | `/api/workshop/synthesize`| AI-assisted natural language hologram synthesizer |

---

## 6. Verification & Navigation

* **Direct URL**: `http://localhost:3000/workshop` (or `http://localhost:3000/workshop.html`)
* **Main HUD Integration**: The AURA top navigation bar contains the dedicated `[ ⬡ HOLO WORKSHOP ]` button with purple pulse indicator.
* **Keyboard Shortcut**: Press `Cmd+H` (macOS) or `Ctrl+H` (Linux/Windows) from any view to immediately launch the Holographic Workshop studio.
