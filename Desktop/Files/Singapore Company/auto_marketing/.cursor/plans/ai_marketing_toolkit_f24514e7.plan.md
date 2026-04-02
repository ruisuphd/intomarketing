---
name: AI Marketing Toolkit
overview: Complete technical implementation plan for a simplified AI-powered marketing and client acquisition toolkit for Intonation Labs — daily content generation across 6 platforms (LinkedIn, Instagram, TikTok, X, Reddit, Xiaohongshu), client signal detection, and outreach drafting, all delivered to a private dashboard for manual review and posting. No platform API integrations, no automated publishing, no video generation.
todos:
  - id: phase-0
    content: "Phase 0 — Foundation: GCP project, Terraform, Firebase Auth, Claude client, embedder, logger, Pydantic models, fn-api skeleton, Next.js scaffold, CI/CD, monitoring"
    status: completed
  - id: phase-1
    content: "Phase 1 — RAG Brain: Chunker, document ingest pipeline, Firestore vector index (3072d), retriever, /documents page, upload + test brand docs"
    status: completed
  - id: phase-2
    content: "Phase 2 — Intelligence + Content: Source adapters (RSS, Reddit), intelligence gather, Claude scoring, dedup, content orchestrator, Pub/Sub fan-out, 6 platform generators (LinkedIn, Instagram, TikTok, X, Reddit, Xiaohongshu), package builder, /intelligence + /drafts + /dashboard pages"
    status: completed
  - id: phase-3
    content: "Phase 3 — Client Acquisition: Signal detection, ICP qualification, outreach generation, CAN-SPAM/CASL/GDPR compliance, suppress list, compliance checklist UI, retention cleanup, /signals + /leads + /outreach pages, security audit for no-auto-send"
    status: completed
isProject: false
---

# AI-Powered Marketing Toolkit — Technical Implementation Plan

**Firm**: Intonation Labs Pte. Ltd. (Singapore)
**Founder**: Rui Su — sole operator, bilingual English/Mandarin
**Purpose**: Daily AI research + content drafts + client signal detection, reviewed on a private dashboard, posted manually

---

## 1. REPOSITORY STRUCTURE

```
auto_marketing/
├── frontend/                              # Next.js 14 App Router dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                 # Root layout: providers, fonts, metadata
│   │   │   ├── globals.css                # Tailwind base + custom tokens
│   │   │   ├── login/
│   │   │   │   └── page.tsx               # Google SSO via Firebase Auth
│   │   │   └── (auth)/                    # Route group: all pages behind auth guard
│   │   │       ├── layout.tsx             # Sidebar nav + Firebase Auth check
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx           # Daily overview: content + leads packages
│   │   │       ├── intelligence/
│   │   │       │   └── page.tsx           # Today's gathered items, relevance scores
│   │   │       ├── drafts/
│   │   │       │   ├── page.tsx           # [AMENDED: TK] 6 platform tabs, inline editing, download
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx       # Single draft editor (approve/reject/edit)
│   │   │       ├── signals/
│   │   │       │   └── page.tsx           # Signal feed: qualify / dismiss actions
│   │   │       ├── leads/
│   │   │       │   └── page.tsx           # Qualified leads list, ICP scores
│   │   │       ├── outreach/
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx       # Outreach editor: DM + email + compliance
│   │   │       ├── documents/
│   │   │       │   └── page.tsx           # Brand doc upload, RAG index status
│   │   │       └── settings/
│   │   │           └── page.tsx           # Sources, schedule, suppress list
│   │   ├── components/
│   │   │   ├── ui/                        # shadcn/ui primitives (Button, Card, Badge, etc.)
│   │   │   ├── nav/
│   │   │   │   └── sidebar.tsx            # Main sidebar with route links
│   │   │   ├── intelligence/
│   │   │   │   ├── intel-card.tsx          # Intelligence item card (score, tags, source)
│   │   │   │   └── intel-filters.tsx       # Filter by source, date, relevance
│   │   │   ├── drafts/
│   │   │   │   ├── draft-card.tsx          # Draft card with platform badge + status
│   │   │   │   ├── draft-editor.tsx        # Inline text editor with char counter
│   │   │   │   ├── platform-tabs.tsx       # [AMENDED: TK] Tab bar: LinkedIn | IG | TikTok | X | Reddit | XHS
│   │   │   │   └── char-counter.tsx        # Per-platform character limit indicator
│   │   │   ├── signals/
│   │   │   │   ├── signal-card.tsx         # Signal card: type, strength, company, actions
│   │   │   │   └── qualify-panel.tsx       # [AMENDED: B3] Slide-over Sheet for signal qualification
│   │   │   ├── leads/
│   │   │   │   ├── lead-card.tsx           # Lead card: ICP score, services, status
│   │   │   │   └── pii-form.tsx            # Labelled PII input (name, email, LinkedIn)
│   │   │   ├── outreach/
│   │   │   │   ├── outreach-editor.tsx     # Tabbed DM + email editor
│   │   │   │   └── compliance-checklist.tsx # Non-dismissable compliance checkboxes
│   │   │   ├── documents/
│   │   │   │   ├── doc-uploader.tsx        # Drag-and-drop upload with progress bar
│   │   │   │   └── doc-list.tsx            # Document list with chunk count + status
│   │   │   ├── packages/
│   │   │   │   └── package-download.tsx    # Download button with signed URL fetch
│   │   │   └── shared/
│   │   │       ├── platform-badge.tsx      # Platform icon + label
│   │   │       ├── status-badge.tsx        # Color-coded status chip
│   │   │       └── loading.tsx             # Skeleton loaders
│   │   ├── lib/
│   │   │   ├── firebase.ts                # Firebase client SDK init (auth + firestore)
│   │   │   ├── firestore.ts               # Typed Firestore query helpers
│   │   │   ├── api.ts                     # HTTP client for fn-api (fetch wrapper)
│   │   │   └── auth.ts                    # Auth context provider + route guard
│   │   ├── hooks/
│   │   │   ├── use-auth.ts                # Auth state hook (user, loading, signOut)
│   │   │   └── use-firestore.ts           # Real-time Firestore subscription hooks
│   │   └── types/
│   │       └── index.ts                   # Shared TypeScript types (mirrors Pydantic)
│   ├── public/
│   │   └── favicon.ico
│   ├── Dockerfile                         # Multi-stage build for Cloud Run deployment
│   ├── next.config.ts                     # Next.js config (standalone output)
│   ├── tailwind.config.ts                 # Tailwind + shadcn/ui theme tokens
│   ├── tsconfig.json
│   └── package.json
│
├── functions/                             # Python Cloud Functions (2nd gen), single source
│   ├── main.py                            # All function entry points (one per function)
│   ├── requirements.txt                   # Pinned Python dependencies
│   │
│   ├── api/                               # [AMENDED: A3] HTTP API for dashboard interactions
│   │   ├── app.py                         # FastAPI app with APIRouter registration
│   │   ├── middleware/
│   │   │   └── auth.py                    # Firebase ID token verification (FastAPI Depends)
│   │   └── routes/
│   │       ├── intelligence.py            # GET /intelligence, POST /intelligence/refresh
│   │       ├── drafts.py                  # GET/PATCH /drafts, POST /drafts/:id/approve
│   │       ├── signals.py                 # GET /signals, PATCH /signals/:id/qualify
│   │       ├── leads.py                   # GET/POST/PATCH/DELETE /leads
│   │       ├── outreach.py               # GET/PATCH /outreach, POST /outreach/generate
│   │       ├── documents.py              # GET /documents, POST /documents/upload-url
│   │       ├── packages.py               # GET /packages, POST /packages/:id/download-url
│   │       ├── settings.py               # GET/PATCH /settings
│   │       └── compliance.py             # POST /leads/:id/export-pii, DELETE /leads/:id
│   │
│   ├── engines/                           # Core business logic per engine
│   │   ├── intelligence.py                # Source fetching, Claude scoring, dedup
│   │   ├── document_ingest.py             # Parse, chunk, embed, store
│   │   ├── content_orchestrate.py         # Select top items, publish fan-out messages
│   │   ├── platform_generate.py           # RAG retrieval + Claude generation per platform
│   │   ├── signals.py                     # Signal detection + Claude classification
│   │   ├── qualification.py               # ICP qualification via RAG
│   │   ├── outreach_generate.py           # LinkedIn DM + cold email generation
│   │   ├── packaging.py                   # ZIP assembly (content + leads)
│   │   └── retention.py                   # TTL enforcement + suppress list cleanup
│   │
│   ├── shared/                            # Shared utilities
│   │   ├── claude_client.py               # Vertex AI Claude wrapper (async, backoff, retry)
│   │   ├── embedder.py                    # Vertex AI embedding (gemini-embedding-001, 3072d)
│   │   ├── chunker.py                     # Boundary-aware 512-token chunker (64 overlap)
│   │   ├── retriever.py                   # Firestore vector search (top-k, language filter)
│   │   ├── models.py                      # Pydantic models for all Firestore documents
│   │   ├── firestore_client.py            # Typed Firestore read/write helpers
│   │   ├── storage_client.py              # Cloud Storage upload/download/signed-URL
│   │   ├── pubsub_client.py               # Pub/Sub publish helper
│   │   ├── logger.py                      # Structured logging (severity levels)
│   │   └── source_adapters/               # Intelligence source connectors
│   │       ├── base.py                    # Abstract SourceAdapter interface
│   │       ├── rss.py                     # Generic RSS/Atom adapter (feedparser)
│   │       ├── reddit.py                  # Reddit API read-only adapter (praw)
│   │       └── x_api.py                   # X API search adapter (disabled by default)
│   │
│   └── prompts/                           # Claude prompt templates (one per use case)
│       ├── __version__.py                 # [AMENDED: C4] Prompt version registry (name→semver)
│       ├── intelligence_scorer.py         # Summarise + relevance score + tags
│       ├── linkedin.py                    # LinkedIn thought leadership post
│       ├── instagram.py                   # Instagram caption + stories variant
│       ├── x_twitter.py                   # Tweet + optional thread
│       ├── reddit_prompt.py               # Reddit title + long-form Markdown body
│       ├── xiaohongshu.py                 # Simplified Chinese 小红书 post
│       ├── tiktok.py                      # [AMENDED: TK] TikTok photo/text post (no video)
│       ├── signal_classifier.py           # Buying signal classification
│       ├── icp_qualifier.py               # ICP fit assessment
│       └── outreach.py                    # LinkedIn DM + cold email drafts
│
├── infra/                                 # Terraform IaC for all GCP resources
│   ├── main.tf                            # Provider config, module composition
│   ├── variables.tf                       # Input variables (project_id, region, etc.)
│   ├── outputs.tf                         # Function URLs, bucket names, etc.
│   ├── terraform.tfvars.example           # Example variable values
│   └── modules/
│       ├── project/
│       │   └── main.tf                    # API enablement, service accounts
│       ├── firestore/
│       │   └── main.tf                    # Database, collections, indexes (incl. vector)
│       ├── storage/
│       │   └── main.tf                    # brand-documents bucket, packages bucket
│       ├── functions/
│       │   └── main.tf                    # All Cloud Function 2nd gen deployments
│       ├── pubsub/
│       │   └── main.tf                    # Topics, subscriptions, DLQ
│       ├── scheduler/
│       │   └── main.tf                    # 4 scheduled jobs
│       ├── secrets/
│       │   └── main.tf                    # Secret Manager entries
│       ├── hosting/
│       │   └── main.tf                    # Firebase Hosting + Cloud Run (frontend)
│       └── monitoring/
│           └── main.tf                    # Error Reporting, alerts, log sinks
│
├── .github/
│   └── workflows/
│       ├── deploy-functions.yml           # Deploy Python functions on push to main
│       ├── deploy-frontend.yml            # Build + deploy Next.js to Cloud Run
│       └── terraform-plan.yml             # Terraform plan on PR, apply on merge
│
├── firebase.json                          # Firebase Hosting rewrites config
├── .firebaserc                            # Firebase project alias
├── Makefile                               # Local dev commands (deploy, test, lint)
├── .env.example                           # Required environment variables template
└── README.md                              # Setup instructions, architecture overview
```

**Key structural decisions:**

- Single `functions/` source directory shared across all Cloud Function deployments (each deployed with a different `--entry-point`)
- No `publishers/`, no `oauth/`, no `calendar/`, no `platforms/` directories
- [AMENDED: A3] fn-api uses FastAPI with uvicorn, not Flask. All route handlers are `async def`. Request/response validation via Pydantic models already defined in `models.py`.
- [AMENDED: C4] Prompt templates are Python modules with explicit version strings in `prompts/__version__.py`. Never edited via dashboard UI — changes go through git.
- Frontend uses `output: 'standalone'` in next.config.ts for Cloud Run containerisation

---

## 2. FIRESTORE DATA MODELS

Region: `asia-southeast1` (Singapore) — single-region for latency and cost

### 2.1 `users` collection

```
users/{uid}
├── email: string
├── display_name: string
├── photo_url: string | null
├── role: string                    # "admin" | "viewer"
├── created_at: timestamp
└── last_login: timestamp
```

No indexes beyond default. Single admin user expected.

### 2.2 `intelligence_items` collection [AMENDED: A2]

```
intelligence_items/{item_id}
├── source_url: string              # Deduplicate key (unique within 48h window)
├── source_type: string             # "google_news_rss" | "reddit" | "rss_competitor"
│                                   # | "crunchbase_rss" | "techcrunch_rss"
├── source_name: string             # Human-readable source name
├── title: string
├── raw_content: string             # Full text from source
├── summary: string                 # Claude: 2-3 sentence summary
├── relevance_score: number         # Claude: 0.0-1.0
├── relevance_reasoning: string     # Claude: one-sentence justification
├── tags: string[]                  # Claude: topic tags
├── batch_date: string              # "YYYY-MM-DD"
├── gathered_at: timestamp
├── dedup_window_expires: timestamp  # gathered_at + 48 hours
├── is_used_for_content: boolean    # True if selected by content orchestrator
└── expires_at: timestamp           # gathered_at + 180 days (TTL field)
```

**[AMENDED: A2] No vector field.** Semantic deduplication of titles is performed in-memory within `fn-intelligence-gather` (see Section 3.2). Title embeddings are never written to Firestore. The only Firestore vector index is on `brand_chunks.embedding`.

**Composite indexes:**

- `(batch_date ASC, relevance_score DESC)` — daily top items query
- `(source_url ASC, dedup_window_expires DESC)` — URL dedup check

### 2.3 `brand_documents` collection

```
brand_documents/{doc_id}
├── filename: string
├── storage_path: string            # gs://brand-documents-{project}/...
├── file_type: string               # "pdf" | "docx" | "md"
├── file_size_bytes: number
├── doc_type: string                # "brand_voice" | "service_description" |
│                                   # "case_study" | "icp_definition" |
│                                   # "outreach_guide" | "other"
├── language: string                # "en" | "zh"
├── status: string                  # "uploaded" | "processing" | "indexed" | "error"
├── chunk_count: number
├── uploaded_by: string             # uid
├── uploaded_at: timestamp
├── processed_at: timestamp | null
└── error_message: string | null
```

**Composite indexes:**

- `(status ASC, uploaded_at DESC)` — document list page

### 2.4 `brand_chunks` collection (with vector field)

```
brand_chunks/{chunk_id}
├── document_id: string             # FK -> brand_documents
├── chunk_index: number             # Sequential position within document
├── text: string                    # Chunk text content
├── token_count: number
├── embedding: vector(3072)         # Vertex AI gemini-embedding-001
├── language: string                # "en" | "zh" (inherited from parent doc)
├── doc_type: string                # Inherited from parent doc
└── created_at: timestamp
```

**Vector index (critical — must be created before any vector queries):**

- Field: `embedding`, dimension: 3072, distance: COSINE, type: FLAT
- Composite vector index with `language` pre-filter:
`gcloud firestore indexes composite create --collection-group=brand_chunks --query-scope=COLLECTION --field-config=field-path=language,order=ASCENDING --field-config=field-path=embedding,vector-config='{"dimension":"3072","flat":{}}'`

**Composite indexes:**

- `(document_id ASC, chunk_index ASC)` — ordered chunk retrieval

### 2.5 `post_drafts` collection

```
post_drafts/{draft_id}
├── batch_id: string                # FK -> content_packages
├── batch_date: string              # "YYYY-MM-DD"
├── platform: string                # [AMENDED: TK] "linkedin" | "instagram" | "x_twitter" |
│                                   # "reddit" | "xiaohongshu" | "tiktok"
├── content: map
│   ├── text: string                # Main post body (all platforms)
│   ├── hashtags: string[]          # LinkedIn, IG, X, XHS, TikTok
│   ├── thread: string[]            # X only (optional, 2-4 tweets)
│   ├── stories_variant: string     # Instagram only (max 125 chars)
│   ├── hook_line: string           # [AMENDED: TK] TikTok only (max 100 chars, text overlay)
│   ├── title: string               # Reddit and XHS only
│   ├── suggested_subreddit: string # Reddit only
│   ├── suggested_flair: string     # Reddit only
│   └── emoji_tags: string[]        # XHS only (2-4 emoji tags)
├── image_prompt_midjourney: string  # [AMENDED: TK] LinkedIn, IG, X, TikTok (Midjourney format with --ar, --style raw)
├── image_prompt_canva: string      # [AMENDED: TK] LinkedIn, IG, X, TikTok (Canva AI simple description)
├── image_prompts_zh: string[]      # XHS only (multiple Chinese image prompts, unchanged)
├── source_intelligence_ids: string[] # FK -> intelligence_items (top 3)
├── brand_chunk_ids: string[]       # Chunk IDs used for RAG transparency
├── status: string                  # "pending" | "approved" | "rejected" | "edited"
├── topic_override: string | null   # Non-null for manual generation
├── prompt_version: string          # [AMENDED: C4] From PROMPT_VERSIONS[platform] at generation time
├── char_count: number              # Actual character count of main text
├── generated_at: timestamp
├── reviewed_at: timestamp | null
└── reviewed_by: string | null      # uid
```

**Composite indexes:**

- `(batch_date ASC, platform ASC)` — daily content view
- `(status ASC, batch_date DESC)` — pending drafts queue

### 2.6 `content_packages` collection [AMENDED: A1]

```
content_packages/{package_id}
├── batch_date: string              # "YYYY-MM-DD"
├── package_type: string            # "content" | "leads"
├── status: string                  # "generating" | "packaging" | "ready" | "partial" | "expired"
├── total_count: number             # [AMENDED: TK] Expected draft count (6 for content)
├── completed_count: number         # Atomically incremented; triggers packaging at == total
├── draft_ids: string[]             # FK -> post_drafts (populated as drafts complete)
├── failed_platforms: string[]      # [AMENDED: A1] Platforms that exhausted retries (default [])
├── has_warnings: boolean           # [AMENDED: A1] True if package is partial (default false)
├── storage_path: string | null     # gs://packages-{project}/content_package_YYYY-MM-DD.zip
├── download_url: string | null     # Signed URL (7-day expiry)
├── url_expires_at: timestamp | null
├── intelligence_item_ids: string[] # Top 3 items used
├── created_at: timestamp
└── completed_at: timestamp | null
```

**Composite indexes:**

- `(package_type ASC, batch_date DESC)` — latest package per type
- `(status ASC, url_expires_at ASC)` — expired URL cleanup
- [AMENDED: A1] `(status ASC, created_at ASC)` — stale package recovery query
- [AMENDED: A1] `(has_warnings ASC, batch_date DESC)` — warning badge display

### 2.7 `prospect_signals` collection

```
prospect_signals/{signal_id}
├── source_url: string
├── source_type: string             # Same enum as intelligence_items
├── source_name: string
├── title: string
├── raw_content: string
├── summary: string                 # Claude: 2-3 sentences
├── is_buying_signal: boolean       # Claude classification
├── signal_type: string             # "hiring_ai_role" | "funding_received" |
│                                   # "pain_point_expressed" | "competitor_move" |
│                                   # "digital_transformation_signal"
├── strength_score: number          # Claude: 1-10
├── company_name: string            # Claude: extracted from content
├── reasoning: string               # Claude: one sentence
├── status: string                  # "new" | "qualified" | "dismissed" | "converted"
├── batch_date: string              # "YYYY-MM-DD"
├── detected_at: timestamp
└── expires_at: timestamp           # detected_at + 180 days (TTL field)
```

**Composite indexes:**

- `(batch_date ASC, strength_score DESC)` — daily top signals
- `(status ASC, detected_at DESC)` — signal queue
- `(company_name ASC, detected_at DESC)` — signals per company

### 2.8 `qualified_leads` collection (PII-bearing)

```
qualified_leads/{lead_id}
├── signal_id: string               # FK -> prospect_signals
├── company_name: string
├── company_location: string | null # For CASL detection
├── icp_fit: string                 # "high" | "medium" | "low"
├── icp_fit_score: number           # 0.0-1.0
├── icp_reasoning: string           # Claude: 2-3 sentences
├── matching_services: string[]     # From firm's service catalogue
├── suggested_outreach_angle: string
├── brand_chunk_ids: string[]       # RAG chunks used
│
│   # --- PII fields (all annotated in Pydantic with pii=True) ---
├── contact_name: string | null     # [pii: true] Entered manually by founder
├── contact_title: string | null    # [pii: true]
├── contact_email: string | null    # [pii: true] Business email only
├── contact_linkedin_url: string | null # [pii: true]
│
├── status: string                  # "qualified" | "outreach_drafted" | "sent" |
│                                   # "replied" | "archived"
├── is_pinned: boolean              # True exempts from TTL
├── qualified_at: timestamp
├── qualified_by: string            # uid
├── created_at: timestamp
└── expires_at: timestamp | null    # created_at + 365 days; null if is_pinned
```

**Composite indexes:**

- `(status ASC, icp_fit_score DESC)` — leads ranked by fit
- `(is_pinned ASC, expires_at ASC)` — retention cleanup query

### 2.9 `outreach_drafts` collection

```
outreach_drafts/{draft_id}
├── lead_id: string                 # FK -> qualified_leads
├── company_name: string            # Denormalised for display
├── draft_type: string              # "linkedin_dm" | "cold_email"
├── content: map
│   │   # --- For linkedin_dm ---
│   ├── message: string             # Max 300 chars
│   │   # --- For cold_email ---
│   ├── subject: string
│   ├── body: string                # 3 paragraphs
│   ├── physical_address: string    # CAN-SPAM required (Pydantic-validated)
│   └── unsubscribe_note: string    # CAN-SPAM required (Pydantic-validated)
│
├── compliance_flags: map
│   ├── can_spam_ok: boolean        # True only when physical_address + unsubscribe present
│   ├── casl_warning: boolean       # True if company_location indicates Canada
│   ├── gdpr_applicable: boolean    # True if company_location indicates EU/EEA
│   ├── suppress_list_checked: boolean # Set by system before generation
│   └── human_reviewed: boolean     # Set by founder in UI
│
├── status: string                  # "pending_human_review" | "approved" | "sent" | "archived"
├── sent_at: timestamp | null       # Only set by manual "Mark as Sent"
├── sent_by: string | null          # uid — only set by manual action
├── compliance_checklist_completed: boolean  # Gate for "Mark as Sent" button
├── generated_at: timestamp
└── brand_chunk_ids: string[]       # RAG chunks used
```

**Composite indexes:**

- `(lead_id ASC, draft_type ASC)` — drafts per lead
- `(status ASC, generated_at DESC)` — pending review queue

### 2.10 `suppress_list` collection [AMENDED: C5]

```
suppress_list/{entry_id}
├── type: string                    # "email" | "domain"
├── value: string                   # Email address or domain
├── reason: string                  # "opt_out" | "deletion_request" | "manual"
├── added_at: timestamp
└── added_by: string                # uid
```

**[AMENDED: C5] Domain-level matching:** When checking the suppress list before outreach generation, extract the domain from `contact_email` and query for both `(type=="email", value==contact_email)` AND `(type=="domain", value==domain)`. If ANY match is found, block outreach. When auto-populating on lead deletion, add BOTH an email entry and a domain entry.

**Composite indexes:**

- `(type ASC, value ASC)` — uniqueness check before outreach generation (covers both email and domain lookups)

### 2.11 `system_config` collection (singleton documents)

```
system_config/intelligence_sources
├── sources: array of map
│   ├── id: string                  # Unique source identifier
│   ├── name: string                # Human-readable name
│   ├── type: string                # "google_news_rss" | "reddit" | "rss" |
│   │                               # "crunchbase_rss" | "techcrunch_rss" | "x_api"
│   ├── url: string                 # RSS feed URL (for RSS types)
│   ├── subreddit: string           # Subreddit name (for Reddit type)
│   ├── keywords: string[]          # Search keywords (for X API type)
│   ├── enabled: boolean            # Toggle per source
│   └── category: string            # "industry_news" | "competitor" | "funding" | "community"

system_config/generation
├── intelligence_gather_cron: string    # "0 7 * * *" (default)
├── content_generate_cron: string      # "30 7 * * *" (default, 30m after intel)
├── signal_detect_cron: string         # "0 8 * * *" (default)
├── retention_cleanup_cron: string     # "0 4 * * *" (UTC, not SGT)
├── auto_package: boolean              # If true, package all pending (not just approved)
├── timezone: string                   # "Asia/Singapore"
├── top_k_intelligence: number         # 3 (items for content generation)
├── default_language: string           # "en"
├── daily_digest_enabled: boolean      # [AMENDED: C3] Default false. Opt-in via /settings.
└── daily_digest_email: string         # [AMENDED: C3] Founder sets this in /settings. "" = disabled.

system_config/compliance
├── physical_address: string           # Required for CAN-SPAM cold emails
├── unsubscribe_email: string          # e.g. unsubscribe@intonationlabs.com
├── privacy_policy_url: string
├── data_retention_days_signals: number # 180
├── data_retention_days_leads: number   # 365
└── firm_name: string                  # "Intonation Labs Pte. Ltd."
```

---

## 3. CLOUD FUNCTIONS INVENTORY

All functions: Python 3.12, 2nd gen, `asia-southeast1`, min_instances=0, deployed from `functions/` source directory.

### 3.1 fn-api [AMENDED: A3, C1, C6]


| Field               | Value                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Trigger**         | HTTP                                                                                                          |
| **Entry point**     | `api`                                                                                                         |
| **Purpose**         | REST API for all dashboard CRUD operations                                                                    |
| **Input**           | HTTP requests with Firebase ID token in Authorization header                                                  |
| **Output**          | JSON responses                                                                                                |
| **Dependencies**    | [AMENDED: A3] fastapi, uvicorn[standard], httpx, firebase-admin, google-cloud-firestore, google-cloud-storage |
| **Memory**          | 512 MB                                                                                                        |
| **Timeout**         | 60s                                                                                                           |
| **Concurrency**     | 80 (Cloud Run default)                                                                                        |
| **Cmd**             | [AMENDED: A3] `uvicorn api.app:app --host 0.0.0.0 --port 8080 --workers 4`                                    |
| **Est. cost/month** | $0 (within free tier at ~3K requests/day)                                                                     |


**[AMENDED: A3] FastAPI migration:**

- `app.py`: `FastAPI()` instead of `Flask()`. Routes registered via `APIRouter` per module (not Flask blueprints).
- All route handlers are `async def`. Request body validation via Pydantic models (already in `models.py`). Response models declared on routes.
- `middleware/auth.py`: FastAPI dependency injection — `async def verify_token(authorization: str = Header(...)) -> dict`. Applied as `Depends(verify_token)` on protected routes.
- All route files (`api/routes/*.py`) use `APIRouter` pattern.
- No changes to frontend `lib/api.ts` — HTTP interface is identical.

**[AMENDED: C1] Request-level caching:**

- In-memory cache using a Python dict with TTL: `_cache: dict[str, tuple[any, float]] = {}`
- Cache key pattern: `"{collection}:{query_hash}:{batch_date}"`
- TTL: 60s for list queries, 5s for single-document queries
- Applied to: `GET /intelligence`, `GET /signals`, `GET /drafts` (list only)
- NOT cached: mutation responses, package download URLs, outreach drafts
- Cache is per Cloud Run instance (not shared) — acceptable for single-user dashboard
- Cache hit/miss logged at DEBUG level
- Why not Redis: overkill for single-user dashboard. Instance-local cache gives 90% of the benefit at zero infrastructure cost.

**[AMENDED: C6] Health check endpoint:**

- `GET /api/health` — NO authentication required (public endpoint for external uptime monitoring)
- Response: `{ "status": "ok"|"degraded"|"down", "checks": { "firestore", "vertex_ai", "last_intelligence_gather", "last_content_generation", "last_signal_detect", "packages_today": { "content", "leads" } } }`
- Firestore check: lightweight read of `system_config/generation`
- Vertex AI check: query `intelligence_items` for today's `batch_date` count > 0
- No external API calls in health check — target <500ms response

Routes: see Section 7 for page-by-page data source mapping.

### 3.2 fn-intelligence-gather


| Field             | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Trigger**       | HTTP (invoked by Cloud Scheduler with OIDC auth)                                     |
| **Entry point**   | `intelligence_gather`                                                                |
| **Purpose**       | Fetch news/posts from all enabled sources, Claude-score each, deduplicate, store     |
| **Input**         | None (reads system_config/intelligence_sources)                                      |
| **Output**        | Writes to intelligence_items collection                                              |
| **Dependencies**  | feedparser, praw, anthropic[vertex], google-cloud-firestore, google-cloud-aiplatform |
| **Memory**        | 512 MB                                                                               |
| **Timeout**       | 540s                                                                                 |
| **Est. cost/run** | ~$0.32 (Claude: ~22K input + ~3K output tokens)                                      |


**Logic:** [AMENDED: A2]

1. Read enabled sources from `system_config/intelligence_sources`
2. For each source adapter: fetch items published in last 24h
3. URL dedup: skip if `source_url` already exists with `dedup_window_expires > now`
4. Batch-call Claude (one call per item): summarise, score relevance, extract tags
5. Embed all titles in a single batch call to `embedder.py` (task_type=SEMANTIC_SIMILARITY)
6. **[AMENDED: A2] In-memory dedup only**: store embeddings in a local Python list — never written to Firestore. Compute pairwise cosine similarity using numpy: `sim = dot(a, b) / (norm(a) * norm(b))`. For any pair with sim > 0.85, discard the lower-scored item. Embeddings are discarded when the function exits.
7. Write only surviving items to `intelligence_items` (**without** any embedding field)
8. Log: item counts per source, dedup stats, total tokens used

### 3.3 fn-document-ingest


| Field             | Value                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Trigger**       | Eventarc — `google.cloud.storage.object.v1.finalized` on `brand-documents-{project}` bucket |
| **Entry point**   | `document_ingest`                                                                           |
| **Purpose**       | Parse uploaded doc, chunk, embed, store vectors in brand_chunks                             |
| **Input**         | Cloud Storage event (bucket, object name)                                                   |
| **Output**        | Writes to brand_chunks collection, updates brand_documents status                           |
| **Dependencies**  | pypdf2, python-docx, markdown, tiktoken, google-cloud-aiplatform, google-cloud-firestore    |
| **Memory**        | 1024 MB                                                                                     |
| **Timeout**       | 540s                                                                                        |
| **Est. cost/run** | ~$0.01 (embedding only; ~50 chunks per doc avg)                                             |


**Logic:**

1. Download file from Cloud Storage
2. Parse based on file_type: PDF (pypdf2), DOCX (python-docx), MD (markdown)
3. Extract plain text
4. Chunk: 512 tokens, 64 token overlap, sentence-boundary-aware (split on `.!?` then merge to target size)
5. For each chunk: embed via `embedder.py` (task_type=RETRIEVAL_DOCUMENT, 3072 dimensions)
6. Write chunks to `brand_chunks` with embedding vector
7. Update `brand_documents` status to "indexed", set `chunk_count`
8. On error: update status to "error", write `error_message`

### 3.4 fn-content-orchestrate


| Field             | Value                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Trigger**       | HTTP (invoked by Cloud Scheduler + manual via fn-api)                                       |
| **Entry point**   | `content_orchestrate`                                                                       |
| **Purpose**       | [AMENDED: TK] Select top intelligence items, create batch, fan out to 6 platform generators |
| **Input**         | Optional: `{topic_override: string}` for manual generation                                  |
| **Output**        | Creates content_packages doc, publishes 5 Pub/Sub messages                                  |
| **Dependencies**  | google-cloud-pubsub, google-cloud-firestore                                                 |
| **Memory**        | 256 MB                                                                                      |
| **Timeout**       | 60s                                                                                         |
| **Est. cost/run** | $0 (no Claude calls; Pub/Sub publish only)                                                  |


**Logic:**

1. If no `topic_override`: query `intelligence_items` for today's `batch_date`, order by `relevance_score DESC`, take top 3
2. [AMENDED: TK] Create `content_packages` doc with `status: "generating"`, `total_count: 6`, `completed_count: 0`
3. [AMENDED: TK] Publish 6 messages to `content-generate` topic, one per platform:
  `{batch_id, platform, intelligence_item_ids, topic_override}`
4. Mark selected intelligence items as `is_used_for_content: true`

### 3.5 fn-platform-generate


| Field             | Value                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| **Trigger**       | Pub/Sub subscription on `content-generate` topic                               |
| **Entry point**   | `platform_generate`                                                            |
| **Purpose**       | Generate one platform-specific content draft via RAG + Claude                  |
| **Input**         | Pub/Sub message: `{batch_id, platform, intelligence_item_ids, topic_override}` |
| **Output**        | Writes to post_drafts, updates content_packages (batch completion detection)   |
| **Dependencies**  | anthropic[vertex], google-cloud-firestore, google-cloud-aiplatform             |
| **Memory**        | 512 MB                                                                         |
| **Timeout**       | 300s                                                                           |
| **Est. cost/run** | [AMENDED: C2] ~$0.04 (Claude: ~500 input + ~400 output tokens per platform)    |


**Logic:** [AMENDED: A4, C2, C4]

1. Load intelligence items by IDs (or use `topic_override` as raw input)
2. [AMENDED: A4] RAG retrieval via `retriever.py`: use `retrieve_with_language_fallback()` for Xiaohongshu (query brand_chunks with `language=="zh"` first, fall back to unfiltered if < 3 results). Use standard `language=="en"` filter for other platforms. See Section 5.4 for full fallback logic.
3. [AMENDED: C2] Use `intelligence_item.summary` (already in Firestore) as the `<intelligence>` block — NOT `raw_content`. This reduces input tokens per call from ~2,500 to ~500.
4. Construct platform-specific prompt (see Section 6). [AMENDED: A4] If `fallback_used` flag is set by retriever, pass it to the prompt constructor to inject the language instruction.
5. Call Claude via `claude_client.py`
6. Validate output JSON against Pydantic platform schema
7. [AMENDED: C4] Store draft in `post_drafts` with `prompt_version` populated from `PROMPT_VERSIONS[platform]` (see `prompts/__version__.py`)
8. **Batch completion detection** (atomic):
  - Firestore transaction: increment `content_packages/{batch_id}.completed_count` by 1
  - If `completed_count == total_count`: update status to "packaging", publish to `batch-complete` topic
9. On failure: retry via Pub/Sub ack deadline (up to 3 attempts before DLQ)

### 3.6 fn-package-builder [AMENDED: A1]


| Field             | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| **Trigger**       | Pub/Sub subscription on `batch-complete` topic           |
| **Entry point**   | `package_builder`                                        |
| **Purpose**       | Assemble all drafts for a batch into a downloadable ZIP  |
| **Input**         | Pub/Sub message: `{batch_id, package_type}`              |
| **Output**        | ZIP in Cloud Storage, signed URL in content_packages doc |
| **Dependencies**  | google-cloud-storage, google-cloud-firestore             |
| **Memory**        | 512 MB                                                   |
| **Timeout**       | 300s                                                     |
| **Est. cost/run** | $0 (no Claude; file I/O only)                            |


**[AMENDED: A1] Partial package handling:**

- Accept packages with status `"partial"` (triggered by recovery job in fn-retention-cleanup)
- Assemble ZIP with only the completed platform drafts
- Add `GENERATION_WARNINGS.txt` at ZIP root listing which platforms failed and why (pulled from Cloud Logging)
- Set `content_packages` status to `"partial"` (not `"ready"`) so dashboard can show a warning badge
- For fully complete packages: behaviour is unchanged (status set to `"ready"`)

**Logic:** see Section 8 for full specification.

### 3.7 fn-signal-detect


| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Trigger**       | HTTP (invoked by Cloud Scheduler with OIDC auth)                      |
| **Entry point**   | `signal_detect`                                                       |
| **Purpose**       | Fetch from signal sources, classify buying signals via Claude         |
| **Input**         | None (reads system_config/intelligence_sources, filtered by category) |
| **Output**        | Writes to prospect_signals collection                                 |
| **Dependencies**  | feedparser, praw, anthropic[vertex], google-cloud-firestore           |
| **Memory**        | 512 MB                                                                |
| **Timeout**       | 540s                                                                  |
| **Est. cost/run** | ~$0.25 (Claude: ~16.5K input + ~1.5K output tokens)                   |


**Logic:**

1. Reuses same source adapters as fn-intelligence-gather, filtered for signal-relevant sources (funding, hiring, pain points)
2. URL dedup against prospect_signals (same 48h window)
3. Claude classifies each item: `is_buying_signal`, `signal_type`, `strength_score`, `company_name`, `reasoning`, `summary`
4. Store classified items (only `is_buying_signal: true`) in `prospect_signals`
5. Log: signal counts per type, company distribution

### 3.8 fn-retention-cleanup


| Field             | Value                                                |
| ----------------- | ---------------------------------------------------- |
| **Trigger**       | HTTP (invoked by Cloud Scheduler daily at 04:00 UTC) |
| **Entry point**   | `retention_cleanup`                                  |
| **Purpose**       | Hard-delete expired data for GDPR compliance         |
| **Input**         | None                                                 |
| **Output**        | Deletes expired documents, logs deletion counts      |
| **Dependencies**  | google-cloud-firestore                               |
| **Memory**        | 256 MB                                               |
| **Timeout**       | 300s                                                 |
| **Est. cost/run** | $0                                                   |


**Logic:** [AMENDED: A1]

1. Query `intelligence_items` where `expires_at < now` — hard delete
2. Query `prospect_signals` where `expires_at < now` — hard delete
3. Query `qualified_leads` where `is_pinned == false` AND `expires_at < now` — hard delete, cascade delete linked `outreach_drafts`
4. Query `content_packages` where `url_expires_at < now` — update status to "expired"
5. **[AMENDED: A1] Stale batch recovery:** Query `content_packages` where `status == "generating"` AND `created_at < now - 3 hours`. For each stale package:
  - Update status to `"partial"`
  - Populate `failed_platforms` by diffing expected platforms against completed `draft_ids`
  - Set `has_warnings: true`
  - Publish to `batch-complete` topic so fn-package-builder assembles whatever drafts did complete
  - Log: `{batch_id, completed_count, total_count, platforms_missing}`
6. Write structured log: `{deleted_intel: N, deleted_signals: N, deleted_leads: N, recovered_packages: N, timestamp}`

---

## 4. PUB/SUB ARCHITECTURE

### Topics and Subscriptions

**Topic: `content-generate`**

- Purpose: Fan-out from orchestrator to platform-specific generators
- Publisher: fn-content-orchestrate
- Message schema:

```json
{
  "batch_id": "string",
  "platform": "linkedin | instagram | x_twitter | reddit | xiaohongshu | tiktok",
  "intelligence_item_ids": ["string"],
  "topic_override": "string | null"
}
```

- Subscription: `content-generate-sub`
  - Push to fn-platform-generate
  - Ack deadline: 300s (matches function timeout)
  - Max delivery attempts: 3
  - Dead-letter topic: `content-generate-dlq`
  - Retry policy: exponential backoff, min 10s, max 300s

**Topic: `batch-complete`**

- Purpose: Signal that all platform drafts in a batch are done, trigger packaging
- Publisher: fn-platform-generate (the instance that increments completed_count to total_count)
- Message schema:

```json
{
  "batch_id": "string",
  "package_type": "content | leads"
}
```

- Subscription: `batch-complete-sub`
  - Push to fn-package-builder
  - Ack deadline: 300s
  - Max delivery attempts: 3
  - Dead-letter topic: `batch-complete-dlq`

**Topic: `content-generate-dlq`**

- Purpose: Dead-letter queue for failed content generation attempts
- No push subscription — messages monitored via Cloud Monitoring alert
- [AMENDED: A1] Alert: defined in `infra/modules/monitoring/main.tf`. Any message published to this topic triggers an immediate email alert to founder. Alert policy: metric `pubsub.googleapis.com/topic/send_message_operation_count` on `content-generate-dlq`, threshold > 0, window 1 minute, notification channel: email.

**Topic: `batch-complete-dlq`**

- Purpose: Dead-letter queue for failed packaging attempts
- [AMENDED: A1] Same monitoring alert setup as `content-generate-dlq` — any message triggers immediate email alert. Both DLQ alerts defined in `infra/modules/monitoring/main.tf`.

### Batch Completion Pattern

The critical design pattern for detecting when all 6 platform generators have finished: [AMENDED: TK]

1. fn-content-orchestrate creates `content_packages/{batch_id}` with `completed_count: 0`, `total_count: 6`
2. Each fn-platform-generate, after storing its draft, runs a Firestore **transaction**:
  - Read `completed_count`
  - Increment to `completed_count + 1`
  - Append `draft_id` to `draft_ids` array
  - If `completed_count + 1 == total_count`: set `status: "packaging"`
  - Return boolean `is_last`
3. If `is_last == true`, that instance publishes to `batch-complete` topic
4. Exactly one instance will see `is_last == true` (transaction guarantees atomicity)

This avoids race conditions and eliminates the need for polling.

---

## 5. VERTEX AI + RAG ARCHITECTURE

### 5.1 Embedding Model

- Model: `gemini-embedding-001` via Vertex AI SDK
- Dimensions: **3072** (model default; NOT truncated to 768)
- Task types used:
  - `RETRIEVAL_DOCUMENT` — for brand_chunks at ingestion time
  - `RETRIEVAL_QUERY` — for search queries at generation time
  - `SEMANTIC_SIMILARITY` — for title dedup in intelligence gather
- API: `vertexai.language_models.TextEmbeddingModel.from_pretrained("gemini-embedding-001")`
- Batch embedding: up to 250 texts per API call

### 5.2 Chunking Strategy

Implemented in `functions/shared/chunker.py`:

- **Target chunk size**: 512 tokens (measured via tiktoken `cl100k_base` encoder)
- **Overlap**: 64 tokens between consecutive chunks
- **Boundary awareness**: split on sentence boundaries (`.`, `!`, `?` followed by whitespace or newline), then merge sentences into chunks up to the target size
- **Minimum chunk size**: 50 tokens (discard smaller trailing chunks)
- **Metadata preserved per chunk**: `document_id`, `chunk_index`, `language`, `doc_type`

### 5.3 Vector Index Configuration [AMENDED: A2]

Firestore native vector search:

- Collection: `brand_chunks`
- Vector field: `embedding`
- Dimension: 3072
- Distance measure: COSINE
- Index type: FLAT (appropriate for < 50,000 vectors; no ANN needed)

**Scaling note**: If brand_chunks exceeds 50,000 documents, migrate to Vertex AI Vector Search (Matching Engine) for ANN with ScaNN. Document this threshold in system_config and add a Cloud Monitoring metric on brand_chunks document count.

**[AMENDED: A2] No secondary vector index.** The `intelligence_items` collection has no vector field. Semantic deduplication of titles is performed entirely in-memory within `fn-intelligence-gather` using numpy cosine similarity. The only Firestore vector index in this system is on `brand_chunks.embedding`.

### 5.4 Retrieval Strategy [AMENDED: A4]

Implemented in `functions/shared/retriever.py`:

- **top_k**: [AMENDED: RK] **8** chunks per query (increased from 5 — confirmed 200K input context window supports richer brand context at negligible token cost)
- **Distance threshold**: 0.3 (cosine distance; discard chunks above this)
- **Language filter**: applied as pre-filter in vector query
  - English content (LinkedIn, IG, X, Reddit): `language == "en"`
  - Chinese content (Xiaohongshu): `language == "zh"` — uses `retrieve_with_language_fallback()`
- **[AMENDED: A4] Language fallback for Xiaohongshu** — `retrieve_with_language_fallback()` in `shared/retriever.py`:
  1. [AMENDED: RK] Query `brand_chunks` with `language == "zh"` filter, `top_k=8`
  2. If results >= 3: return results as-is, `fallback_used = false`
  3. [AMENDED: RK] If results < 3: run a second query with NO language filter, `top_k=8`
    - Tag each returned chunk with its actual `language` field
    - Return combined results (zh chunks first, en chunks fill remainder up to top_k)
    - Set `fallback_used = true`
  4. fn-platform-generate passes `fallback_used` to prompt constructor — see Section 6.6 for the conditional prompt injection
- **Query construction**: use the intelligence item summary (or topic_override) as the embedding query text
- **Deduplication**: if multiple chunks from the same document_id are in top_k, keep only the highest-scoring one (forces diversity)

### 5.5 Prompt Construction Pattern [AMENDED: C2]

Every Claude call follows this structure:

```
[System Prompt]
  - Role definition
  - Output format instructions (strict JSON schema)
  - Platform-specific constraints
  - Tone and style directives

[User Message]
  <brand_context>
  [1] {chunk_text_1} (source: {doc_type})
  [2] {chunk_text_2} (source: {doc_type})
  ...
  [8] {chunk_text_8} (source: {doc_type})
  </brand_context>

  <intelligence>
  {intelligence_item_1.summary}
  {intelligence_item_2.summary}
  {intelligence_item_3.summary}
  </intelligence>

  <instructions>
  {platform-specific generation instructions}
  {topic_override if present}
  </instructions>
```

Brand context chunks are numbered so Claude can reference them. The `doc_type` label helps Claude weight chunks appropriately (e.g., brand_voice chunks influence tone, case_study chunks provide proof points).

**[AMENDED: C2] Token optimisation:** The `<intelligence>` block uses `intelligence_item.summary` (already stored in Firestore from the scoring step) — NOT `raw_content`. This avoids processing the same content twice and reduces input tokens per platform generation call from ~2,500 to ~500. Monthly Claude cost for content generation drops from ~$1.68 to ~$0.87.

---

## 6. CLAUDE PROMPT ARCHITECTURE

[AMENDED: MS] All calls use `claude-sonnet-4-6@default` via Vertex AI (confirmed from Vertex AI Model Garden, us-east5 region). Input context: 200K tokens (1M in beta). Output: 128K tokens.

**[AMENDED: C4, TK] Prompt versioning:** Every prompt template has a corresponding version string in `functions/prompts/__version__.py`. Version is populated into `post_drafts.prompt_version` at generation time. Increment version manually whenever a prompt template changes. The `PROMPT_VERSIONS` dict includes all 6 content platforms (linkedin, instagram, x_twitter, reddit, xiaohongshu, tiktok) plus signal_classifier, icp_qualifier, outreach_linkedin, outreach_email.

### 6.1 Intelligence Scorer

- **System prompt**: "You are an AI industry analyst scoring news items for relevance to an AI consulting firm in Singapore. The firm specialises in production ML, GenAI/RAG systems, and real-time audio processing."
- **Variables**: `{raw_title, raw_content, firm_services, target_verticals}`
- **Output JSON**:

```json
{
  "summary": "string (2-3 sentences)",
  "relevance_score": "number (0.0-1.0)",
  "relevance_reasoning": "string (one sentence)",
  "tags": ["string"]
}
```

- **Temperature**: 0.2 (deterministic scoring)

### 6.2 LinkedIn

- **System prompt**: "You are a senior AI/tech thought leader crafting LinkedIn posts for Intonation Labs, a Singapore-based AI consulting firm. Write in first person as the founder. Authoritative but approachable. No corporate buzzwords."
- **Variables**: `{brand_context, intelligence_summaries, company_name, services}`
- **Output JSON**:

```json
{
  "text": "string (150-300 words, strong hook in first 2 lines, one question or CTA)",
  "hashtags": ["string (3-5 hashtags)"],
  "image_prompt_midjourney": "string (professional/abstract, --ar 1:1 --style raw)",
  "image_prompt_canva": "string (same concept, simple description for Canva AI)"
}
```

- **Temperature**: 0.7

### 6.3 Instagram

- **System prompt**: "You are a creative social media strategist crafting Instagram content for an AI consulting firm. Punchy, visual, accessible. Make complex AI topics feel exciting and relevant."
- **Variables**: `{brand_context, intelligence_summaries, company_name}`
- **Output JSON**:

```json
{
  "caption": "string (punchy opener + body, max 2200 chars)",
  "hashtags": ["string (5-10 hashtags, appended separately)"],
  "stories_variant": "string (single sentence, max 125 chars)",
  "image_prompt_midjourney": "string (visual, bold, --ar 1:1 --style raw, square crop for feed)",
  "image_prompt_canva": "string (same concept, simple description for Canva AI, square)"
}
```

- **Temperature**: 0.8

### 6.4 X (Twitter)

- **System prompt**: "You are a concise tech commentator writing for X. Sharp, opinionated, high signal-to-noise. No hashtag stuffing. Threads only when the topic genuinely warrants depth."
- **Variables**: `{brand_context, intelligence_summaries}`
- **Output JSON**:

```json
{
  "tweet": "string (max 280 chars, standalone value)",
  "thread": ["string (2-4 tweets, each max 280 chars)"] | null,
  "hashtags": ["string (max 2)"],
  "image_prompt_midjourney": "string (clean, minimal, high contrast, --ar 16:9 --style raw)",
  "image_prompt_canva": "string (same concept, simple description for Canva AI)"
}
```

- **Temperature**: 0.7

### 6.5 Reddit

- **System prompt**: "You are a knowledgeable community member sharing AI insights. Value-first, no self-promotion. Write like someone genuinely contributing to the discussion. Markdown formatting."
- **Variables**: `{brand_context, intelligence_summaries, suggested_subreddits}`
- **Output JSON**:

```json
{
  "title": "string (max 300 chars, compelling and non-promotional)",
  "body": "string (long-form Markdown, value-first, no hard sell)",
  "suggested_subreddit": "string",
  "suggested_flair": "string"
}
```

- **Temperature**: 0.6
- **No image_prompt** (Reddit is text-first)

### 6.6 Xiaohongshu (小红书) [AMENDED: A4]

- **System prompt**: "你是一位资深AI技术顾问，在小红书上用轻松的个人体验分享风格写内容。风格要亲切、实用、有干货。像朋友之间分享经验一样。使用简体中文。"
- **[AMENDED: A4] Conditional fallback instruction:** If `fallback_used == true` (set by `retrieve_with_language_fallback()` in retriever.py), append to system prompt: "Some brand context below is in English. Extract relevant information but write the ENTIRE output in Simplified Chinese (简体中文) only. Do not include any English words in the output."
- **Variables**: `{brand_context, intelligence_summaries, fallback_used}` (brand_context from `retrieve_with_language_fallback()` — zh chunks preferred, en chunks as fallback)
- **Output JSON**:

```json
{
  "title": "string (max 40 chars, with emoji)",
  "body": "string (max 1000 chars, personal experience-sharing tone)",
  "hashtags": ["string (3-5 Chinese hashtags)"],
  "image_prompts": ["string (3-6 image prompt descriptions in Chinese)"],
  "emoji_tags": ["string (2-4 emoji tags)"]
}
```

- **Temperature**: 0.8

### 6.7 TikTok [AMENDED: TK]

- **System prompt**: "You are a sharp, trend-aware content creator making TikTok photo/text posts for an AI consulting firm. This is NOT video — it is text + static image content (TikTok photo mode). Your audience is 18-35, tech-curious, trend-aware. Tone: direct, opinionated, slightly irreverent — more casual than LinkedIn, more punchy than Instagram. The hook line is critical: first line must create a 'pattern interrupt' — unexpected angle, bold claim, or provocative question. No corporate language whatsoever. Write as if the text IS the visual — text overlay mindset."
- **Variables**: `{brand_context, intelligence_summaries}`
- **Output JSON**:

```json
{
  "text": "string (full post body, max 2200 chars)",
  "hook_line": "string (first line, max 100 chars, must work as standalone text overlay)",
  "hashtags": ["string (3-5 tags: 1-2 broad trending + 2-3 niche AI, e.g. #AItools #futureofwork + #ragpipeline #genai)"],
  "image_prompt_midjourney": "string (bold, high-contrast, works as 9:16 vertical crop, --ar 9:16 --style raw)",
  "image_prompt_canva": "string (same concept, simple description for Canva AI, vertical format)"
}
```

- **Temperature**: 0.85 (slightly higher than Instagram — TikTok rewards unexpected angles)
- **CTA guidance**: direct and specific ("Follow for more", "Save this", "Drop your take below") — not "link in bio"

### 6.8 Signal Classifier [AMENDED: TK — renumbered from 6.7]

- **System prompt**: "You are a B2B sales intelligence analyst identifying buying signals for an AI consulting firm. Be precise about company attribution. Only classify as a buying signal if there is a concrete, actionable indicator."
- **Variables**: `{raw_title, raw_content, signal_types_enum, target_industries}`
- **Output JSON**:

```json
{
  "is_buying_signal": "boolean",
  "signal_type": "string (one of 5 types)",
  "strength_score": "number (1-10)",
  "company_name": "string",
  "reasoning": "string (one sentence)",
  "summary": "string (2-3 sentences)"
}
```

- **Temperature**: 0.2 (deterministic classification)

### 6.9 ICP Qualifier [AMENDED: TK — renumbered from 6.8]

- **System prompt**: "You are a B2B sales strategist evaluating prospect-firm fit. Be honest — a low score is more useful than a false high. Match against the ICP definition precisely."
- **Variables**: `{signal_summary, icp_definition_chunks, case_study_chunks, firm_services}`
- **Output JSON**:

```json
{
  "icp_fit": "string (high | medium | low)",
  "icp_fit_score": "number (0.0-1.0)",
  "reasoning": "string (2-3 sentences)",
  "matching_services": ["string"],
  "suggested_outreach_angle": "string (one sentence)"
}
```

- **Temperature**: 0.3

### 6.10 Outreach — LinkedIn DM [AMENDED: TK — renumbered from 6.9]

- **System prompt**: "You are drafting a professional, non-salesy LinkedIn DM. Reference the specific signal that triggered outreach. Soft CTA — suggest a conversation, not a sale. Max 300 characters."
- **Variables**: `{company_name, signal_summary, outreach_angle, outreach_guide_chunks, contact_name?, contact_title?}`
- **Output JSON**:

```json
{
  "message": "string (max 300 chars)"
}
```

- **Temperature**: 0.6

### 6.11 Outreach — Cold Email [AMENDED: TK — renumbered from 6.10]

- **System prompt**: "You are drafting a professional cold outreach email. Three paragraphs: hook (reference signal), value proposition (match to their need), soft CTA. CAN-SPAM compliant. Include physical_address and unsubscribe_note as provided."
- **Variables**: `{company_name, signal_summary, outreach_angle, outreach_guide_chunks, contact_name?, physical_address, unsubscribe_note}`
- **Output JSON**:

```json
{
  "subject": "string",
  "body": "string (3 paragraphs)",
  "physical_address": "string (echoed from input for validation)",
  "unsubscribe_note": "string (echoed from input for validation)"
}
```

- **Temperature**: 0.5
- **Pydantic validation**: `physical_address` and `unsubscribe_note` must be non-empty strings; validation error if absent (CAN-SPAM requirement)

---

## 7. DASHBOARD — PAGE AND COMPONENT PLAN

Frontend: Next.js 14 App Router, Tailwind CSS, shadcn/ui components.
Deployment: Docker container on Cloud Run, proxied via Firebase Hosting rewrites.
Auth: Firebase Auth (Google SSO), single admin user.
Data: Firestore client SDK for real-time subscriptions + fn-api for mutations.

### 7.1 /login

- **Purpose**: Google SSO entry point
- **Components**: Centered card with Google sign-in button, Intonation Labs logo
- **Data source**: Firebase Auth `signInWithPopup(GoogleAuthProvider)`
- **Behaviour**: On success, redirect to /dashboard. On failure, show error toast.
- **Guard**: If already authenticated, redirect to /dashboard

### 7.2 /dashboard [AMENDED: C6, C7, B1]

- **Purpose**: Daily overview — the founder's "morning briefing" page
- **[AMENDED: C6] Status strip** (always visible at top of page):
  - Green bar: "All systems running — last updated {time}"
  - Amber bar: "Content generation delayed — package not yet ready"
  - Red bar: "System error — check Cloud Logs"
  - Data source: `GET /api/health` polled every 60 seconds via SWR
- **Layout**: Two-column cards
  - Left: Today's Content Package (status, draft count, download button, [AMENDED: A1] warning badge if `has_warnings`)
  - Right: Today's Leads Package (status, signal count, download button)
  - Below: Key stats (items gathered, drafts pending review, signals detected, leads qualified)
  - Bottom: Quick-action buttons (Refresh Intelligence, [AMENDED: C7] "Generate from Topic", View Signals)
- **[AMENDED: C7] "Generate from Topic" button** — opens a modal (Dialog from shadcn/ui):
  - Text input: "Topic or URL" (founder can paste a URL or type a topic)
  - Platform checkboxes (all 5 checked by default)
  - Language selector (English / Chinese / Both)
  - "Generate" button → calls `POST /api/content/generate` with `{topic, url?, platforms, language}`
  - Frontend polls `content_packages/{batch_id}` via Firestore real-time listener until status changes to "ready" or "partial"
  - On completion: toast notification "Content ready — view drafts", redirect to /drafts with new batch_id highlighted
- **Data source**: Firestore real-time listener on `content_packages` and `prospect_signals` for today's `batch_date`
- **[AMENDED: B1] Download interaction**: Always calls `GET /api/packages/{id}/download-url` before opening the URL. Never stores signed URL in component state beyond current session. Shows loading spinner during URL fetch.

### 7.3 /intelligence [AMENDED: C7]

- **Purpose**: Browse today's gathered intelligence items
- **Components**: `intel-filters.tsx` (source type, min relevance score, tags), `intel-card.tsx` list
- **Data source**: Firestore query on `intelligence_items` where `batch_date == today`, ordered by `relevance_score DESC`
- **Key interactions**: Filter by source/score/tag, expand item to see full summary and reasoning, "Use for Content" button (marks item for manual content generation), [AMENDED: C7] "Generate from Topic" button (same modal as /dashboard — opens Dialog with topic/URL input, platform checkboxes, language selector)

### 7.4 /drafts

- **Purpose**: Review the 5 daily content drafts, edit inline, approve/reject, download package
- **Layout**: [AMENDED: TK] `platform-tabs.tsx` at top (LinkedIn | Instagram | TikTok | X | Reddit | 小红书), content area below. TikTok sits next to Instagram because their content creation workflow is most similar (both image-based, both use the same dual image prompts).
- **Components per tab**: `draft-editor.tsx` (textarea with current content), `char-counter.tsx` (shows limit), image prompt display (read-only text), source intelligence references, brand chunks used
- **Data source**: Firestore query on `post_drafts` where `batch_date == today`
- **Key interactions**:
  - Edit text inline (PATCH via fn-api, sets status to "edited")
  - Approve / Reject buttons (PATCH status)
  - [AMENDED: B1] "Download Package" button — always calls `GET /api/packages/{id}/download-url` for a fresh signed URL. Never caches URL in component state.
  - "Regenerate" button per platform — triggers fn-platform-generate for that platform only

### 7.5 /drafts/[id] [AMENDED: C4]

- **Purpose**: Full-screen editor for a single draft
- **Components**: `draft-editor.tsx` (larger textarea), platform-specific preview mockup, metadata panel (source items, brand chunks, generated_at, [AMENDED: C4] `prompt_version` shown as small grey text)
- **Data source**: Firestore document listener on `post_drafts/{id}`
- **Key interactions**: Edit, approve, reject, copy to clipboard

### 7.6 /signals [AMENDED: B3]

- **Purpose**: Review today's detected buying signals
- **Components**: `signal-card.tsx` list showing company_name, signal_type badge, strength_score bar, summary; [AMENDED: B3] `qualify-panel.tsx` (Sheet component from shadcn/ui — slides in from right)
- **Data source**: Firestore query on `prospect_signals` where `batch_date == today` AND `status == "new"`, ordered by `strength_score DESC`
- **Key interactions**:
  - [AMENDED: B3] "Qualify" button → opens `qualify-panel.tsx` slide-over (NOT navigation to /leads):
    - Panel shows: signal detail (read-only), ICP pre-assessment hint, optional PII form (`contact_name`, `contact_title` — email and LinkedIn optional at this stage)
    - "Confirm Qualification" button in panel:
    a. Calls `POST /api/leads/qualify` with `{signal_id, optional PII}`
    b. Shows loading state in panel
    c. On success: panel shows ICP fit result + reasoning inline
    d. Signal card updates status badge to "qualified"
    e. Panel has "View Lead →" link to `/leads/{lead_id}`
    - Founder stays on /signals page throughout — no navigation
  - "Dismiss" button → PATCH status to "dismissed"
  - Filter by signal_type, min strength_score

### 7.7 /leads

- **Purpose**: List all qualified leads with ICP scores
- **Layout**: Simple table/card list, sortable by icp_fit_score, filterable by status
- **Components**: `lead-card.tsx` (company, ICP fit badge, matching services, status), `pii-form.tsx` (clearly labelled "Personal Data" section for manual PII entry)
- **Data source**: Firestore query on `qualified_leads`, ordered by `icp_fit_score DESC`
- **Key interactions**:
  - Enter PII (name, title, email, LinkedIn URL) via `pii-form.tsx` — saved to qualified_leads
  - "Generate Outreach" button (only for high/medium fit with PII entered) — calls fn-api POST /outreach/generate
  - "Delete Lead" button — cascading delete + suppress list addition
  - "Export PII" button — calls fn-api POST /leads/:id/export-pii (DSAR)
  - "Pin" toggle — exempts from TTL
  - "Download Leads Package" button

### 7.8 /outreach/[id]

- **Purpose**: Edit outreach drafts with compliance checklist
- **Layout**: Two tabs (LinkedIn DM | Cold Email), compliance checklist below
- **Components**: `outreach-editor.tsx` (editable text areas per draft type), `compliance-checklist.tsx` (non-dismissable checklist)
- **Data source**: Firestore document listener on `outreach_drafts` where `lead_id == id`
- **Compliance checklist items** (all must be checked before "Mark as Sent" is enabled):
  - "I have verified the data source for this prospect"
  - [AMENDED: C5] "I have verified this company and contact are not on the suppress list" (domain-level suppression is also checked)
  - "This email includes a valid physical address and unsubscribe mechanism" (cold email only)
  - "This prospect is not in a CASL jurisdiction, OR I have obtained implied/express consent" (if `casl_warning`)
  - "This prospect is not in a GDPR jurisdiction, OR legitimate interest applies" (if `gdpr_applicable`)
  - "All claims in this outreach are accurate and verifiable"
- **Key interactions**:
  - Edit draft text
  - Complete all checklist items → "Mark as Sent" button enables
  - "Mark as Sent" → sets `sent_at`, `sent_by`, `compliance_checklist_completed: true`, updates lead status to "sent"
  - Copy to clipboard (for pasting into LinkedIn/email client)

### 7.9 /documents

- **Purpose**: Upload and manage brand documents for RAG
- **Components**: `doc-uploader.tsx` (drag-and-drop, accepts PDF/DOCX/MD, max 10MB), `doc-list.tsx` (filename, doc_type selector, language selector, status badge, chunk_count)
- **Data source**: Firestore real-time listener on `brand_documents`
- **Key interactions**:
  - Upload file → fn-api returns signed upload URL → client uploads to Cloud Storage → Eventarc triggers fn-document-ingest
  - Set doc_type and language per document
  - Delete document (cascades to brand_chunks)
  - View processing status (uploaded → processing → indexed)

### 7.10 /settings [AMENDED: C3, C4]

- **Purpose**: System configuration
- **Sections**:
  - **Intelligence Sources**: Toggle sources on/off, edit RSS URLs, manage keyword lists
  - **Generation Schedule**: View/edit cron expressions (displayed as human-readable times)
  - [AMENDED: C3] **Daily Digest**: Toggle on/off + email address input. Default off. When enabled, sends a plain-text email after each content package is built (see C3 implementation below).
  - [AMENDED: C4] **Prompt Versions**: Read-only table showing current version of each prompt template. No editing in UI — prompts are code-controlled.
  - **Compliance**: Edit physical address, unsubscribe email, privacy policy URL
  - **Suppress List**: View entries, manually add email/domain, remove entry
  - **Danger Zone**: "Clear today's data" (for testing), "Re-index all documents"
- **Data source**: Firestore listeners on `system_config/`* and `suppress_list`
- **Key interactions**: All changes saved via fn-api PATCH requests

---

## 8. PACKAGE BUILDER SPECIFICATION

### 8.1 Content Package (fn-package-builder)

**Trigger**: Pub/Sub message on `batch-complete` topic with `package_type: "content"`

**Assembly steps**:

1. Read `content_packages/{batch_id}` to get `draft_ids`
2. Fetch all `post_drafts` by IDs
3. Fetch all `intelligence_items` referenced by the drafts (for intelligence_summary.md)
4. Build ZIP in memory using Python `zipfile` module

**ZIP structure:** [AMENDED: A1, TK]

```
content_package_YYYY-MM-DD/
├── intelligence_summary.md              # Top 3 items: title, summary, source, score
├── GENERATION_WARNINGS.txt              # [AMENDED: A1] Only present if partial
├── linkedin/
│   ├── post.txt                         # Main text + hashtags appended
│   ├── image_prompt_midjourney.txt      # [AMENDED: TK] Midjourney format with --ar, --style raw
│   └── image_prompt_canva.txt           # [AMENDED: TK] Canva AI simple description
├── instagram/
│   ├── caption.txt                      # Caption body
│   ├── hashtags.txt                     # One per line
│   ├── stories_variant.txt              # Single sentence
│   ├── image_prompt_midjourney.txt      # [AMENDED: TK]
│   └── image_prompt_canva.txt           # [AMENDED: TK]
├── x_twitter/
│   ├── tweet.txt                        # Single tweet
│   ├── thread.txt                       # Thread tweets, separated by "---"
│   ├── image_prompt_midjourney.txt      # [AMENDED: TK]
│   └── image_prompt_canva.txt           # [AMENDED: TK]
├── reddit/
│   └── post.md                          # Title as H1, body as Markdown (no image prompts)
├── xiaohongshu/
│   ├── post_zh.txt                      # Title + body in Simplified Chinese
│   └── image_prompts_zh.txt             # Multiple prompts in one file
└── tiktok/                              # [AMENDED: TK] NEW
    ├── post.txt                         # Full text (hook line first, then body)
    ├── hook_line.txt                    # Hook line isolated for text overlay use
    ├── hashtags.txt                     # One per line
    ├── image_prompt_midjourney.txt      # Bold, high-contrast, 9:16 vertical
    └── image_prompt_canva.txt           # Same concept, Canva AI format
```

**[AMENDED: A1] Partial package handling:** If `content_packages.status == "partial"`, only directories for completed platforms are included. `GENERATION_WARNINGS.txt` is added at ZIP root listing which platforms failed and why (failure reasons pulled from Cloud Logging via batch_id filter). Package status remains `"partial"` (not `"ready"`).

**File formatting rules**:

- All files UTF-8 encoded
- Text files have no trailing whitespace
- Hashtags in separate files are one per line, with `#` prefix
- Thread tweets separated by `---` on its own line
- Reddit post: first line is `# {title}`, blank line, then body
- Xiaohongshu: first line is title, blank line, then body, blank line, then hashtags

**Storage**: `gs://packages-{project}/content/content_package_YYYY-MM-DD.zip`

**Signed URL**: generated via `storage_client.generate_signed_url()`, 7-day expiry

**Post-assembly**: update `content_packages/{batch_id}`: [AMENDED: A1, C3]

- `storage_path` = Cloud Storage path
- `download_url` = signed URL
- `url_expires_at` = now + 7 days
- `status` = `"ready"` (full) or `"partial"` (if recovery-triggered, see A1)
- `completed_at` = now
- [AMENDED: C3, TK] **Daily digest trigger:** After setting status to `"ready"` or `"partial"`, if `system_config/generation.daily_digest_enabled == true`, send email digest to `daily_digest_email`. Email content (plain text):
  - Subject: "Daily Package Ready — {YYYY-MM-DD}"
  - Body: download URL, top intelligence item title + score, platforms generated (LinkedIn, Instagram, TikTok, X, Reddit, 小红书), leads package status, new signal count
  - Email provider: SendGrid free tier (100 emails/day) OR Gmail API with service account impersonation. If SendGrid: add `SENDGRID_API_KEY` to Secret Manager. If Gmail API: add `gmail.send` scope to service account.

### 8.2 Leads Package (fn-package-builder, same function, different branch)

**Trigger**: Manual via fn-api POST /packages/leads/build, OR daily Cloud Scheduler at 20:00 SGT

**Assembly steps**:

1. Query `qualified_leads` where `qualified_at` is today AND `status` in ["qualified", "outreach_drafted", "sent"]
2. For each lead, fetch linked `outreach_drafts` and `prospect_signals`
3. Build ZIP

**ZIP structure**:

```
leads_package_YYYY-MM-DD/
├── signals_summary.md              # All today's signals: company, type, strength, summary
└── leads/
    ├── {company_name_sanitised_1}/
    │   ├── signal.txt              # Signal type, strength, summary, source URL
    │   ├── icp_score.txt           # ICP fit, score, reasoning, matching services
    │   ├── outreach_linkedin_dm.txt    # DM draft (if generated)
    │   └── outreach_email.txt          # Email draft (if generated)
    └── {company_name_sanitised_2}/
        └── ...
```

**Company name sanitisation**: lowercase, replace spaces with underscores, remove special characters, truncate to 50 chars.

**Storage**: `gs://packages-{project}/leads/leads_package_YYYY-MM-DD.zip`

Same signed URL and metadata update pattern as content packages.

### 8.3 Signed URL Regeneration [AMENDED: B1]

**Endpoint**: `GET /api/packages/{package_id}/download-url`

All Cloud Storage file access from the frontend goes through this endpoint. No direct GCS URLs in the frontend.

**Logic:**

1. Fetch `content_packages/{package_id}`
2. If status not in `["ready", "partial"]`: return 404
3. If `url_expires_at > now + 1 hour`: return existing `download_url` (cache hit — avoids unnecessary signing)
4. Else: call `storage_client.generate_signed_url(storage_path, expiry=7 days)`
5. Update `content_packages`: `download_url`, `url_expires_at`
6. Return `{download_url, expires_at}`

The frontend (`package-download.tsx`) always calls this endpoint before opening the URL. It never stores signed URLs in component state beyond the current session.

### 8.4 Leads Package Cloud Scheduler Job [AMENDED: B2]

**Terraform** (`infra/modules/scheduler/main.tf`):

- Job name: `leads-package-daily`
- Schedule: `"0 12 * * *"` (UTC) = 20:00 SGT
- Target: HTTP POST to fn-api `/api/packages/leads/build`
- Auth: OIDC token (service account)
- Time zone: UTC (document the SGT conversion)

**API Endpoint** (`functions/api/routes/packages.py`):

- `POST /api/packages/leads/build`
- Logic: trigger fn-package-builder for today's leads, publish to `batch-complete` topic with `package_type: "leads"`, return `{status: "building", batch_id}`
- Idempotent: if today's leads package already exists with status `"ready"`, return existing package (do not rebuild)

---

## 9. ENVIRONMENT VARIABLES AND SECRETS

### Environment Variables (set in Cloud Function deployment, NOT secrets)


| Variable               | Value                                     | Used By                                 |
| ---------------------- | ----------------------------------------- | --------------------------------------- |
| `GCP_PROJECT_ID`       | `intonation-labs-marketing`               | All functions                           |
| `GCP_REGION`           | `asia-southeast1`                         | All functions                           |
| `FIRESTORE_DATABASE`   | `(default)`                               | All functions                           |
| `BRAND_DOCS_BUCKET`    | `brand-documents-{project}`               | fn-document-ingest, fn-api              |
| `PACKAGES_BUCKET`      | `packages-{project}`                      | fn-package-builder, fn-api              |
| `PUBSUB_TOPIC_CONTENT` | `content-generate`                        | fn-content-orchestrate                  |
| `PUBSUB_TOPIC_BATCH`   | `batch-complete`                          | fn-platform-generate                    |
| `CLAUDE_MODEL`         | [AMENDED: MS] `claude-sonnet-4-6@default` | All Claude-calling functions            |
| `CLAUDE_REGION`        | [AMENDED: MS] `us-east5` (confirmed)      | shared/claude_client.py                 |
| `EMBEDDING_MODEL`      | `gemini-embedding-001`                    | shared/embedder.py                      |
| `EMBEDDING_DIMENSION`  | `3072`                                    | shared/embedder.py, shared/retriever.py |
| `LOG_LEVEL`            | `INFO`                                    | shared/logger.py                        |


### Secrets (GCP Secret Manager — NEVER in env vars or code) [AMENDED: C3]


| Secret Name            | Purpose                                               | Required                                    |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `reddit-client-id`     | Reddit API OAuth2 client ID                           | Yes (for Reddit source)                     |
| `reddit-client-secret` | Reddit API OAuth2 client secret                       | Yes (for Reddit source)                     |
| `reddit-user-agent`    | Reddit API user agent string                          | Yes                                         |
| `x-api-bearer-token`   | X API Basic tier bearer token                         | No (disabled by default)                    |
| `sendgrid-api-key`     | [AMENDED: C3] SendGrid API key for daily digest email | No (only if SendGrid chosen over Gmail API) |


**Not in Secret Manager** (uses service account identity instead):

- Vertex AI (Claude + embeddings): authenticated via Cloud Function's service account with `roles/aiplatform.user`
- Firestore: authenticated via service account with `roles/datastore.user`
- Cloud Storage: authenticated via service account with `roles/storage.objectAdmin`
- Pub/Sub: authenticated via service account with `roles/pubsub.publisher`

**There are NO OAuth tokens, NO social media API keys (except optional X), NO platform secrets.**

### Frontend Environment Variables (Next.js, build-time)


| Variable                           | Value                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | Firebase web API key                                                    |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `{project}.firebaseapp.com`                                             |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | `intonation-labs-marketing`                                             |
| `NEXT_PUBLIC_API_URL`              | fn-api Cloud Function URL (or `/api` if using Firebase Hosting rewrite) |


---

## 10. PHASED BUILD ORDER

### Phase 0 — Foundation (Est. 1.5 weeks) [AMENDED: A3, C8]

**Tasks (in order):**

1. Create GCP project `intonation-labs-marketing`, enable billing
2. Enable APIs: Cloud Functions, Cloud Run, Firestore, Cloud Storage, Pub/Sub, Cloud Scheduler, Secret Manager, Vertex AI, Cloud Build, Error Reporting

2.5. [AMENDED: C8] **File Vertex AI quota increase request** for Claude model in `us-east5`: navigate to GCP Console → IAM & Admin → Quotas → filter by Vertex AI API → us-east5 → Claude model → request minimum 300 requests/minute. Timeline: 1–3 business days for approval. **DO NOT begin Phase 1 until quota increase is approved.**
3. Create service accounts with least-privilege IAM roles
4. Write Terraform modules: project, firestore, storage, pubsub, scheduler, secrets, monitoring
5. `terraform apply` — provision all infrastructure
6. Create Firebase project linked to GCP project, enable Authentication (Google provider)
7. Scaffold Next.js 14 app with App Router, Tailwind, shadcn/ui
8. Implement Firebase Auth (login page, auth context, route guard)
9. Create `shared/claude_client.py` with async calls, exponential backoff (base 1s, max 60s, jitter), retry on 429/500/503, max 3 retries. [AMENDED: C8] On 429 response: log at WARNING level with quota context, include retry count and wait time (makes quota breaches immediately visible in Cloud Logging).
10. Create `shared/embedder.py` with Vertex AI embedding wrapper (3072 dimensions, batch support)
11. Create `shared/logger.py` with structured logging (JSON, severity levels)
12. Create `shared/models.py` with all Pydantic models (all collections)
13. [AMENDED: A3] Deploy fn-api skeleton (FastAPI + uvicorn + auth dependency + `GET /api/health` endpoint). Dockerfile CMD: `uvicorn api.app:app --host 0.0.0.0 --port 8080 --workers 4`. [AMENDED: C6] Health check endpoint is unauthenticated — public for external uptime monitoring.
14. Configure Firebase Hosting rewrites to fn-api and Cloud Run (frontend)
15. Set up GitHub Actions: deploy-functions.yml, deploy-frontend.yml, terraform-plan.yml
16. Enable Google Cloud Error Reporting
17. Create Cloud Monitoring alert: error rate > 5% over 15 min on any function
18. [AMENDED: A1] Create Cloud Monitoring alerts for DLQ topics (`content-generate-dlq`, `batch-complete-dlq`): any message triggers immediate email alert to founder. Define in `infra/modules/monitoring/main.tf`.

**Hard dependencies**: GCP billing account, GitHub repository
**Definition of done**: Dashboard loads at Firebase Hosting URL, Google SSO works, fn-api responds to authenticated requests, `GET /api/health` returns `{"status": "ok"}`, Terraform state is clean, Vertex AI quota increase approved.
**Risks**: Firebase Hosting + Cloud Run rewrite configuration can be fiddly; mitigate with early testing. Vertex AI quota increase may take 1–3 business days — file early.
**Est. GCP cost**: $0/month (free tier only)

### Phase 1 — RAG Brain (Est. 1 week) [AMENDED: A2, A4, C9]

**Tasks (in order):**

1. [AMENDED: C9] **Verify `gemini-embedding-001` pricing** in GCP Pricing Calculator (cloud.google.com/vertex-ai/pricing). If billed, estimate cost at current volume (~50 chunks/doc × 3072 dimensions) and update Section 11 cost projection. If billing confirmed, add `EMBEDDING_COST_PER_1K_CHARS` to `system_config` as tracked constant.
2. Implement `shared/chunker.py` (512 tokens, 64 overlap, boundary-aware)
3. Implement `engines/document_ingest.py` (parse PDF/DOCX/MD, chunk, embed, store)
4. Deploy fn-document-ingest with Eventarc trigger on brand-documents bucket
5. Create Firestore vector index on `brand_chunks.embedding` (3072d, COSINE, FLAT) — [AMENDED: A2] this is the ONLY vector index in the system
6. Create composite vector index with `language` pre-filter
7. [AMENDED: A4, RK] Implement `shared/retriever.py` (vector search, top_k=8, distance threshold, language filter, dedup) including `retrieve_with_language_fallback()` for Xiaohongshu (see Section 5.4)
8. Build /documents page: upload UI, doc_type/language selectors, processing status display
9. Upload initial brand documents (brand voice guide, service descriptions)
10. Test end-to-end: upload PDF → chunks appear in Firestore → vector search returns relevant results

**Hard dependencies**: Phase 0 complete (including Vertex AI quota approval), at least one brand document prepared
**Definition of done**: Founder can upload a PDF, see it processed to chunks, and verify retrieval quality by querying from a test script
**Risks**: Firestore vector index creation can take minutes
**Est. GCP cost**: $0/month (embedding calls within free tier — verify per C9)

### Phase 2 — Intelligence Gatherer + Content Factory (Est. 2.5 weeks) [AMENDED: A1, A2, B1, C1, C2, C3, C4, C6, C7]

**Tasks (in order):**

1. Implement source adapters: `rss.py` (generic RSS/Atom via feedparser), `reddit.py` (praw, read-only)
2. Implement `x_api.py` (adapter with `enabled: false` default; design only, no API key needed yet)
3. Store Reddit API credentials in Secret Manager
4. [AMENDED: A2] Implement `engines/intelligence.py` (fetch, Claude score, URL dedup, **in-memory** semantic dedup — title embeddings stored in local Python list only, never written to Firestore, discarded on function exit)
5. Deploy fn-intelligence-gather with Cloud Scheduler trigger (07:00 SGT)
6. Build /intelligence page (item list, filters, relevance scores, [AMENDED: C7] "Generate from Topic" button)
7. Implement `engines/content_orchestrate.py` (select top 3, create batch, Pub/Sub fan-out). [AMENDED: C7] Handle `topic_override` with optional URL: if URL provided, fetch content via httpx (GET, max 10KB), extract text, use as context. If text topic only, use directly.
8. [AMENDED: C4] Create `prompts/__version__.py` with `PROMPT_VERSIONS` dict mapping each prompt name to version string (all start at `"1.0.0"`).
9. [AMENDED: TK] Implement all 6 prompt templates (`prompts/linkedin.py` through `prompts/tiktok.py`)
10. [AMENDED: C2, C4] Implement `engines/platform_generate.py` (RAG retrieval, Claude call using `intelligence_item.summary` NOT `raw_content`, validation, `prompt_version` from `PROMPT_VERSIONS`, batch completion)
11. Deploy fn-content-orchestrate (Scheduler: 07:30 SGT) and fn-platform-generate (Pub/Sub)
12. [AMENDED: A1] Implement `engines/packaging.py` (ZIP assembly for content + partial package handling with `GENERATION_WARNINGS.txt`)
13. Deploy fn-package-builder (Pub/Sub on batch-complete)
14. [AMENDED: TK] Build /drafts page (6 platform tabs, inline editor, char counter, approve/reject)
15. Build /drafts/[id] page (full-screen editor, [AMENDED: C4] prompt_version in metadata panel)
16. [AMENDED: C6] Build /dashboard page (daily overview, package download, **status strip** at top polling `GET /api/health` every 60s via SWR, [AMENDED: C7] "Generate from Topic" modal)
17. [AMENDED: B1] Implement `GET /api/packages/{package_id}/download-url` endpoint for signed URL regeneration. Update `package-download.tsx` to always call this before opening URL.
18. [AMENDED: C7] Implement `POST /api/content/generate` endpoint: accepts `{topic, url?, platforms, language}`, triggers fn-content-orchestrate with topic_override
19. [AMENDED: C1] Add in-memory request-level cache to fn-api (Python dict with TTL: 60s for list queries, 5s for single-document queries). Applied to GET /intelligence, GET /signals, GET /drafts. Not cached: mutations, download URLs, outreach.
20. Configure DLQ topics and monitoring alerts
21. [AMENDED: C3] (Optional, disabled by default) Implement daily digest email — triggered by fn-package-builder after setting package status to "ready". Uses SendGrid free tier or Gmail API. Add `SENDGRID_API_KEY` to Secret Manager if using SendGrid. Add "Daily Digest" toggle + email input to /settings page.
22. End-to-end test: scheduler fires → intelligence gathered → content generated → ZIP downloadable. [AMENDED: A1] Also test: simulate DLQ scenario → verify recovery job produces partial package with warnings.

**Hard dependencies**: Phase 1 complete, Reddit API credentials, brand documents indexed
**Definition of done**: [AMENDED: TK] Every morning at 07:30, 6 platform-specific content drafts (LinkedIn, Instagram, TikTok, X, Reddit, Xiaohongshu) appear in the dashboard. Founder can review, edit, approve, and download the ZIP. Health status strip shows green. Manual "Generate from Topic" works. Stale batches are recovered within 3 hours.
**Risks**:

- Claude output may not match expected JSON schema → mitigate with strict Pydantic validation + retry
- Pub/Sub fan-out timing — all 5 generators must complete before packaging → mitigate with atomic batch counter + A1 recovery job
- Reddit API rate limits → mitigate with conservative polling (1 request/2 seconds)
**Est. GCP cost**: [AMENDED: C2] ~$7/month (Claude API dominant — reduced by summary-only input optimisation)

**System is useful at this point.** Founder can start using daily content packages. With C3 enabled, the entire content workflow operates via email without opening the dashboard.

### Phase 3 — Client Acquisition (Est. 2.5 weeks) [AMENDED: A1, B2, B3, C3, C4, C5]

**Tasks (in order):**

1. Implement `engines/signals.py` (reuse source adapters, Claude signal classifier)
2. Implement `prompts/signal_classifier.py`. [AMENDED: C4] Add version to `PROMPT_VERSIONS` dict.
3. Deploy fn-signal-detect with Cloud Scheduler trigger (08:00 SGT)
4. [AMENDED: B3] Build /signals page (signal feed with `qualify-panel.tsx` slide-over Sheet — see Section 7.6. Founder stays on /signals during qualification flow, no navigation to /leads.)
5. Implement `engines/qualification.py` (RAG retrieval of ICP + case studies, Claude qualifier)
6. Implement `prompts/icp_qualifier.py`. [AMENDED: C4] Add version to `PROMPT_VERSIONS` dict.
7. Add POST /api/leads/qualify endpoint to fn-api
8. Build /leads page (lead list, PII form, ICP scores)
9. [AMENDED: C5] Implement `engines/outreach_generate.py` (LinkedIn DM + cold email via Claude, with **domain-level** suppress list check: extract domain from contact_email, query suppress_list for both email and domain matches)
10. Implement `prompts/outreach.py`. [AMENDED: C4] Add versions to `PROMPT_VERSIONS` dict.
11. Add POST /api/outreach/generate endpoint to fn-api
12. Implement CAN-SPAM validation in Pydantic model (physical_address + unsubscribe_note required)
13. Implement CASL detection (company_location check for Canada → `casl_warning: true`)
14. Implement GDPR detection (company_location check for EU/EEA → `gdpr_applicable: true`)
15. Build /outreach/[id] page (DM + email editor, [AMENDED: C5] compliance checklist with updated wording "I have verified this company and contact are not on the suppress list", "Mark as Sent")
16. [AMENDED: C5] Implement suppress list: CRUD in fn-api, domain-level check before outreach generation, auto-add BOTH email entry AND domain entry on lead deletion
17. Implement "Delete Lead" cascade: delete lead + outreach_drafts + add to suppress_list (both email and domain entries)
18. Implement DSAR export: POST /api/leads/:id/export-pii
19. Implement leads packaging in fn-package-builder (ZIP assembly for leads)
20. [AMENDED: B2] Add Cloud Scheduler job `leads-package-daily` to Terraform (`infra/modules/scheduler/main.tf`): schedule `"0 12 * * *"` UTC (= 20:00 SGT), target POST to fn-api `/api/packages/leads/build`, OIDC auth. Add `POST /api/packages/leads/build` endpoint (idempotent — skip if today's package already "ready").
21. [AMENDED: A1] Implement `engines/retention.py` including stale batch recovery: query `content_packages` where `status == "generating"` AND `created_at < now - 3h`, set to `"partial"`, publish to `batch-complete`.
22. Deploy fn-retention-cleanup with Cloud Scheduler trigger (04:00 UTC)
23. [AMENDED: C3, C4] Build /settings page (sources, schedule, compliance, suppress list, "Daily Digest" toggle + email, "Prompt Versions" read-only table)
24. **Security review checkpoint**: audit entire codebase to confirm no automated send path exists
25. End-to-end test: signals detected → qualify via slide-over → enter PII → generate outreach → compliance checklist → mark as sent → download leads package

**Hard dependencies**: Phase 2 complete, ICP definition document uploaded, outreach tone guide uploaded, firm physical address provided
**Definition of done**: Daily signals appear, founder can qualify leads via slide-over panel, generate outreach with full compliance enforcement (including domain-level suppress), mark as sent with checklist, download leads package. No automated send path exists. Leads scheduler job fires daily at 20:00 SGT.
**Risks**:

- Company name extraction from unstructured text is imperfect → mitigate with manual correction in UI
- CASL/GDPR location detection is heuristic (based on company_location text) → mitigate with explicit flags in UI
- Legal review of Legitimate Interest Assessment must happen before go-live
**Est. GCP cost**: ~$12/month total (Claude + existing — reduced by C2 optimisation)

---

## 11. COST PROJECTION

Monthly cost at steady state (all 4 engines running, 30 days/month):

### Claude API via Vertex AI


| Use Case                         | Daily Input Tokens            | Daily Output Tokens | Monthly Cost                   |
| -------------------------------- | ----------------------------- | ------------------- | ------------------------------ |
| Intelligence scoring (20 items)  | ~22,000                       | ~3,000              | $2.34                          |
| Content generation (6 platforms) | [AMENDED: C2, TK, RK] ~3,000  | ~2,400              | [AMENDED: TK] ~$1.35           |
| Signal classification (15 items) | ~16,500                       | ~1,500              | $2.17                          |
| ICP qualification (3 leads)      | ~4,000                        | ~600                | $0.63                          |
| Outreach generation (6 drafts)   | ~8,000                        | ~1,800              | $1.53                          |
| **Claude subtotal**              | **[AMENDED: TK] ~53,500/day** | **~9,300/day**      | **[AMENDED: TK] ~$6.00/month** |


Calculation: (input_tokens * 30 / 1M * $3) + (output_tokens * 30 / 1M * $15)

### Other Services


| Service                                         | Monthly Cost                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Vertex AI Embeddings (gemini-embedding-001)     | [AMENDED: C9] $0 (free tier — **verify before Phase 1**, see Section 12) |
| Firestore (reads/writes/deletes)                | $0 (free tier: ~3K reads/day)                                            |
| Cloud Storage (~15 MB stored)                   | $0.01                                                                    |
| Cloud Functions compute (~10 min/day at 512 MB) | $0 (free tier)                                                           |
| Cloud Scheduler ([AMENDED: B2] 5 jobs)          | $0.10                                                                    |
| Cloud Run — frontend (minimal traffic)          | $0 (free tier)                                                           |
| Firebase Hosting (CDN)                          | $0 (free tier)                                                           |
| Firebase Auth                                   | $0 (free tier)                                                           |
| Cloud Monitoring / Error Reporting              | $0 (free tier)                                                           |
| Reddit API                                      | $0 (free tier)                                                           |
| X API (disabled by default)                     | $0 ($200/month if enabled)                                               |
| [AMENDED: C3] SendGrid (daily digest, optional) | $0 (free tier: 100 emails/day)                                           |


### Monthly Totals


| Scenario                             | Total                          |
| ------------------------------------ | ------------------------------ |
| **X API disabled (default)**         | **[AMENDED: C2] ~$5.65/month** |
| X API enabled                        | ~$205.65/month                 |
| 2x token usage (safety margin)       | [AMENDED: C2] ~$11.15/month    |
| 3x token usage (aggressive estimate) | [AMENDED: C2] ~$17/month       |


[AMENDED: C2] Costs reduced from original $8.50 to ~$5.65/month by using `intelligence_item.summary` instead of `raw_content` in content generation prompts. Well under the $100/month target. Even at 10x the estimated token usage, the cost would be ~$57/month.

---

## 12. OPEN QUESTIONS / DECISIONS NEEDED

### Must Resolve Before Build

1. **Vertex AI Claude model string**: The plan uses `claude-sonnet-4-6`. This MUST be verified against Vertex AI Model Garden in the `us-east5` region (or whichever region Anthropic models are available). The model string format on Vertex AI may differ from the direct API string.
2. **Claude region on Vertex AI**: Anthropic models on Vertex AI are available in limited regions (`us-east5`, `europe-west1`). Traffic from `asia-southeast1` functions to `us-east5` Claude adds ~200ms latency. Acceptable for daily batch processing; confirm this is fine.
3. **X API ($200/month)**: In or out for v1? The system is designed with X source adapter disabled by default. The founder activates it only if budget allows. Confirm: build the adapter code in Phase 2 but leave `enabled: false`?
4. **Firm physical address for CAN-SPAM**: Every cold email draft requires a valid physical mailing address. The founder must provide this before Engine 4 goes live. Singapore registered address is acceptable.
5. **Legal review of GDPR Legitimate Interest Assessment**: Before Engine 4 (outreach) goes live, a Legitimate Interest Assessment document should be prepared. This is a legal task, not a technical one. Confirm: proceed with technical build and flag legal review as a gate before Phase 3 go-live?
6. **Image prompt format preference**: The system generates text-based image prompts. Should these be formatted for Midjourney (e.g., `"/imagine prompt: ..."` style with aspect ratios and style parameters) or Canva AI (simpler descriptive text)? Or both formats per platform?
7. [AMENDED: C9] **Verify `gemini-embedding-001` pricing**: Check GCP Pricing Calculator (cloud.google.com/vertex-ai/pricing) before Phase 1 begins. If billed, estimated cost at current volume: ~50 chunks/doc × 3072 dimensions × $X/1K characters = $Y/month. Update Section 11 cost projection accordingly. If billing is confirmed, add `EMBEDDING_COST_PER_1K_CHARS` to `system_config` as a tracked constant.
8. [AMENDED: C3] **Daily digest email provider**: Choose between SendGrid free tier (100 emails/day, requires API key in Secret Manager) or Gmail API with service account impersonation (no additional secret needed). Decide before Phase 2 task 20.

### Recommended But Not Blocking

1. **Reddit API app registration**: Has the founder already registered a Reddit API application (script type)? If not, this must be done before Phase 2. Registration is instant.
2. **Firebase project**: Does a Firebase project already exist, or should Terraform create one from scratch? Creating via Terraform requires the Firebase Management API enabled.
3. **Custom domain**: Is there a preferred domain for the dashboard (e.g., `marketing.intonationlabs.com`)? Firebase Hosting supports custom domains. Default: `{project}.web.app`.
4. **CI/CD preference**: The plan specifies GitHub Actions. Confirm this is preferred over Cloud Build (which is native to GCP and avoids GitHub Actions minutes billing)?
5. **Timezone for schedules**: The plan uses `Asia/Singapore` (SGT, UTC+8) for Cloud Scheduler. The founder is currently in Ireland (IST, UTC+0/+1). Which timezone should the daily triggers use? Recommendation: SGT, since the business is Singapore-registered and the founder will relocate there.
6. **Xiaohongshu brand documents**: Does the founder have brand documents in Simplified Chinese, or should the English documents be used with Claude translating context at generation time? Recommendation: upload Chinese versions for better RAG quality; fall back to English with translation if unavailable.

---

## 13. ARCHITECTURE CONSTRAINTS [AMENDED: Section D]

These constraints are binding for the entire implementation. They override any contradictory statement elsewhere in the plan.

1. **FASTAPI OVER FLASK**: fn-api uses FastAPI with uvicorn, not Flask. All route handlers are `async def`. Request/response validation via Pydantic. Route modules use `APIRouter`, not Flask blueprints.
2. **NO TITLE EMBEDDINGS IN FIRESTORE**: `intelligence_items` has no vector field. Semantic deduplication is in-memory only within `fn-intelligence-gather`. The only Firestore vector index is on `brand_chunks.embedding`.
3. **SIGNED URL PATTERN**: All Cloud Storage file access from the frontend goes through `GET /api/packages/{id}/download-url`. No direct GCS URLs in the frontend. Signed URLs are regenerated on-demand when expired.
4. **SLIDE-OVER FOR QUALIFICATION**: Signal qualification uses a slide-over panel (Sheet component), not page navigation. The founder never leaves the `/signals` page during the qualification flow.
5. **PROMPT VERSIONS ARE CODE**: Prompt templates are Python modules with explicit version strings in `prompts/__version__.py`. They are never edited via the dashboard UI. Changes go through git, which creates an automatic audit trail.
6. **HEALTH CHECK IS ALWAYS AVAILABLE**: `GET /api/health` requires NO authentication. It is a public endpoint. This allows external uptime monitoring (e.g., UptimeRobot free tier) without credentials.
7. **DAILY DIGEST IS DEFAULT-OFF**: The email digest feature is implemented in Phase 2 but disabled by default (`daily_digest_enabled: false`). The founder opts in via `/settings`. It is never a system requirement — just a convenience feature.
8. **PACKAGE DOWNLOAD IS ALWAYS REGENERATED**: The frontend never caches signed URLs. Every click of a download button makes a fresh call to `GET /api/packages/{id}/download-url`. The backend handles caching (returns existing URL if it has >1 hour remaining).
9. [AMENDED: TK] **TIKTOK IS TEXT + IMAGE ONLY**: TikTok content is photo mode / text posts with static images only. NO video generation, NO video scripts, NO video directions. Delivery method is identical to Instagram but with distinct tone, audience targeting (18-35), and algorithm optimisation. The `hook_line` field is unique to TikTok and designed for text overlay use.
10. [AMENDED: TK] **DUAL IMAGE PROMPTS**: All visual platforms (LinkedIn, Instagram, X, TikTok) generate both a Midjourney-formatted prompt (with `--ar` aspect ratio and `--style raw` parameters) and a Canva AI-formatted prompt (simple descriptive text). Reddit is text-only (no image prompts). Xiaohongshu has its own Chinese image prompt format (`image_prompts_zh`). The single `image_prompt` field is deprecated — replaced by `image_prompt_midjourney` and `image_prompt_canva`.

