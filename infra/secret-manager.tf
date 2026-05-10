# ── Database URL secret ───────────────────────────────────────────────────────
resource "google_secret_manager_secret" "database_url" {
  secret_id = "admissions-database-url"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id
  # Connection string using Cloud SQL Unix socket (injected by Cloud Run at runtime)
  secret_data = "postgresql://${var.db_user}:${var.db_password}@/${var.db_name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
}

# ── CORS origin secret (UI URL) ───────────────────────────────────────────────
resource "google_secret_manager_secret" "cors_origin" {
  secret_id = "admissions-cors-origin"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cors_origin" {
  secret      = google_secret_manager_secret.cors_origin.id
  secret_data = "https://${var.ui_subdomain}.${var.domain_root}"
}

# ── Grant API SA access to its specific secrets only ─────────────────────────
resource "google_secret_manager_secret_iam_member" "api_database_url" {
  secret_id = google_secret_manager_secret.database_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}

resource "google_secret_manager_secret_iam_member" "api_cors_origin" {
  secret_id = google_secret_manager_secret.cors_origin.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}
