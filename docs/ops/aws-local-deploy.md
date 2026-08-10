# Deploy from your laptop (no GitHub OIDC)

**Use this while you do not want GitHub to assume an AWS role.**  
CI (`pr.yml`) can still **test** on GitHub; it never needs AWS credentials. **Deploy** is you + AWS CLI on this machine.

Region: **`us-east-1`**. Viewers: US + Europe via CloudFront PriceClass_100 (when that distribution exists).

---

## 1. One-time on this Mac

```bash
# AWS CLI v2
brew install awscli

# Log in — prefer IAM Identity Center (SSO), not long-lived access keys
aws configure sso
# account, start URL, region us-east-1, profile name e.g. coupon-hub

aws sso login --profile coupon-hub
aws sts get-caller-identity --profile coupon-hub
```

If you use an IAM user instead: `aws configure --profile coupon-hub` (access key + secret). **Don’t commit those keys. Don’t put them in GitHub secrets either.**

Docker/Colima must work (`docker info`).

```bash
cp scripts/aws/env.aws.example .env.aws
# edit .env.aws — AWS_PROFILE, ECR_REPOSITORY, URLs, service ARNs
```

`.env.aws` is gitignored.

---

## 2. Create the architecture (Terraform — do not click the console)

The stack is code under `infra/terraform/`. Same laptop, still no OIDC:

```bash
aws sso login --profile coupon-hub
bash scripts/aws/infra-up.sh
```

That creates VPC, ECR, RDS (private), secrets, ALB, CloudFront PriceClass_100, and (after you flip `enable_web_service`) 1× Fargate. Details: [infra/terraform/README.md](../../infra/terraform/README.md).

Tear down: `bash scripts/aws/infra-down.sh`.

To reach RDS from this Mac for `migrate.sh`, set `operator_cidr = "YOUR.IP.V4/32"` in `terraform.tfvars` and re-apply. Remove it when you are done. Do not make RDS public.

---

## 3. Commands (from repo root)

```bash
export AWS_PROFILE=coupon-hub          # or set in .env.aws
aws sso login --profile coupon-hub     # when the SSO session expires

pnpm test                              # same as always

# Full staging release (test → image → migrate → service → smoke)
bash scripts/aws/release.sh staging

# Skip tests if you just ran them
SKIP_TEST=1 bash scripts/aws/release.sh staging

# Production — script asks you to type `prod`
bash scripts/aws/release.sh prod
```

Pieces if you want them separate:

```bash
bash scripts/aws/build-push.sh staging
bash scripts/aws/migrate.sh staging
bash scripts/aws/deploy-web.sh staging
SMOKE_STORE_SLUG=nike pnpm smoke https://staging.example.com
```

`pr.yml` on GitHub stays **tests only**. No AWS keys on GitHub.

---

## 4. IAM policy on *your* user/role (minimum)

Allow on this profile (tighten ARNs when you have them):

- `ecr:GetAuthorizationToken` + push/pull on the coupon-hub repo  
- `ecs:UpdateService` / `ecs:DescribeServices` **or** `apprunner:UpdateService`  
- `secretsmanager:GetSecretValue` for the DB URL secret  
- `rds:DescribeDBInstances` (optional)

No `iam:CreateOpenIDConnectProvider`. No GitHub.

---

## 5. Order of operations the first time

1. `aws sso login --profile coupon-hub`
2. `bash scripts/aws/infra-up.sh` (`enable_web_service = false` in `terraform.tfvars`)
3. Merge `.env.aws.generated` → `.env.aws`
4. `bash scripts/aws/build-push.sh staging`
5. Set `enable_web_service = true`, `infra-up.sh` again
6. `bash scripts/aws/migrate.sh staging` (needs `operator_cidr` or SSM)
7. `pnpm smoke <cloudfront_url>` from Terraform output

After that, `bash scripts/aws/release.sh staging` is the loop (new code only).  
Replicate staging: same `infra/` + a new AWS account or `terraform workspace`.  
Prod: `prod.tfvars.example` as a **separate** apply, never flip `environment` in place.

**No** `db:seed:demo` on prod.

---

## 6. When OIDC is worth it later

Only when you want **merge to `main` → staging** without sitting at the laptop. Nothing in the app has to change — you add a workflow that runs the same build/migrate/deploy steps. Until then, **you are the CD**.
