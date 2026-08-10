#!/usr/bin/env bash
# Destroy the Terraform stack. Asks for confirmation.
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
TF="$ROOT/infra/terraform"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"

command -v terraform >/dev/null || die "Install Terraform"
[[ -d "$TF/.terraform" ]] || die "No terraform init in $TF"

echo "This deletes RDS, ECS, ALB, CloudFront, ECR images (staging), secrets."
read -r -p "Type 'destroy' to continue: " ans
[[ "$ans" == "destroy" ]] || die "aborted"

(
  cd "$TF"
  terraform destroy -input=false
)
info "Stack destroyed"
