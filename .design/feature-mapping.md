# Feature Mapping

This file maps code paths to design feature areas. It helps AI assistants know where to record design history.

| Code Path | Design Feature | Design History |
|-----------|---------------|----------------|
| `mlflow/server/js/src/experiment-tracking/pages/experiment-tool-registry/` | MCP Registry | `.design/features/mcp-registry/design-history.md` |
| `mlflow/server/js/src/experiment-tracking/pages/prompts/` | Prompts | `.design/features/prompts/design-history.md` |
| `mlflow/server/js/src/model-registry/` | Model Registry | `.design/features/model-registry/design-history.md` |
| `mlflow/server/js/src/experiment-tracking/pages/experiment-page-tabs/` | Experiment Tracking | `.design/features/experiment-tracking/design-history.md` |

## How to Use

When making design-related changes to code:

1. Find the matching code path in the table above
2. Record significant design updates in the corresponding design-history.md file
3. If no matching path exists, create a new feature folder and add it to this table

See `.design/README.md` for detailed guidelines on what to record and how to write entries.
