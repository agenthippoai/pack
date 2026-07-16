# Agent Pack Specification v1

**Status:** v1.0 · Stable · **apiVersion:** `agenthippo.ai/v1` · **License:** [CC BY 4.0](./LICENSE)  
**Canonical URL:** https://packs.agenthippo.ai/spec/v1  
**Schema:** https://packs.agenthippo.ai/schema/v1/agent.json  
**Last updated:** 2026-07-15  
**Overview:** [Why Agent Pack](https://agenthippo.ai/why-agent-pack)

> **An Agent Pack is a versioned, deployable unit of agent** — its prompt, its tools, its engine, and its permissions.  
> It’s what your IDE writes, your CI validates, and your infrastructure runs.

## What is an Agent Pack

Most agent code never leaves a chat window or a laptop. Once it has to run against real company data, for more than one person, someone asks: which version is this, what can it touch, and whose permissions is it using?

An Agent Pack answers that as a versioned artifact: prompt, skills, tools, engine, and permissions — small enough to review and roll back like any other production change. This page defines the manifest only. Deploy targets, runtimes, and infrastructure are generated *from* a pack by tooling, not declared *in* it.

## Anatomy

Only `agent.yaml` is required by this spec.

| Path | Role |
|------|------|
| `agent.yaml` | Manifest — identity, engine, model, permissions, MCP, skills. See [Manifest reference](#manifest-reference). |
| `AGENTS.md` | Prompt — purpose, behavior, refusals. Fixed path; not a manifest field. See [Prompt](#prompt-agentsmd). |
| `skills/<name>/SKILL.md` | Bundled skills; same trust boundary as the rest of the pack. |
| `mcp/*.mcp.json` | Tool configs. Per-user credentials are referenced, never inlined in the manifest. |

## Prompt (`AGENTS.md`)

The pack prompt is always **`AGENTS.md` at the pack root**. There is no `spec.prompt` (or similar) field in `agent.yaml`.

That is intentional. Skills and MCP need path lists because there can be many, with varying names. The prompt is singular and canonical — the same pattern as `Dockerfile` or `README.md`: the filename *is* the contract. Declaring `prompt: ./AGENTS.md` on every pack would be boilerplate, not information.

Tooling and validators that care about the prompt look for that fixed path (and may record a hash such as `computed.promptsSignature`). Alternate filenames are out of scope for v1.

### Claude Code and project rules

Claude Code (and similar coding agents) often load instructions from well-known files — `AGENTS.md`, `CLAUDE.md`, and rule trees under the project. An Agent Pack folder can **completely satisfy** that model for a given agent:

- Put the operating instructions in pack-root `AGENTS.md` (and keep them versioned with the pack).
- Bundle skills and MCP under the pack so tools travel with the same identity.
- Pin engine and model in `agent.yaml` (`spec.engine`, optional `spec.engineVersion` / `spec.model`).

When the pack is the working tree (or is mounted as the agent’s project root), Claude Code–style loaders that already honor `AGENTS.md` pick up the same prompt the Pack format treats as canonical. Rules and conventions that would otherwise live as ad-hoc files across a repo can be **closed inside the pack folder and schema** — one reviewable unit — while `AGENTS.md` remains the entry point those engines already know how to read.

### Subagents

Weak nested “subagent” blobs (a name + a paragraph inside a parent config) are not the recommended shape. **A subagent should be another Agent Pack**: its own `agent.yaml`, its own `AGENTS.md`, its own engine, model, permissions, and tools.

That keeps every worker reviewable, swappable, and attributable the same way as the parent. Delegation *when* to call whom stays in prose (`AGENTS.md`); *what* the subagent is stays entirely in the child pack’s manifest. A future dependency list field (`spec.subagents`) may enumerate those packs by name/path — see [Changelog](#changelog) — but it does not invent a second, weaker descriptor format.

## Manifest reference

Fields of `agent.yaml`, in document order. A conforming pack validates against the [published JSON Schema](https://packs.agenthippo.ai/schema/v1/agent.json) ([schema/v1/agent.json](./schema/v1/agent.json) in this repo).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiVersion` | string | Required | Const `agenthippo.ai/v1`. |
| `kind` | string | Required | Const `Agent`. |
| `metadata.name` | string | Required | Stable kebab-case pack id. |
| `metadata.version` | string | Required | Semantic version of this pack (independent of `apiVersion`). |
| `metadata.description` | string | Optional | One-line summary for search and review. Recommended. |
| `metadata.author` | string | Optional | Publisher credit. |
| `metadata.license` | string | Optional | SPDX or free-form license for pack contents. |
| `metadata.tags` | array | Optional | Keywords for registry discovery. |
| `spec.engine` | string | Required | Engine that runs the turn loop. See [Engine](#engine). |
| `spec.engineVersion` | string | Optional | Pin of the engine binary (e.g. Claude Code `2.1.209`). |
| `spec.model` | string | Optional | Model selector. `auto` lets the engine choose. |
| `spec.cheapModel` | string | Optional | Cheaper model for background / subagent routing when supported. |
| `spec.remote.url` | string | Optional | When set, the pack runs at this URL instead of local `spec.engine`. See [Remote](#remote). |
| `spec.permissions.fileAccess` | enum | Optional | `read-only` \| `workspace-write` \| `full`. Defaults to `full` if omitted — set it explicitly for production packs. |
| `spec.visibility` | enum | Optional | `internal` \| `team` \| `public`. Registry access scope for the pack. |
| `spec.mcp` | array | Optional | MCP server entries: `name` + relative `config` path. |
| `spec.skills` | array | Optional | Bundled skills: each entry has a relative `path`. |
| `spec.data` | object | Optional | Seed pack data into an empty workspace — `sourcePath` (default `./data`), `workspacePath`. |

Machine-readable details (patterns, consts, nested shapes) live in the JSON Schema. Prefer the schema when prose and schema disagree.

## Full example

Read-only Databricks warehouse analyst with per-user (OBO) SQL access.

```yaml
# yaml-language-server: $schema=https://packs.agenthippo.ai/schema/v1/agent.json
apiVersion: agenthippo.ai/v1
kind: Agent
metadata:
  name: databricks-analyst
  version: 0.1.0
  description: Read-only warehouse analyst — answers questions against Databricks via per-user (OBO) SQL access.
spec:
  engine: cursor
  model: auto
  permissions:
    fileAccess: read-only
  mcp:
    - name: databricks
      config: ./mcp/databricks.mcp.json
  skills:
    - path: ./skills/spotlight-visualize
```

## Engine

`spec.engine` identifies the Agent Engine that runs the turn loop. Same pack, same permissions and tools — change one line to retarget:

```diff
  spec:
-   engine: cursor
+   engine: codex
```

Common values: `claude`, `codex`, `cursor`, `gemini`, `grok`, `rovo`, `openclaw`, or a custom [`engine.mjs`](https://github.com/agenthippoai/agenthippo-store/tree/main/engines).

`claude` and `codex` are built-in. The rest install as adapters from the [public engines catalog](https://github.com/agenthippoai/agenthippo-store/tree/main/engines) — or ship your own `engine.mjs` that implements the turn contract. Either way, `spec.engine` is the same string field. Optional `spec.engineVersion` pins the engine binary (for built-in Claude, the Claude Code version).

## Remote

When `spec.remote.url` is set, the pack runs at that URL instead of executing `spec.engine` locally. Engine and model in effect are whatever is running there.

```yaml
spec:
  engine: claude  # used only if spec.remote is absent
  remote:
    url: https://warehouse-analyst.example.com
```

## Validation

Point editors that support `yaml-language-server` at the schema for inline validation and autocomplete:

```yaml
# yaml-language-server: $schema=https://packs.agenthippo.ai/schema/v1/agent.json
```

Validate with `npx @agenthippo-ai/pack-validate` or GitHub Action `uses: agenthippoai/pack@v0.1.0`.

### Badge

![Packaged as an Agent Pack](https://packs.agenthippo.ai/packs/badge.svg)

```markdown
![Packaged as an Agent Pack](https://packs.agenthippo.ai/packs/badge.svg)
```

## Deploy targets

`deploy/` is not a manifest field and is not validated by this schema. Compliant tooling may generate deploy artifacts from a conformant pack for a chosen target:

- Docker / Cloud Run
- Self-hosted (compose + tunnel)
- Bare-metal (systemd)
- Databricks App

Generated files should carry pack identity forward — headers such as `# Generated from Agent Pack <name>@<version> — packs.agenthippo.ai` and OCI labels `ai.agenthippo.pack.name` / `ai.agenthippo.pack.version`.

## License

Spec text and JSON Schema are **CC BY 4.0**. Implement freely — commercial or not — with attribution and a link to the canonical URL. This is a published specification, not an open-standard foundation process. The AgentHippo registry, certification program, and managed runtime remain separate commercial products.

## Changelog

### v1.0 — 2026-07-15

Initial public release of the Agent Pack Specification.
