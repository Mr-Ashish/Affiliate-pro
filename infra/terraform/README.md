# Terraform — Coupon Hub Launch stack (us-east-1)

Creates a **repeatable** copy of the cheap AWS architecture:

- VPC (public tasks + private RDS, **no NAT**)
- ECR, Secrets Manager, CloudWatch logs
- RDS PostgreSQL 16 `t4g.micro`
- ALB + **1× Fargate** (optional until the first image exists)
- CloudFront **PriceClass_100** (US + Europe only)
- `/go`, `/admin`, `/api/*` not cached; `/_next/static/*` cached

No GitHub OIDC. Apply from your laptop after `aws sso login`.

## First time

```bash
aws sso login --profile coupon-hub
cd infra/terraform
cp staging.tfvars.example terraform.tfvars   # leave operator_cidr empty
terraform init
terraform apply                              # enable_web_service = false on first run
```

Or from the repo root:

```bash
bash scripts/aws/infra-up.sh
```

That writes `.env.aws.generated`. Merge it into `.env.aws`.

Then:

```bash
bash scripts/aws/build-push.sh staging
# set enable_web_service = true in terraform.tfvars
bash scripts/aws/infra-up.sh
bash scripts/aws/migrate.sh staging          # Fargate one-off in the VPC
pnpm smoke "$(terraform -chdir=infra/terraform output -raw cloudfront_url)"
```

A second environment (prod): **another directory or workspace** with `prod.tfvars` — do not flip `environment` in place (RDS would be replaced).

```bash
terraform workspace new prod   # optional
terraform apply -var-file=prod.tfvars
```

## Destroy

```bash
bash scripts/aws/infra-down.sh
```

Staging has `force_delete` on ECR and `skip_final_snapshot` on RDS. Prod does not skip the snapshot.

## State

Default state is local (`*.tfstate`, gitignored). To apply from a second machine later, add an S3 backend in `versions.tf` and `terraform init -migrate-state`.

## Custom domain (later)

1. ACM cert in **us-east-1**, DNS validate.
2. Add aliases on the CloudFront resource (small Terraform change).
3. Set `public_base_url = "https://staging.example.com"` and re-apply so the task gets `AUTH_URL`.
