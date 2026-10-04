# AURA COMMAND MAP — Product Feature Specification
**Master PRD (Product Requirements) + FRD (Functional Requirements) + TRD (Technical Requirements)**  
**Document Version:** 2.0  
**Status:** Approved Master Architecture & Implementation Blueprint  
**System:** AURA Unified Intelligence Platform  

---

## 1. Executive Summary & Core Concept

**AURA Command Map** is the centralized real-time intelligence interface for the AURA personal AI assistant. It provides the human operator with an instantaneous, transparent understanding of:
* **What AURA is currently doing** (live execution state and background workloads).
* **What AURA has detected** (events, file changes, system anomalies, and pattern observations).
* **What requires attention** (blockers, critical warnings, pending approvals, and errors).
* **What AURA recommends** (the single optimal next action with rationale, impact, effort, and risk).
* **What action AURA is preparing to take** (pre-staged files, relevant error logs, and predictive workspace context).

### 1.1 Shift from Standalone Silos to Background Intelligence
Previously conceived subsystems—**Context Vault**, **Goal Engine**, **Event Trigger**, **Decision Center**, **Skill Matrix**, and **Shadow Mode**—do not exist as fragmented, disconnected UI pages. Instead, they operate as unified **Background Intelligence Services** feeding continuous intelligence into the central **AURA Orchestrator**, which projects synthesized real-time state directly onto the **Command Map**.

---

## 2. Core Experience & Spatial Architecture

The Command Map spatial architecture is anchored around **Aura Core at the center**, surrounded by four cardinal intelligence sectors:

```
                            [ NORTH ]
                       CURRENT ACTIVITY
            (Real-Time Consequential Event Stream)
                             ▲
                             │
     [ WEST ]                │                [ EAST ]
    ATTENTION        ┌───────────────┐      NEXT ACTION
(High-Signal Warnings│   AURA CORE   │(Top Recommended Action
 & Critical Blockers)│(State, Project│ with Impact, Effort,
         ◄───────────┤Goal,Progress, ├───────────►
                     │  Confidence)  │ Risk & 4-Way Controls)
                     └───────┬───────┘
                             │
                             ▼
                      AI PREPARATION
        (Predictive Staging of Files, Logs, Context)
                            [ SOUTH ]
```

### 2.1 Aura Core (Central Focal Point)
Aura Core occupies the center of the visual canvas and command console, displaying:
1. **Current Operational State**: `IDLE` | `ANALYZING` | `PLANNING` | `DELEGATING` | `EXECUTING` | `VERIFYING` | `BLOCKED`.
2. **Active Project**: Scoped project workspace (e.g. `Aura Assistant`).
3. **Current Active Goal**: The high-level milestone currently targeted (e.g. `Complete Intelligence Layer`).
4. **Progress Bar / Metric**: Quantitative completion percentage (e.g. `68%`).
5. **Confidence Rating**: Algorithmic certainty score of current analysis (e.g. `94%`).

### 2.2 The Four Cardinal Sectors

#### Sector 1: Current Activity (North)
* **Purpose**: Real-time event stream tracking consequential operations across AURA and its sub-agents.
* **Streamed Event Types**:
  * Project source files being modified or created.
  * Tasks and subtasks being marked completed.
  * Goals and milestones being updated or rescheduled.
  * Dependencies being installed, updated, or audited.
  * Agent heartbeats (FORGE, SENTINEL, OPS, RESEARCH).

#### Sector 2: Attention Center (West)
* **Purpose**: High-signal, noise-filtered anomaly center displaying exclusively items requiring human awareness or authorization.
* **Filtering Rule**: Irrelevant, informational, or outdated notifications automatically disappear. Only actionable signals persist.
* **Content**:
  * Critical problems, runtime crashes, and build failures.
  * Blockers halting the Goal Engine DAG (e.g. *"Two unresolved dependency issues"*).
  * Consequential actions requiring approval (PR-07 Human Authority).
  * High-severity security vulnerabilities or drift.

#### Sector 3: Next Action (East)
* **Purpose**: Surfaces the **single most useful action** AURA recommends taking right now.
* **Insight Synthesis**:
  * **Why Selected**: Specific causal rationale tied to active goals and current blockers.
  * **Expected Impact**: Outcome on project progress or stability.
  * **Estimated Effort**: Expected duration and compute resource requirement.
  * **Risk Assessment**: Potential side-effects and reversibility rating.
* **The 4-Way User Action Model**:
  * **[ Open ]**: Deep-dive into action details, diffs, or affected files.
  * **[ Execute ]**: Authorize and trigger immediate execution through Governance.
  * **[ Dismiss ]**: Discard this recommendation and instruct AURA to evaluate alternatives.
  * **[ Explain ]**: Request natural language breakdown of the underlying reasoning.

#### Sector 4: AI Preparation / Shadow Staging (South)
* **Purpose**: Displays what AURA has pre-staged for the user based on workflow prediction.
* **Workflow Prediction Examples**:
  * If AURA predicts the user is about to debug a failed build: pre-fetches failing test logs, highlights modified lines in the source file, retrieves related documentation, and loads past conversation context.
  * If AURA predicts deployment: pre-validates environment secrets and runs dry-run dependency checks.

---

## 3. Background Intelligence Services

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKGROUND INTELLIGENCE SERVICES                   │
├───────────────────┬───────────────────┬─────────────────────────────────┤
│   CONTEXT VAULT   │    GOAL ENGINE    │          EVENT TRIGGER          │
│ Persistent Scoped │ Objectives → DAGs │ File, Task, Schedule & Webhook  │
│ Semantic Retrieval│ Milestone Progress│ Condition Filter Pipeline       │
├───────────────────┼───────────────────┼─────────────────────────────────┤
│  DECISION CENTER  │   SKILL MATRIX    │           SHADOW MODE           │
│ Multi-Option Trade│ Registry, Versions│ Predictive Workflow Forecaster  │
│ Risk vs Impact Eval│ Tool & Permissions│ (Zero Unprompted Execution)     │
└───────────────────┴───────────────────┴─────────────────────────────────┘
                                     │ All feed into
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            AURA ORCHESTRATOR                            │
│           Single Enforcement & Workflow Coordination Engine             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Context Vault
* **Function**: Persistent, structured storage for projects, conversations, historical decisions, task hierarchies, file references, and user preferences.
* **Scoped Semantic Retrieval**: AURA queries the Context Vault using semantic vectors (`pgvector`), pulling only strictly relevant context slices for active queries rather than dumping entire memory banks into model prompts.

### 3.2 Goal Engine
* **Function**: Converts high-level user objectives into directed acyclic graphs (DAGs) of milestones, tasks, dependencies, and quantitative metrics.
* **Continuous State Recalculation**: Constantly updates the completion percentage of each active goal and feeds the Command Map with critical unfinished work.

### 3.3 Event Trigger System
* **Function**: Monitors authorized event sources across the environment:
  * File modifications (via file system watchers).
  * Task completions and failures.
  * System alerts, thermal spikes, and memory pressure.
  * Scheduled cron events and focus blocks.
  * External webhooks and API responses.
* **Rule & Condition Engine**: Events are evaluated against conditional rules and policies before triggering downstream agent actions.

### 3.4 Decision Center
* **Function**: Multi-action evaluation engine that compares competing candidate strategies.
* **Evaluation Matrix**: Ranks each candidate by:
  $$\text{Score} = f(\text{Risk}, \text{Impact}, \text{Dependencies}, \text{Estimated Effort}, \text{Confidence})$$
* Delivers the top-ranked candidate to the **Next Action** sector.

### 3.5 Skill Matrix
* **Function**: Authoritative registry of all platform capabilities and agent skills.
* **Skill Metadata**:
  * Semantic name and semantic version.
  * Operational status (`HEALTHY` | `DEGRADED` | `OFFLINE`).
  * Dependency requirements (e.g. Docker, Git, Python).
  * Underlying tool executors (Tool Broker bindings).
  * Explicit capability permission tokens (e.g. `filesystem.workspace.write`, `git.commit`).

### 3.6 Shadow Mode
* **Function**: Non-intrusive background analyst that predicts upcoming operator needs based on file edits, terminal commands, and open tickets.
* **Golden Safety Invariant**: **Shadow Mode never secretly executes consequential actions.** It only pre-stages data, warms caches, and generates recommendations for the **AI Preparation** sector.

---

## 4. Aura Orchestrator & The Continuous Execution Cycle

The **Aura Orchestrator** is the central brain and sole enforcement gateway connecting all intelligence services. It strictly prevents any individual subsystem or sub-agent from executing unmediated or unrestricted actions.

### 4.1 The Continuous Cycle

$$\text{User Input} \longrightarrow \text{Understanding} \longrightarrow \text{Context} \longrightarrow \text{Planning} \longrightarrow \text{Permission} \longrightarrow \text{Action} \longrightarrow \text{Verification} \longrightarrow \text{Memory Update} \longrightarrow \text{Command Map}$$

1. **User Input**: Receives natural language, voice prompt, or slash directive.
2. **Understanding**: `IntentService` normalizes request and extracts intents/entities.
3. **Context**: `Context Vault` retrieves scoped project and session memories.
4. **Planning**: `Goal Engine` links intent to active goals or scaffolds a new milestone plan.
5. **Permission**: `Permission Manager` / `Governance Engine` validates capability tokens and evaluates risk.
6. **Action**: `Action Engine` routes approved tasks to sandboxed workers or Tool Broker.
7. **Verification**: `Verification Engine` independently validates outputs (e.g. SENTINEL tests FORGE patch).
8. **Memory Update**: Results, artifacts, and decisions are persisted in Context Vault.
9. **Command Map**: Real-time state, progress, and next actions are projected to the operator HUD.

---

## 5. User Interaction & Natural Language Directives

The Command Map enables natural conversational interaction while projecting technical HUD clarity.

### 5.1 Primary Interaction Flow Example
* **User Directive**:  
  *"Aura, continue working on the Aura Assistant."*
* **Orchestrator Operation**:
  1. Identifies active project: `Aura Assistant`.
  2. Restores relevant workspace context from `Context Vault`.
  3. Inspects unfinished milestones in `Goal Engine`.
  4. Identifies current blockers: `Two unresolved dependency issues`.
  5. Evaluates candidate actions in `Decision Center` and selects highest-impact task: `Debug FORGE startup`.
  6. Projects current status to the Command Map.

### 5.2 Command Map State Card Visualization
```
┌────────────────────────────────────────────────────────────────────────┐
│                        AURA COMMAND MAP HUD                            │
├────────────────────────────────────────────────────────────────────────┤
│ CURRENT PROJECT : Aura Assistant                                      │
│ ACTIVE GOAL     : Complete Intelligence Layer                          │
│ PROGRESS        : [██████████████████░░░░░░░░] 68%                     │
│ BLOCKER         : Two unresolved dependency issues                     │
│ NEXT ACTION     : Debug FORGE startup                                  │
│ CONFIDENCE      : 94%                                                  │
├────────────────────────────────────────────────────────────────────────┤
│ ACTIONS         : [ OPEN ]   [ EXECUTE ]   [ DISMISS ]   [ EXPLAIN ]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Permissions, Security & Sandboxing

Because AURA controls file systems, terminal processes, network APIs, and external deployments, every capability is mediated through a multi-tier permission layer.

### 6.1 Permission Tiers

| Tier | Operations | Policy |
| :--- | :--- | :--- |
| **Tier 1: Read-Only / Safe** | Reading files, inspecting logs, searching memories, calculating telemetry, formatting diffs. | **Autonomous (ALLOW)** — Executes automatically without prompt. |
| **Tier 2: Consequential Local** | Modifying source code, creating Git checkpoints, running local tests, installing packages. | **Policy Controlled (REQUIRE_APPROVAL unless pre-authorized)**. |
| **Tier 3: Destructive / Outbound** | Executing arbitrary shell scripts, deleting files, pushing Git remotes, staging deployments. | **Strict Approval (Always prompt with preview + MFA/Biometric)**. |

### 6.2 Sandbox Isolation
* All untrusted skills, generated scripts, and third-party code execute inside isolated container/sandbox environments with restricted network egress and capped CPU/RAM allocations.

### 6.3 Visible Permission Manager
* Operators have access to a dedicated Permission Manager view within the Command Map to inspect, grant, restrict, or revoke capabilities across all agents and tools.

---

## 7. Technical Architecture & Tech Stack

### 7.1 Multi-Language Division of Responsibility
* **TypeScript / Node.js**:
  * Core HTTP API, REST endpoints, WebSocket real-time communication.
  * Aura Orchestrator, Event Trigger engine, Command Map UI state synchronization.
  * Application services and file system tool broker.
* **Python**:
  * AI/ML pipelines, local embeddings, vector computations.
  * SENTINEL SAST defensive scanners and complex AST parsers.
* **C / C++**:
  * Reserved exclusively for performance-critical low-level primitives (native audio DSP, local model quantization runtimes).

### 7.2 Persistence Architecture
* **Primary Database**: PostgreSQL.
* **Semantic Memory**: PostgreSQL with `pgvector` extension for embedding storage and cosine similarity search (eliminates unnecessary standalone vector DB overhead).

---

## 8. Phased Development Roadmap

The development follows a strictly ordered, dependency-safe strategy:

| Phase | Milestone Scope | Core Deliverables |
| :---: | :--- | :--- |
| **Phase 1** | **Command Map Core & Visual HUD** | Build Command Map HUD with central Aura Core, Activity Stream, Attention Center, Next Action, AI Preparation, and real-time state synchronization. |
| **Phase 2** | **Aura Orchestrator & Context Vault** | Implement core Orchestrator state engine and connect to Context Vault for scoped memory retrieval. |
| **Phase 3** | **Goal Engine** | Implement persistent goal DAGs, milestone decomposition, task tracking, and progress metrics. |
| **Phase 4** | **Event Trigger System** | Implement file system, schedule, task, and system event watchers with condition rule evaluation. |
| **Phase 5** | **Decision Center** | Implement multi-action evaluation algorithm (risk, impact, effort, confidence scoring). |
| **Phase 6** | **Skill Matrix & Permission Manager** | Implement skill registration, versioning, capability tokens, and the user-facing Permission Manager. |
| **Phase 7** | **Shadow Mode** | Implement predictive workflow analysis and staging once foundational context, goals, and events are stable. |

---

## 9. Definition of Done (DoD)

The AURA Command Map feature is functionally verified when:
1. **Aura Core** accurately projects operational state, active project, goal, progress %, and confidence score.
2. The 4 surrounding sectors (**Activity**, **Attention**, **Next Action**, **AI Preparation**) update in real-time.
3. Natural language queries (e.g. *"continue working on Aura Assistant"*) automatically populate the Next Action sector.
4. The 4 action buttons (**Open**, **Execute**, **Dismiss**, **Explain**) execute with full governance and permission checks.
5. All read-only and consequential actions strictly adhere to the defined permission boundaries.
