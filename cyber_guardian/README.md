# Aura Cyber Guardian

Autonomous cybersecurity capability integrated into Aura Assistant. Operates a continuously monitored, isolated cyber range for authorized security experimentation.

## Architecture

```
Aura Core → Cyber Guardian Controller
              ├── Range Manager
              ├── Monitoring Engine
              ├── Telemetry Pipeline (Normalizer → Event Bus)
              ├── Experiment Engine
              ├── Detection Engine
              ├── Response Engine
              ├── Evaluation Engine
              └── Authorization Layer (kill switch + scope validation)
```

## Security Loop

```
Observe → Analyze → Experiment → Detect → Respond → Evaluate → Learn
```

## MVP Capabilities

- Isolated environment lifecycle (create, start, stop, destroy)
- Centralized telemetry normalization (Wazuh, Suricata, system/app logs)
- SSH brute force adversary scenario (MITRE T1110.001)
- Rule-based detection with event correlation
- Automated containment playbook (block + isolate)
- Experiment reports with detection/response metrics
- Authorization layer with emergency kill switch
- Natural-language commands via Aura adapter

## Natural Language Commands

| Command | Action |
| --- | --- |
| "Start the cyber range" | Provision and start isolated environment |
| "Check my security status" | Return environment, security, and experiment metrics |
| "Run the latest detection experiment" | Execute MVP SSH brute force test |
| "Show me today's security incidents" | List active alerts and detections |
| "Which attacks were not detected?" | Return detection gaps from experiment history |
| "Emergency stop" | Activate kill switch |

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/cyber-guardian/status` | Security and environment status |
| `POST` | `/api/cyber-guardian/range/start` | Start cyber range |
| `POST` | `/api/cyber-guardian/range/stop` | Stop cyber range |
| `POST` | `/api/cyber-guardian/experiments/run` | Run an experiment |
| `GET` | `/api/cyber-guardian/experiments` | List experiments |
| `GET` | `/api/cyber-guardian/reports` | List experiment reports |
| `GET` | `/api/cyber-guardian/reports/:id` | Get experiment report |
| `POST` | `/api/cyber-guardian/kill-switch` | Activate/deactivate kill switch |
| `GET` | `/api/cyber-guardian/audit` | Audit log |

## Configuration

- `config/cyber-guardian/default-environment.json` — Environment profile
- `config/cyber-guardian/mvp-experiment.json` — MVP experiment definition

## Infrastructure (Phase 1)

- `infra/terraform/` — VM and network provisioning (stub)
- `infra/ansible/` — Defender stack configuration (stub)

## Development Roadmap

1. **Phase 1** — Cyber-range foundation (Terraform, Ansible, networking)
2. **Phase 2** — Security experiments (CALDERA, background simulator)
3. **Phase 3** — Autonomous defense (correlation, SOAR playbooks)
4. **Phase 4** — Aura integration (NL control, dashboard, memory)
5. **Phase 5** — Machine learning (anomaly detection, risk scoring)
6. **Phase 6** — Autonomous security research loop

## Safety

All adversary simulation is restricted to explicitly authorized cyber-range targets. The authorization layer validates every action against registered scopes. The kill switch immediately halts all autonomous operations.
