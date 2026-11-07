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

require_aws() {
  command -v aws >/dev/null || die "Install AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
}

require_tools() {
  require_aws
  command -v docker >/dev/null || die "Docker/Colima must be running"
  command -v git >/dev/null || die "git is required for image tags"
}

# Run a one-off Fargate task using the migrate task family (same VPC as RDS).
# Usage: run_fargate_oneoff <label> [overrides-json]
run_fargate_oneoff() {
  local label="$1"
  local overrides="${2:-}"

  need ECS_CLUSTER
  need ECR_REPOSITORY

  local family="${ECS_MIGRATE_TASK_FAMILY:-}"
  local subnets="${ECS_SUBNETS:-}"
  local sg="${ECS_WEB_SG:-}"
  if [[ -z "$family" || -z "$subnets" || -z "$sg" ]]; then
    die "Set ECS_MIGRATE_TASK_FAMILY, ECS_SUBNETS, ECS_WEB_SG in $ENV_FILE (re-run infra-up.sh and merge .env.aws.generated)"
  fi

  local subnet_json
  subnet_json=$(printf '%s' "$subnets" | awk -F, '{
    for (i=1;i<=NF;i++) {
      gsub(/^[ \t]+|[ \t]+$/, "", $i)
      printf "\"%s\"%s", $i, (i<NF?",":"")
    }
  }')

  info "Fargate $label cluster=$ECS_CLUSTER family=$family"
  # Always seed this array: macOS bash 3.2 + set -u treats "${empty[@]}" as unbound.
  local run_args=(
    ecs run-task
    --cluster "$ECS_CLUSTER"
    --task-definition "$family"
    --launch-type FARGATE
    --count 1
    --network-configuration "awsvpcConfiguration={subnets=[$subnet_json],securityGroups=[\"$sg\"],assignPublicIp=ENABLED}"
    --query 'tasks[0].taskArn'
    --output text
  )
  if [[ -n "$overrides" ]]; then
    run_args+=(--overrides "$overrides")
  fi

  local task_arn
  task_arn=$(aws_cli "${run_args[@]}")

  [[ -n "$task_arn" && "$task_arn" != "None" ]] || die "ecs run-task did not return a task ARN (is the migrate image pushed? ${ECR_REPOSITORY}:*-migrate)"

  info "Waiting for $task_arn"
  aws_cli ecs wait tasks-stopped --cluster "$ECS_CLUSTER" --tasks "$task_arn"

  local exit_code reason
  exit_code=$(
    aws_cli ecs describe-tasks \
      --cluster "$ECS_CLUSTER" \
      --tasks "$task_arn" \
      --query 'tasks[0].containers[0].exitCode' \
      --output text
  )
  reason=$(
    aws_cli ecs describe-tasks \
      --cluster "$ECS_CLUSTER" \
      --tasks "$task_arn" \
      --query 'tasks[0].stoppedReason' \
      --output text
  )

  info "Logs: CloudWatch /ecs/${ECS_CLUSTER}-migrate (or /ecs/coupon-hub-*-migrate)"
  if [[ "$exit_code" != "0" ]]; then
    die "$label failed exit=$exit_code reason=$reason"
  fi
  info "$label done exit=0"
}

git_sha() {
  (cd /tmp && git -C "$ROOT" rev-parse --short=12 HEAD)
}

secret_to_url() {
  local id="$1"
  aws_cli secretsmanager get-secret-value --secret-id "$id" --query SecretString --output text
}
