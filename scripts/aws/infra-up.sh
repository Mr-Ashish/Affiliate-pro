#!/usr/bin/env bash
# Create or update the AWS stack from this laptop (Terraform). No console, no OIDC.
# Usage: bash scripts/aws/infra-up.sh
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
TF="$ROOT/infra/terraform"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"

command -v terraform >/dev/null || die "Install Terraform: https://developer.hashicorp.com/terraform/install"
command -v aws >/dev/null || die "Install AWS CLI v2"

if [[ ! -f "$TF/terraform.tfvars" ]]; then
  cp "$TF/staging.tfvars.example" "$TF/terraform.tfvars"
  info "Wrote $TF/terraform.tfvars from example — edit operator_cidr / aws_profile if needed, then re-run"
fi

info "terraform init + apply in $TF"
(
  cd "$TF"
  terraform init -input=false
  terraform apply -input=false
)

GEN="$ROOT/.env.aws.generated"
terraform -chdir="$TF" output -raw env_aws_snippet >"$GEN"
info "Wrote $GEN — merge into .env.aws (gitignored)"
echo "CloudFront: $(terraform -chdir="$TF" output -raw cloudfront_url)"
echo "ECR:        $(terraform -chdir="$TF" output -raw ecr_repository_url)"
echo
echo "Next:"
echo "  1) Merge $GEN into .env.aws"
echo "  2) bash scripts/aws/build-push.sh staging"
echo "  3) Set enable_web_service = true in infra/terraform/terraform.tfvars"
echo "  4) bash scripts/aws/infra-up.sh"
echo "  5) bash scripts/aws/migrate.sh staging"
echo "  6) pnpm smoke <cloudfront_url>"
