# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Decentralized Todo App.

## Workflows

### CI Workflow (`ci.yml`)
**Trigger:** Push to `main` branch or pull requests targeting `main`

**Jobs:**
- **Lint**: Runs ESLint on backend and frontend code
- **Test Contracts**: Compiles and tests smart contracts
- **Test Backend**: Runs Jest tests for the backend API
- **Test Frontend**: Runs Vitest tests for the React frontend
- **Build**: Builds all workspaces (contracts, backend, frontend) and uploads artifacts

This workflow ensures code quality and prevents broken code from being merged.

### Deploy Workflow (`deploy.yml`)
**Trigger:** Manual workflow dispatch

**Parameters:**
- **environment**: Choose between `staging` or `production`
- **network**: Choose blockchain network (`localhost`, `sepolia`, `mainnet`)

**Requirements:**
Set the following secrets in your repository:
- `DEPLOYER_PRIVATE_KEY`: Private key for contract deployment
- `INFURA_API_KEY`: Infura API key for network access
- `ETHERSCAN_API_KEY`: Etherscan API key for contract verification

**Usage:**
1. Go to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Select environment and network
5. Click "Run workflow"

### Dependency Check Workflow (`dependency-check.yml`)
**Trigger:**
- Weekly on Mondays at 9:00 AM UTC
- Manual workflow dispatch
- Pull requests (dependency review only)

**Jobs:**
- **Security Audit**: Runs `npm audit` to check for vulnerabilities
- **Check Outdated**: Lists outdated packages
- **Dependency Review** (PRs only): Reviews dependency changes in pull requests

### CodeQL Security Analysis (`codeql.yml`)
**Trigger:**
- Push to `main` branch
- Pull requests targeting `main`
- Weekly on Mondays at 6:00 AM UTC

**Purpose:** Automated security scanning for JavaScript and TypeScript code to identify potential vulnerabilities.

## Setting Up GitHub Environments

For the deploy workflow to work properly, create the following environments in your repository:

1. **staging**
   - Add required secrets
   - Configure protection rules as needed

2. **production**
   - Add required secrets
   - Configure protection rules (require reviews, restrict to specific branches)

## Badge Status

Add these badges to your README.md:

```markdown
[![CI](https://github.com/yourusername/decentralized-todo-app/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/decentralized-todo-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/yourusername/decentralized-todo-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/yourusername/decentralized-todo-app/actions/workflows/codeql.yml)
```

## Local Testing

Before pushing, you can run the same checks locally:

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Build all workspaces
npm run build
```
