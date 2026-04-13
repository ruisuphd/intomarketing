# Runbook: API 5xx and client-reported errors

## Error contract

JSON error responses from the IntoMarketing API include:

- `error` — stable code (`INTERNAL`, `RATE_LIMITED`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, etc.)
- `detail` — human-readable message or structured payload (e.g. legal acceptance)
- `trace_id` — correlation id (also returned as response header `X-Request-ID`)

Validation failures (`422`) add `fields` with `loc`, `msg`, and `type` per item.

## Triage from a user report

1. Collect `trace_id` from the user (support UI, devtools Network response, or JSON body).
2. In **Google Cloud Logging** (or your log sink), query:
   - `trace_id="<id>"` or `jsonPayload.trace_id="<id>"` depending on log format.
3. Match the log entry to `path`, `method`, and `status_code` from `api.request` lines.
4. For chat or Gemini issues, search for the same window:
   - `chat.error`, `chat.stream_error`, `gemini.error`, `gemini.retry`, `chat.parse_repair_failed`.

## Scheduler / Cloud Functions

HTTP schedulers (`run_tenant_pipelines`, `run_scheduled_publisher`, `run_analytics_sync`) return JSON with `trace_id` on failure and log `*.error` with the same id. Use that id in logs; if `SENTRY_DSN` is set, exceptions are also sent to Sentry with tags `trace_id` and `job`.

## Sentry alert suggestions

Configure alerts (Discover or Issues) for:

| Signal | Suggested threshold |
|--------|---------------------|
| Issue: `INTERNAL` / unhandled API exceptions | New issue or spike vs 24h baseline |
| Message: `chat.parse_repair_failed` | &gt; N/hour per environment |
| Message: `gemini.model_fallback_attempt` | Sustained increase (capacity/model degradation) |
| Message: `gemini.json_repair_success` | Optional informational dashboard (recovery rate) |
| Tag `job` + unresolved | Scheduler failures grouped by job name |

Tune N per traffic volume after a week of baselines.

## Related

- Dead-letter replay for async pipelines: [dlq-replay.md](./dlq-replay.md) (Pub/Sub DLQ topics and replay procedure).
