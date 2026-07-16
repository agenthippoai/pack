# Agent Pack

Published specification, JSON Schema, and validator for **Agent Packs**.

> **An Agent Pack is a versioned, deployable unit of agent** — its prompt, its tools, its engine, and its permissions.  
> It’s what your IDE writes, your CI validates, and your infrastructure runs.

| | |
|---|---|
| **Canonical HTML** | https://packs.agenthippo.ai/spec/v1 |
| **Schema `$id`** | https://packs.agenthippo.ai/schema/v1/agent.json |
| **Pitch** | https://agenthippo.ai/why-agent-pack |
| **License** | [CC BY 4.0](./LICENSE) (spec text + schema) |
| **Validator** | [`npx @agenthippo-ai/pack-validate`](https://www.npmjs.com/package/@agenthippo-ai/pack-validate) · Action [`agenthippoai/pack`](https://github.com/agenthippoai/pack) |

This repository is the machine-readable / citable source for the format. The website hosts the same schema and a rendered spec page. The CLI and GitHub Action validate against [`schema/v1/agent.json`](./schema/v1/agent.json) in this repo.

## What is an Agent Pack

Most agent code never leaves a chat window or a laptop. Once it has to run against real company data, for more than one person, someone asks: which version is this, what can it touch, and whose permissions is it using?

An Agent Pack answers that as a versioned artifact: prompt, skills, tools, engine, and permissions — small enough to review and roll back like any other production change. This repo defines the **manifest** (`agent.yaml`) and schema. Deploy targets, runtimes, and infrastructure are generated *from* a pack by tooling, not declared *in* it.

Full write-up: [packs.agenthippo.ai/spec/v1](https://packs.agenthippo.ai/spec/v1/) · [`SPEC.md`](./SPEC.md)

## Example

Read-only warehouse analyst with per-user (OBO) SQL access:

```yaml
# yaml-language-server: $schema=https://packs.agenthippo.ai/schema/v1/agent.json
apiVersion: agenthippo.ai/v1
kind: Agent
metadata:
  name: warehouse-analyst
  version: 0.1.0
  author: AgentHippo
  description: Read-only warehouse analyst — answers questions against the warehouse via per-user (OBO) SQL access.
spec:
  engine: claude
  engineVersion: 2.1.209
  model: claude-fable-5
  permissions:
    fileAccess: read-only
  mcp:
    - name: databricks
      config: ./mcp/databricks.mcp.json
  skills:
    - path: ./skills/sql-query
```

Only `agent.yaml` is required by the schema. The pack prompt is always **`AGENTS.md` at the pack root** — a fixed path, not a manifest field (same idea as `Dockerfile`). Companion dirs `skills/` and `mcp/` are declared via `spec.skills` / `spec.mcp` because those can be many. Subagents should be other Agent Packs (own engine, model, tools), not nested mini-configs. Details: [SPEC.md](./SPEC.md#prompt-agentsmd) · [Anatomy](https://packs.agenthippo.ai/spec/v1/#anatomy).

## Layout

```
SPEC.md                 # Agent Pack Specification v1 (markdown)
schema/v1/agent.json    # JSON Schema (identical to packs.agenthippo.ai)
bin/pack-validate.mjs   # CLI entry
src/validate.mjs        # Ajv2020 + js-yaml
action.yml              # GitHub Action (thin CLI wrapper)
package.json            # @agenthippo-ai/pack-validate
LICENSE                 # CC BY 4.0
```

## Validate

```bash
# current directory (./agent.yaml) or a pack / store packs dir
npx @agenthippo-ai/pack-validate
npx @agenthippo-ai/pack-validate ./path/to/agent.yaml
npx @agenthippo-ai/pack-validate ./agent-packs
```

GitHub Actions:

```yaml
- uses: agenthippoai/pack@v0.1.0
  with:
    path: .
```

## Editor validation

In `agent.yaml`:

```yaml
# yaml-language-server: $schema=https://packs.agenthippo.ai/schema/v1/agent.json
```

## Contributing

Open issues for clarifications and RFCs.
