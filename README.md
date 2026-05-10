# Admissions Readiness Dashboard

A full-stack EdTech application that lets students track their application readiness across higher-education programs. Students create a password-protected profile, browse a program catalog, generate a personalized checklist, and watch their readiness score update in real time as they work through requirements. An admin dashboard aggregates progress across all students with charts and a per-student breakdown.

**Stack:** Nuxt 3 (SSR) · GraphQL Yoga · Drizzle ORM · PostgreSQL · Pinia · Tailwind CSS

---

## What's built

The app covers the complete student flow end to end:

1. **Password-based authentication with JWT** — sign-up and sign-in both issue a signed JWT (HS256, 30-day expiry). Passwords are hashed with bcrypt (12 rounds) before storage. The token is stored in `localStorage` and sent as `Authorization: Bearer` on every GraphQL request. Protected mutations verify the token and enforce ownership — a student cannot modify another student's checklist. The server auto-clears the session and redirects to the sign-in page on an expired or invalid token.
2. **Profile intake** — validated sign-up form capturing full name, email, password, education level, GPA, test scores, and target term. Client-side confirm-password check prevents mismatches before the request is sent.
3. **Program catalog** — searchable, filterable list with pagination (9 per page). Degree-type filter and live search, both debounced.
4. **Checklist generation** — one checklist item per program requirement, with `dueDate = applicationDeadline − dueOffsetDays` computed server-side. Generation is idempotent — navigating back or bookmarking the dashboard URL never creates duplicate rows.
5. **Readiness dashboard** — circular SVG progress indicator, "still needed" callout (required items only), checklist grouped by category (ACADEMICS / TEST_SCORES / DOCUMENTS / RECOMMENDATIONS / ESSAYS), collapsible per-item notes with 600 ms debounced auto-save.
6. **Timeline** — vertical chronological view, colour-coded UPCOMING / DUE_SOON / OVERDUE / COMPLETE.
7. **Admin dashboard** — sign in as `admin@edtech.com` to access a separate view showing: total students and active checklists, average readiness score, item completion rate, score distribution bar chart (5 buckets), status breakdown (Completed / In Progress / Pending), and a per-student progress table with per-program readiness bars.
8. **Reactivity** — all status changes apply optimistically in the Pinia store; readiness score, missing requirements list, and timeline status all update immediately without a page reload. Failed mutations revert automatically.

---

## Architecture

```
Browser
  │
  ▼
Cloud Load Balancer (HTTPS · managed SSL)
  ├──► app.yourdomain.com  →  Cloud Run v2: Nuxt 3 SSR
  └──► api.yourdomain.com  →  Cloud Run v2: GraphQL API
                                      │
                            Cloud SQL Auth Proxy (Unix socket)
                                      │
                            Cloud SQL PostgreSQL (private IP · VPC)
                                      │
                            Secret Manager (credentials)
```

For local development the Nuxt UI talks directly to the Node API on port 4000; no proxy or gateway is involved.

---

## Running locally (Windows, no Docker)

These instructions match the native Node.js setup — PostgreSQL running locally, no containers required.

### Prerequisites

- Node.js 20+
- PostgreSQL (any recent version) running locally

### 1. Clone and install

```powershell
git clone https://github.com/damiansloer05/Scholarship_Hometask.git
cd Scholarship_Hometask

cd api && npm install
cd ..\ui && npm install
```

### 2. Configure the API

Create `api/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=admissions
DB_USER=admissions_user
DB_PASSWORD="your_password_here"
CORS_ORIGIN=http://localhost:3000
PORT=4000
NODE_ENV=development
JWT_SECRET=change-this-to-a-long-random-string
```

> Quote the password value if it contains `#` or `@` — dotenv treats unquoted `#` as a comment character.
> Use a long random string for `JWT_SECRET` in production (e.g. `openssl rand -hex 32`).

Create `ui/.env`:

```env
NUXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

### 3. Set up the database

Find your PostgreSQL bin path (e.g. `C:\Program Files\PostgreSQL\18\bin`) and run:

```powershell
$env:PGPASSWORD = "your_postgres_superuser_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE USER admissions_user WITH PASSWORD 'your_password_here';"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE admissions OWNER admissions_user;"
```

### 4. Run migrations and seed

```powershell
cd api
npm run db:migrate   # applies all Drizzle migrations
npm run db:seed      # inserts admin account, 4 programs, and 25 requirements
```

### 5. Start the servers

Open two terminals:

```powershell
# Terminal 1 — API
cd api && npm run dev
# GraphQL endpoint: http://localhost:4000/graphql
# GraphiQL playground: http://localhost:4000/graphql (browser)
```

```powershell
# Terminal 2 — UI
cd ui && npm run dev
# http://localhost:3000
```

### Default credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@edtech.com | Admin@2025! |
| Student | *(create via sign-up form)* | *(your choice, min 8 chars)* |

---

## Admin dashboard

Sign in at the homepage with the seeded admin credentials:

| Email | Password |
|---|---|
| admin@edtech.com | Admin@2025! |

The sign-in flow detects the admin email and redirects to `/admin` instead of `/programs`. An "Admin Dashboard" link also appears in the navigation while signed in as admin. The dashboard is read-only and pulls a single `getAdminStats` GraphQL query that aggregates all student data server-side — no student data is visible to other students.

---

## Tests

```powershell
cd api
npm test
```

There are two test suites, both running with Vitest:

- **`tests/date.test.ts`** — covers `computeDueDate`, `getDaysUntilDue`, and `getTimelineStatus` edge cases (month boundaries, overdue detection, 14-day DUE_SOON window).
- **`tests/readiness.test.ts`** — covers `computeReadinessScore`, `getMissingRequirements`, and `buildReadinessReport`, including the edge case where optional requirements should not affect the score.

These tests pin the core business logic that the UI depends on for real-time feedback. If `computeReadinessScore` drifts from the server formula, the optimistic client-side updates would show the wrong number — which is why these are covered first.

---

## GCP Deployment

The project includes full Terraform IaC targeting a production-grade GCP setup. It was validated end-to-end on a time-limited Qwiklabs account to confirm the build, migration, and serving pipeline all work in a real cloud environment before submission.

### Infrastructure created by Terraform

| Resource | Purpose |
|---|---|
| Artifact Registry | Docker image storage |
| Cloud SQL (PostgreSQL, db-f1-micro) | Database with private IP |
| VPC + Serverless Connector | Private network path for Cloud Run → Cloud SQL |
| Secret Manager | Stores DB credentials and JWT secret at runtime |
| Cloud Run v2 (API + UI) | Serverless containers, min 0 / max 5 instances |
| Cloud Run Jobs | One-off migration and seed runs |
| Global External Load Balancer | Routes `api.*` and `app.*` subdomains |
| Managed SSL certificate | HTTPS for both subdomains |
| Cloud DNS zone | DNS management |
| Cloud Build trigger | CI/CD on push to `main` |

### Quick deploy (using `gcloud` directly — no Terraform needed)

This is the fastest path for accounts with restricted IAM permissions (e.g. Qwiklabs):

```powershell
# Set variables
$PROJECT    = "your-project-id"
$REGION     = "us-central1"
$DB_INST    = "admissions-db"
$DB_NAME    = "admissions"
$DB_USER    = "admissions_user"
$DB_PASS    = "your-db-password"
$JWT_SECRET = "your-jwt-secret"
$REPO       = "admissions-repo"
$API_SVC    = "admissions-api"
$UI_SVC     = "admissions-ui"
$REGISTRY   = "$REGION-docker.pkg.dev/$PROJECT/$REPO"
$CONN       = "${PROJECT}:${REGION}:${DB_INST}"
$SOCKET     = "/cloudsql/$CONN"

gcloud config set project $PROJECT
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
```

```powershell
# Enable APIs
gcloud services enable run.googleapis.com sqladmin.googleapis.com `
  artifactregistry.googleapis.com cloudbuild.googleapis.com

# Create Artifact Registry
gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION

# Create Cloud SQL (takes ~10 min)
gcloud sql instances create $DB_INST --database-version=POSTGRES_15 `
  --tier=db-f1-micro --region=$REGION --no-backup
gcloud sql databases create $DB_NAME --instance=$DB_INST
gcloud sql users create $DB_USER --instance=$DB_INST --password=$DB_PASS

# Build API image via Cloud Build (no local Docker needed)
cd path\to\Scholarship_Hometask
gcloud builds submit ./api --tag="$REGISTRY/${API_SVC}:latest"

# Deploy API
gcloud run deploy $API_SVC --image="$REGISTRY/${API_SVC}:latest" `
  --region=$REGION --allow-unauthenticated --add-cloudsql-instances=$CONN `
  --set-env-vars="NODE_ENV=production,PORT=4000,DB_HOST=$SOCKET,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASS,JWT_SECRET=$JWT_SECRET" `
  --memory=512Mi

# Save the API URL
$API_URL = gcloud run services describe $API_SVC --region=$REGION --format="value(status.url)"

# Run migrations + seed
gcloud run jobs create admissions-migrate --image="$REGISTRY/${API_SVC}:latest" `
  --region=$REGION --add-cloudsql-instances=$CONN `
  --set-env-vars="DB_HOST=$SOCKET,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASS,JWT_SECRET=$JWT_SECRET" `
  --command=node --args="dist/db/migrate.js" --max-retries=0
gcloud run jobs execute admissions-migrate --region=$REGION --wait

gcloud run jobs create admissions-seed --image="$REGISTRY/${API_SVC}:latest" `
  --region=$REGION --add-cloudsql-instances=$CONN `
  --set-env-vars="DB_HOST=$SOCKET,DB_PORT=5432,DB_NAME=$DB_NAME,DB_USER=$DB_USER,DB_PASSWORD=$DB_PASS,JWT_SECRET=$JWT_SECRET" `
  --command=node --args="dist/db/seed.js" --max-retries=0
gcloud run jobs execute admissions-seed --region=$REGION --wait

# Build UI image (bakes API URL at build time)
@"
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [build, --target=runner, --build-arg=NUXT_PUBLIC_API_URL=$API_URL/graphql, --tag=$REGISTRY/${UI_SVC}:latest, .]
images: ['$REGISTRY/${UI_SVC}:latest']
"@ | Out-File -Encoding utf8 .\ui\cb-ui.yaml
gcloud builds submit ./ui --config=ui/cb-ui.yaml

# Deploy UI
gcloud run deploy $UI_SVC --image="$REGISTRY/${UI_SVC}:latest" `
  --region=$REGION --allow-unauthenticated `
  --set-env-vars="NODE_ENV=production,NUXT_PUBLIC_API_URL=$API_URL/graphql" `
  --memory=512Mi
```

### Terraform path (full production setup with custom domain)

```powershell
# One-time: create the GCS state bucket
gsutil mb -p $PROJECT -l $REGION gs://${PROJECT}-tf-state

# Update infra/main.tf backend bucket name, then:
cd infra
terraform init
terraform plan
terraform apply   # ~10 min — Cloud SQL is the slow part
```

After apply, point your domain's A records at the `load_balancer_ip` output. SSL certificate provisioning takes 15–30 minutes once DNS propagates.

---

## API Reference

GraphQL endpoint: `/graphql` (GraphiQL playground available in development)

### Queries

```graphql
listPrograms(
  filters: { search: String, degreeType: DegreeType }
  page: Int
  limit: Int
): ProgramConnection

getProgram(id: ID!): Program

getReadiness(profileId: ID!, programId: ID!): ReadinessReport
# Returns: readinessScore, totalRequired, completedRequired,
#          missingRequirements[], nextMilestones[]

getTimeline(profileId: ID!, programId: ID!): [TimelineEvent]
# Ordered chronologically ascending

getAdminStats: AdminStats!
# Requires a valid admin JWT. Aggregates all student progress —
# score distribution, per-student per-program readiness, and item status totals.
```

### Mutations

```graphql
createProfile(input: ProfileInput!): AuthPayload!
# Hashes password with bcrypt (12 rounds), inserts profile, returns { token, profile }

signIn(email: String!, password: String!): AuthPayload!
# Case-insensitive email lookup + bcrypt verify. Returns the same generic error
# for "not found" and "wrong password" to prevent email enumeration.

updateProfile(id: ID!, input: ProfileInput!): StudentProfile!
# Requires Authorization: Bearer <token> matching the profile being updated

createChecklist(profileId: ID!, programId: ID!): [ChecklistItem]
# Idempotent — safe to call multiple times; requires valid token for profileId

updateChecklistItem(
  profileId: ID!
  requirementId: ID!
  input: { status: ChecklistStatus!, notes: String }
): ChecklistItem
# Requires valid token for profileId
```

Protected operations return `UNAUTHENTICATED` (missing/invalid token) or `FORBIDDEN` (wrong profile) error codes. The UI clears the stored token and redirects to the sign-in page on `UNAUTHENTICATED`. Input validation is handled by Zod schemas on the API side — unique email constraint violations surface as a readable message rather than a raw Postgres error.

---

## Seeded data

The seed is idempotent — safe to re-run at any time. It inserts:

**Admin account**

| Email | Password |
|---|---|
| admin@edtech.com | Admin@2025! |

**Programs**

| Program | Degree | Deadline | Requirements |
|---|---|---|---|
| MS Computer Science | MASTER | 2026-12-01 | 6 (5 required) |
| MBA — Full-Time | MASTER | 2027-01-15 | 7 (6 required) |
| BS Computer Science | BACHELOR | 2027-01-01 | 6 (6 required) |
| PhD Data Science | PHD | 2026-11-15 | 7 (6 required) |

Requirements span ACADEMICS, TEST_SCORES, DOCUMENTS, RECOMMENDATIONS, and ESSAYS categories with `dueOffsetDays` ranging from 14 to 90 days before the program deadline.

---

## Tradeoffs & what I'd improve

### Decisions I made consciously

**`$fetch` + composables instead of a GraphQL client library.** I avoided urql and Apollo because both add meaningful bundle weight and neither integrates with Nuxt SSR as cleanly as the built-in `$fetch`. The tradeoff is no automatic cache normalization — mutations trigger a targeted store update rather than a cache invalidation. It works fine here because the data graph is shallow, but it would get messy with more entities.

**Optimistic updates in Pinia without server reconciliation.** Status changes and note saves apply immediately in the store. If the API call fails, the store reverts. The downside is that two open browser tabs can diverge — the second tab only syncs on reload. For a single-student demo this is fine; adding WebSocket subscriptions or polling would close the gap.

**Sequential then parallel GraphQL fetching in `initChecklist`.** The first call to `getChecklist` runs alone because it also creates the checklist rows if they don't exist yet. Only after those rows are guaranteed to exist do `getReadiness` and `getTimeline` fire in parallel. This avoids a race condition where all three resolvers race to insert the same rows — I hit this bug during development and the fix adds one round-trip on first visit, which is acceptable.

**bcrypt password hashing with JWT sessions.** Passwords are hashed at rest with bcrypt (12 rounds). Sign-in and sign-up both return a signed JWT (HS256, 30-day expiry) stored in `localStorage`. Every subsequent GraphQL request carries it as `Authorization: Bearer <token>`. The API verifies the token in the context factory before any protected resolver runs; mutations additionally check that the caller's profile ID matches the resource being written. The `signIn` resolver returns the same error message for both "not found" and "wrong password" to avoid leaking which emails are registered. The natural next step is short-lived access tokens with a refresh-token rotation scheme.

**`db-f1-micro` Cloud SQL tier.** Cheapest option for a demo account; fine for ~20 concurrent connections. Any real load would need at least `db-g1-small` or connection pooling via PgBouncer.

**`deletion_protection = false` on Cloud SQL.** Set to `true` before taking this anywhere near production. I left it off so the Qwiklabs environment could be torn down cleanly at the end of the session.

### What I'd add with more time

- **Token refresh** — short-lived access tokens (15 min) with a long-lived refresh token stored in an `HttpOnly` cookie, plus a `/auth/refresh` endpoint. Eliminates the 30-day window where a stolen token remains valid.
- **Multi-program comparison** — the data model already supports it (a profile can have checklists for multiple programs); the dashboard would just need a program-picker and a side-by-side score view.
- **Email reminders** — Cloud Scheduler → Cloud Tasks → a transactional mail provider (Resend/SendGrid) triggered 7 days before each checklist item's `dueDate`.
- **Staging environment** — a separate Terraform workspace pointing at a second GCP project, deployed by Cloud Build on pushes to `staging` rather than `main`.
- **Observability** — Cloud Trace for distributed request tracing, custom Prometheus metrics surfaced via OpenTelemetry for per-resolver GraphQL latency.
- **E2E tests** — Playwright tests covering the full happy path (create profile → select program → mark items complete → verify score reaches 100%) running against a seeded test database in CI.
