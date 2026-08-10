#!/usr/bin/env bash
# Shared helpers for laptop AWS deploys (no GitHub OIDC).
set -euo pipefail

: "${COUPON_HUB_ROOT:=/Users/ashishmishra/Documents/affiliate}"
ROOT="$COUPON_HUB_ROOT"
ENV_FILE="${AWS_ENV_FILE:-$ROOT/.env.aws}"

die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "→ $*"; }

load_aws_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    die "Missing $ENV_FILE — copy scripts/aws/env.aws.example to .env.aws and fill it in"
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  : "${AWS_REGION:=us-east-1}"
  : "${DOCKER_PLATFORM:=linux/amd64}"
}

need() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Set $name in $ENV_FILE"
}

aws_cli() {
  if [[ -n "${AWS_PROFILE:-}" ]]; then
    aws --profile "$AWS_PROFILE" --region "$AWS_REGION" "$@"
  else
    aws --region "$AWS_REGION" "$@"
  fi
}

require_tools() {
  command -v aws >/dev/null || die "Install AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  command -v docker >/dev/null || die "Docker/Colima must be running"
  command -v git >/dev/null || die "git is required for image tags"
}

git_sha() {
  (cd /tmp && git -C "$ROOT" rev-parse --short=12 HEAD)
}

secret_to_url() {
  local id="$1"
  aws_cli secretsmanager get-secret-value --secret-id "$id" --query SecretString --output text
}
