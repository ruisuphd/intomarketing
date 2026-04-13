#!/usr/bin/env bash
# Post-deploy verification for Cloud Scheduler → HTTP Cloud Functions.
# Usage: PROJECT_ID=my-gcp-project ./scripts/verify_cloud_scheduler.sh
set -euo pipefail
PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${REGION:-asia-southeast1}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Set PROJECT_ID or GOOGLE_CLOUD_PROJECT to your GCP project id." >&2
  exit 1
fi
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"
echo "=== Cloud Scheduler jobs (project=$PROJECT_ID region=$REGION) ==="
gcloud scheduler jobs list --location="$REGION" --format="table(name,schedule,state)" || true
echo ""
echo "=== scheduled-publisher job (if present) ==="
gcloud scheduler jobs describe scheduled-publisher --location="$REGION" 2>/dev/null || echo "(job missing — set fn-scheduled-publisher in terraform.tfvars and terraform apply)"
echo ""
echo "=== Recent scheduler-related logs (filter in Console for response code) ==="
echo "gcloud logging read 'resource.type=\"cloud_scheduler_job\"' --limit=20 --project=$PROJECT_ID"
echo ""
echo "Expect HTTP 200 from the publisher function. Fix empty function_urls or OIDC SA if jobs fail."
