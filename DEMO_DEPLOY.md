# MLflow Tool Registry - Demo Deployment

This guide explains how to deploy the MLflow Tool Registry UI to GitLab Pages for design previews and collaboration.

## Overview

The Tool Registry UI is a React application that runs entirely in the browser using localStorage for data persistence. This makes it perfect for static hosting on GitLab Pages - no backend server required!

## Deployment Setup

### 1. Create a GitLab Fork

If you haven't already forked this repo to GitLab:

1. Go to your GitLab account
2. Create a new project and select "Import project"
3. Import from GitHub or push your local repository

### 2. Enable GitLab Pages

GitLab Pages is enabled by default for public repositories. The `.gitlab-ci.yml` file in this repo will automatically:

1. Install dependencies
2. Build the React application
3. Deploy to GitLab Pages on every push to `master`, `main`, or `add-experiment-tool-registry` branches

### 3. Push Your Branch

```bash
# After creating your GitLab remote
git push origin add-experiment-tool-registry
```

### 4. Access Your Deployment

Once the GitLab CI/CD pipeline completes, your site will be available at:

```
https://YOUR-USERNAME.gitlab.io/mlflow/
```

Or if using a GitLab group:

```
https://YOUR-GROUP.gitlab.io/mlflow/
```

The root URL will automatically redirect to the Tool Registry page.

## How It Works

### Data Storage

The Tool Registry uses browser localStorage to store:

- **Registered Tools**: MCP servers you've registered
- **Endpoints**: Direct access bindings to MCP server instances
- **Versions**: Version history for each tool

All data persists in the browser - it won't be shared between users or devices, making it perfect for individual design previews.

### Creating Demo Data

When you share the deployed link with collaborators, they can:

1. Click "Create MCP server" to register mock tools
2. Switch to the "Endpoints" tab to create mock access bindings
3. Explore the UI and provide feedback

### Updating the Deployment

Every time you push changes to your GitLab repository on a tracked branch, the site will automatically rebuild and redeploy. The process typically takes 2-3 minutes.

## Customizing the Build

### Build Configuration

The build uses the existing `craco.config.js` configuration which:

- Sets `publicPath: 'static-files/'` for proper asset resolution
- Bundles all JavaScript and CSS
- Generates a production-optimized build

### Environment Variables

To customize the build, you can add environment variables in `.gitlab-ci.yml`:

```yaml
variables:
  GENERATE_SOURCEMAP: "false"  # Already set in package.json build script
  NODE_ENV: "production"
```

### Changing the Base Path

If you need to deploy under a different URL path, update the `homepage` field in `mlflow/server/js/package.json` and the redirect in `.gitlab-ci.yml`.

## Monitoring the Deployment

### View Pipeline Status

In GitLab, go to:
- **CI/CD > Pipelines** to see build status
- **CI/CD > Jobs** to view detailed logs
- **Settings > Pages** to see your Pages URL and access settings

### Troubleshooting

If the deployment fails:

1. Check the pipeline logs in GitLab CI/CD
2. Ensure `yarn.lock` is committed (required for `--frozen-lockfile`)
3. Verify the branch name is listed in the `.gitlab-ci.yml` `only:` section

## Alternative: Local Static Build

To test the static build locally before deploying:

```bash
cd mlflow/server/js
yarn build

# Serve the build directory
npx serve -s build -p 8080
```

Then open `http://localhost:8080/static-files/index.html#/tools` in your browser.

## Sharing with Collaborators

When sharing the deployed link:

1. **Direct Link**: Share `https://YOUR-USERNAME.gitlab.io/mlflow/` (auto-redirects to tools page)
2. **Specific Page**: Share `https://YOUR-USERNAME.gitlab.io/mlflow/static-files/index.html#/tools`

Remind collaborators that:
- Data is stored locally in their browser (not shared)
- They can create mock data to explore the UI
- The page works offline after the first load (PWA-like behavior)

## Next Steps

After reviewing the design with collaborators:

1. Gather feedback on the UI/UX
2. Iterate on the design in your local development environment
3. Push updates to GitLab to automatically redeploy
4. Eventually integrate with the real MLflow backend API when ready
