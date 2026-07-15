# Agent Pack

Published specification, JSON Schema, and (soon) validator for **Agent Packs**.

> **An Agent Pack is a versioned, deployable unit of agent** — its prompt, its tools, its engine, and its permissions.

| | |
|---|---|
| **Canonical HTML** | https://packs.agenthippo.ai/spec/v1 |
| **Schema `$id`** | https://packs.agenthippo.ai/schema/v1/agent.json |
| **Pitch** | https://agenthippo.ai/agent-pack |
| **License** | [CC BY 4.0](./LICENSE) (spec text + schema) |

This repository is the machine-readable / citable source for the format. The website hosts the same schema and a rendered spec page. Validator + GitHub Action land here next (`pack-validate`).

## Layout

```
SPEC.md                 # Agent Pack Specification v1 (markdown)
schema/v1/agent.json    # JSON Schema (identical to packs.agenthippo.ai)
LICENSE                 # CC BY 4.0
```

## Editor validation

In `agent.yaml`:

```yaml
# yaml-language-server: $schema=https://packs.agenthippo.ai/schema/v1/agent.json
```

## Contributing

Open issues for clarifications and RFCs. Until external implementers ship against it, this is a **published specification** — not an “open standard” process.

Registry, certification, and runtime products remain separate commercial offerings from AgentHippo.
