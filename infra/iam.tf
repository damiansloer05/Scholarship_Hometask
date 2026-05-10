# ── Service account: API Cloud Run service ────────────────────────────────────
resource "google_service_account" "api" {
  account_id   = "admissions-api-sa"
  display_name = "Admissions API — Cloud Run SA"
}

# Allow API SA to read secrets
resource "google_project_iam_member" "api_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Allow API SA to connect to Cloud SQL
resource "google_project_iam_member" "api_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# ── Service account: UI Cloud Run service ─────────────────────────────────────
resource "google_service_account" "ui" {
  account_id   = "admissions-ui-sa"
  display_name = "Admissions UI — Cloud Run SA"
}

# ── Service account: Cloud Build ──────────────────────────────────────────────
resource "google_service_account" "cloudbuild" {
  account_id   = "admissions-cloudbuild-sa"
  display_name = "Admissions — Cloud Build SA"
}

resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_storage" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

# Allow unauthenticated invocations of Cloud Run (public app)
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "ui_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.ui.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
