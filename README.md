# shortix-lambda

## CI/CD Deployment

This repository uses GitHub Actions for automated deployment.

### GitHub Secrets Required

For the `Deploy Backend` workflow to run, configure the following secrets in your GitHub repository:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Secret |
| `AWS_REGION` | e.g., `us-east-1` |
| `GH_PAT` | GitHub Personal Access Token (to checkout `shortix-infra`) |
| `S3_ARTIFACT_BUCKET` | The S3 bucket where Lambda ZIPs are stored |

### Manual Trigger
Go to **Actions** -> **Deploy Backend** -> **Run workflow**. 
You can specify which branch of the `shortix-infra` repository to use for the deployment.
