# shortix-lambda

## CI/CD Deployment

This repository uses GitHub Actions for automated deployment.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Secret |
| `GH_PAT` | GitHub Personal Access Token (to checkout `shortix-infra`) |

### Required GitHub Variables (Environment-specific)

These can be configured per environment (dev, staging, prod) in **Settings** -> **Environments**.

| Variable | Description |
|---|---|
| `AWS_REGION` | e.g., `us-east-1` |

### Manual Trigger
Go to **Actions** -> **Deploy Backend** -> **Run workflow**. 
You can specify which branch of the `shortix-infra` repository to use for the deployment.
