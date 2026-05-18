# .design Folder Specification

**Version 0.1**

This folder captures design context, rationale, and history for MLflow. It serves as a living record that helps AI assistants and humans understand the "why" behind design decisions.

## Purpose

The `.design` folder is a structured place to store:
- Design rationale and decision history
- Meeting notes and external context links
- Stakeholder information
- Release-specific working files and documentation

**Key principle:** Focus on *design* decisions and *user experience* updates, not code changes.

## Folder Structure

```
.design/
├── README.md           # This file
├── features/           # Feature-specific design context
│   └── {feature-name}/
│       ├── design-history.md
│       └── {version}/  # e.g., 2.18/, 2.19/
└── product/            # Product-wide guidelines and context
    ├── design-guidelines/
    ├── process-guidelines/
    └── ux-research/
```

## Features Folder

Each subfolder in `features/` represents a distinct feature area (e.g., `mcp-registry/`, `prompts/`, `model-registry/`).

### Required Files

#### `design-history.md`

A chronological record of design evolution. This is the most important file—it captures the full story of how a feature's design developed over time.

**What to include:**
- Key design decisions and their rationale
- Meeting summaries with links to recordings, chat logs, and notes
- Scope changes (features added, descoped, or deferred)
- Major UI/UX updates and the thinking behind them
- Stakeholder feedback and how it influenced design

**What NOT to include:**
- Code refactoring or file restructuring
- Bug fixes unrelated to design
- Linting or formatting changes

**Format:**

```markdown
# Design History

## 2026-05-18

### [Meeting] MCP Registry UX Review
- [Recording](link) | [Notes](link)
- Summary of key discussion points
- Action items or decisions made

### [Decision] Changed alias scoping behavior
- Aliases are scoped per-server, not globally
- Rationale: Matches prompts behavior and user expectations

### [Update] Empty state redesign
- Added illustration and clearer call-to-action
- Aligns with Databricks Design System patterns

## 2026-05-14

### [Update] Microcopy tweaks
- Updated button labels for clarity
- Changed "Create Tool" to "Create MCP server"
```

**Entry Types:**
- `[Meeting]` - Stakeholder syncs, reviews, demos
- `[Decision]` - Significant design choices with rationale
- `[Update]` - UI/UX changes to the feature
- `[Descoped]` - Features removed or deferred
- `[Feedback]` - User research or stakeholder input

### Version Subfolders

Inside each feature folder, create version subfolders (e.g., `2.18/`, `2.19/`) for release-specific context:
- Working files and exploration documents
- Open questions for that release
- Context sources and reference materials
- Planning documents

The structure within version folders is flexible—organize as needed for that release.

**Why version folders matter:** They enable future capabilities like generating release delta summaries ("What changed in MCP Registry for 2.19?").

## Product Folder

Contains product-wide context that applies across features:
- `design-guidelines/` - Visual and interaction standards
- `process-guidelines/` - How the team works
- `ux-research/` - Personas, JTBDs, research findings

## AI Assistant Guidelines

### When to Update design-history.md

**Automatically add entries when:**
- Major UI components are added, removed, or significantly changed
- Design decisions are made (especially with rationale)
- Features are descoped or deferred
- New user flows are introduced

**Add brief mentions for:**
- Minor content/microcopy updates (group under one bullet for the day)
- Small visual tweaks

**Do NOT add entries for:**
- Code refactoring
- TypeScript/linting fixes
- File reorganization
- Test updates

### Writing Style

**Brevity is essential.** Each entry should be 1-2 sentences maximum.

- Keep entries concise—just enough to remember what happened
- Focus on the *user experience* impact, not implementation details
- **Never include**: API field names, JSON schema details, component implementation specifics, Databricks Design System component names, or technical specifications
- **Never list every sub-feature**: Summarize the capability, don't enumerate every detail
- **Skip rationale for obvious changes**: Only explain "why" when the decision is non-obvious
- Include links to external resources when available
- Use past tense ("Added...", "Changed...", "Decided...")
- **Group related changes**: Multiple small tweaks in one area = one entry, not five

### Example: Good vs. Too Detailed

**Good:**
```markdown
### [Update] Redesigned endpoint creation form
- Added health check configuration options
- Users can now specify health check intervals and timeouts
```

**Too Detailed:**
```markdown
### [Update] Redesigned endpoint creation form
- Added health check configuration using Databricks Design System Form component
- Updated EndpointForm.tsx to handle health check state with useState hook
- Added validation for numeric inputs in the interval fields
- Modified the DirectAccessBinding type to support health_check object
```

## Creating a New Feature Folder

**Option A — Agent auto-creation:** When an agent makes design-related changes to a code path that is **not** listed in [.design/feature-mapping.md](.design/feature-mapping.md), it will add a row to the mapping and create `.design/features/{feature-slug}/design-history.md` automatically. No action required from you unless you want to pre-create the area.

**Option B — You create it first:** If you prefer to set up the feature area before starting work:

1. Open [.design/feature-mapping.md](.design/feature-mapping.md) and add a row: Code Path (e.g. `mlflow/server/js/src/experiment-tracking/pages/mcp-registry/`), Design Feature (readable name), Design History (`.design/features/{feature-slug}/design-history.md`).
2. Create folder `.design/features/{feature-slug}/` (use kebab-case, e.g. `mcp-registry`).
3. Create `design-history.md` inside it with the template below. Add a version subfolder (e.g. `2.19/`) if you are working toward a specific release.

**Template for new design-history.md:**

```markdown
# Design History

This file contains a chronological record of key design updates and decisions for {feature name}. See `.design/README.md` for format guidelines.

---

## {today's date in YYYY-MM-DD}

### [Update] Initial design created
- Brief description of the starting point
- Link to any initial designs or references
```
