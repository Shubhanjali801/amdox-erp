# Amdox ERP — UML Diagrams

Every diagram is written in **PlantUML** (`.puml`) and reflects the **as-built** system (Express + Prisma + BullMQ on k3s) — not the aspirational spec stack.

## What each diagram shows

| File | Diagram | Answers the question… |
|---|---|---|
| `1-sequence.puml` | Sequence | What happens step-by-step during login / a request? |
| `2-usecase.puml` | Use Case | Who are the actors and what can each do? |
| `3-class.puml` | Class | What are the core data entities and how do they relate? |
| `4-activity.puml` | Activity | What checks does a write request pass (auth → RBAC → validate → rules)? |
| `5-component.puml` | Component | What are the running software pieces and how do they talk? |
| `6-state.puml` | State | What states does an Invoice move through, and how? |
| `7-object.puml` | Object | A real runtime snapshot (the seeded demo tenant) of the class diagram. |
| `8-deployment.puml` | Deployment | Where does each piece physically run on AWS/k3s? |
| `9-er-diagram.puml` | ER | The full database schema (43 tables). |
| `12-bullmq-sequence.puml` | Sequence | How does the async job queue handle a webhook with retries? |
| `10-git-branches.puml`, `11-git-graph.md` | Git | Branching / commit workflow. |

**Suggested reading order for understanding the system:**
`5-component` (big picture) → `8-deployment` (where it runs) → `3-class` / `9-er` (the data) → `4-activity` + `1-sequence` (how a request flows) → `6-state` (a lifecycle) → `12-bullmq` (async jobs).

Each file starts with a short comment explaining, in plain language, what it depicts.

---

## How to preview

### Option A — VS Code
1. Extensions (`Ctrl+Shift+X`) → search **PlantUML** → Install.
2. Open a `.puml` file → click the **Preview** icon (top-right) or `Alt+D`.

### Option B — Online (no install)
Paste the file contents into the **[PlantUML Online Server](https://www.plantuml.com/plantuml/uml/)** to render, export, or share.

> Rendering the extension needs Java + Graphviz locally; the online server needs neither.
