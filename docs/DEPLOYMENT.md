# Deployment Instructions

This document describes how to deploy the AI Marketing Toolkit to production.

## Prerequisites

- **gcloud CLI** — `gcloud auth login` and `gcloud config set project <PROJECT_ID>`
- **Firebase CLI** — `firebase login`
- **Project** — `intonation-labs-marketing` (or your `PROJECT_ID`) with billing enabled
- **Service account** — `sa-cloud-functions@<PROJECT_ID>.iam.gserviceaccount.com` with required permissions

---

## Option A: Deploy via Git Push (CI/CD)

Pushing to `main` triggers deployment when relevant files change.

### Backend (API + Cloud Functions)

**Triggers on:** changes to `functions/**` or `Makefile`

1. Commit and push your changes:

   ```bash
   git add functions/
   git commit -m "Add CORS headers to 500 error responses"
   git push origin main
   ```

2. GitHub Actions will:
   - Lint with ruff
   - Run tests
   - Deploy `fn-tenant-pipelines`
   - Deploy `fn-scheduled-publisher`
   - Deploy `fn-analytics-sync`
   - Deploy `automark-api` (Cloud Run — includes the FastAPI API)

3. Monitor the workflow: **Actions** tab → **Deploy Cloud Functions**

### Frontend

**Triggers on:** changes to `frontend/**`, `firebase.json`, or `.firebaserc`

1. Commit and push frontend changes:

   ```bash
   git add frontend/
   git commit -m "Update frontend"
   git push origin main
   ```

2. GitHub Actions will deploy to Firebase App Hosting.

### Required GitHub Secrets (CI/CD)

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | e.g. `intonation-labs-marketing` |
| `GCP_REGION` | e.g. `asia-southeast1` |
| `GCP_SA_EMAIL` | `sa-cloud-functions@<PROJECT_ID>.iam.gserviceaccount.com` |
| `WIF_PROVIDER` | Workload Identity Federation provider |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_TO_EMAIL`, `SMTP_USE_TLS`, `SMTP_USE_SSL` | For pipeline email |
| `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT` | For frontend deploy |

---

## Option B: Deploy Manually via Makefile

Use this for quick deploys or when CI/CD is not configured.

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with PROJECT_ID, STRIPE_*, SMTP_*, etc.
# .env is included by the Makefile via: -include .env
```

### 2. Deploy the API only (recommended for the CORS fix)

To deploy just the FastAPI backend (automark-api on Cloud Run):

```bash
make deploy-api
```

Uses `PROJECT_ID`, `REGION`, `API_VARS` from Makefile (or `.env`).

### 3. Deploy full backend

```bash
make deploy
```

This deploys:

- `fn-tenant-pipelines`
- `fn-scheduled-publisher`
- `fn-analytics-sync`
- `automark-api`
- Firestore security rules

### 4. Deploy frontend

```bash
make deploy-frontend
```

Requires Firebase App Hosting backend `automark-web` to be created (`firebase init apphosting`).

---

## Quick Reference

| What you changed | Deploy command |
|------------------|----------------|
| API / functions (`functions/`) | `make deploy-api` or push to `main` |
| Full backend | `make deploy` |
| Frontend | `make deploy-frontend` or push to `main` |

---

## Firestore Vector Index (for brand context in drafts/newsletter)

Drafts and newsletter generation use vector search over `brand_chunks`. If the vector index is missing, the app falls back to empty brand context (generation still works). For full brand-aware output:

1. Sync brand documents: `make sync-brand-context` (ingests Markdown into Firestore).
2. Create the vector index (once per project):

   ```bash
   gcloud firestore indexes composite create \
     --collection-group=brand_chunks \
     --query-scope=COLLECTION \
     --field-config=field-path=embedding,vector-config='{"dimension":"2048", "flat": "{}"}' \
     --database="(default)" \
     --project=intonation-labs-marketing
   ```

   For tenant subcollections `tenants/{id}/brand_chunks`, use `--collection-group=brand_chunks` so the index applies across all tenants. The index can take several minutes to build.

---

## After Deploy

1. **Verify API** — `curl https://automark-api-qglnjkfpjq-as.a.run.app/` → `{"status":"ok","service":"intomarketing-api"}`
2. **Check Cloud Run logs** — GCP Console → Cloud Run → automark-api → Logs
3. **Test newsletter generate** — Use the dashboard; if it still fails, run the API locally (`make dev-api`) and check the 500 response body for the traceback (dev mode includes `debug` and `traceback` fields)
