#!/usr/bin/env bash
# Point the running web service at the image just pushed (laptop, no OIDC).
# Usage: bash scripts/aws/deploy-web.sh staging|prod
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"
load_aws_env
require_tools
need ECR_REPOSITORY
need WEB_COMPUTE

ENV_NAME="${1:-staging}"
SHA="$(git_sha)"
IMAGE="${ECR_REPOSITORY}:${SHA}"

case "$ENV_NAME" in
  staging|prod|production) ;;
  *) die "Usage: bash scripts/aws/deploy-web.sh staging|prod" ;;
esac
[[ "$ENV_NAME" == production ]] && ENV_NAME=prod

info "Deploy $ENV_NAME compute=$WEB_COMPUTE image=$IMAGE"

if [[ "$WEB_COMPUTE" == "apprunner" ]]; then
  if [[ "$ENV_NAME" == "prod" ]]; then
    need APPRUNNER_SERVICE_ARN_PROD
    ARN="$APPRUNNER_SERVICE_ARN_PROD"
  else
    need APPRUNNER_SERVICE_ARN_STAGING
    ARN="$APPRUNNER_SERVICE_ARN_STAGING"
  fi
  aws_cli apprunner update-service \
    --service-arn "$ARN" \
    --source-configuration "ImageRepository={ImageIdentifier=${ECR_REPOSITORY}:${ENV_NAME},ImageRepositoryType=ECR,ImageConfiguration={Port=3000}}" \
    >/dev/null
  info "App Runner update started: $ARN"
elif [[ "$WEB_COMPUTE" == "ecs" ]]; then
  need ECS_CLUSTER
  if [[ "$ENV_NAME" == "prod" ]]; then
    SVC="${ECS_SERVICE_PROD:-coupon-hub-web-prod}"
  else
    SVC="${ECS_SERVICE_STAGING:-coupon-hub-web-staging}"
  fi
  aws_cli ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$SVC" \
    --force-new-deployment \
    >/dev/null
  info "ECS rolling deploy started: $ECS_CLUSTER/$SVC"
  aws_cli ecs wait services-stable --cluster "$ECS_CLUSTER" --services "$SVC"
  info "ECS service stable"
else
  die "WEB_COMPUTE must be apprunner or ecs"
fi
