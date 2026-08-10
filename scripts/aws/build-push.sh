#!/usr/bin/env bash
# Build the standalone image on this machine and push to ECR.
# Usage: bash scripts/aws/build-push.sh
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"
load_aws_env
require_tools
need ECR_REPOSITORY

SHA="$(git_sha)"
TAG="${ECR_REPOSITORY}:${SHA}"
LATEST_ENV="${1:-staging}"
info "Building $TAG platform=$DOCKER_PLATFORM"
aws_cli ecr get-login-password | docker login --username AWS --password-stdin "${ECR_REPOSITORY%%/*}"

docker build \
  --platform "$DOCKER_PLATFORM" \
  -t "$TAG" \
  -t "${ECR_REPOSITORY}:${LATEST_ENV}" \
  --target runner \
  "$ROOT"

docker build \
  --platform "$DOCKER_PLATFORM" \
  -t "${ECR_REPOSITORY}:${LATEST_ENV}-migrate" \
  --target migrate \
  "$ROOT"

info "Pushing $TAG and :${LATEST_ENV}"
docker push "$TAG"
docker push "${ECR_REPOSITORY}:${LATEST_ENV}"
docker push "${ECR_REPOSITORY}:${LATEST_ENV}-migrate"
echo "IMAGE=$TAG"
