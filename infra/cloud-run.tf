locals {
  image_base = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo}"
}

# ── API Service ───────────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "api" {
  name     = var.api_service_name
  location = var.region

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    # Cloud SQL Unix socket connector
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "${local.image_base}/${var.api_image_name}:latest"

      ports {
        container_port = 4000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "4000"
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "CORS_ORIGIN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cors_origin.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/healthz"
          port = 4000
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = "/healthz"
          port = 4000
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.main,
    google_sql_database_instance.main,
    google_secret_manager_secret_version.database_url,
  ]
}

# ── UI Service ────────────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "ui" {
  name     = var.ui_service_name
  location = var.region

  template {
    service_account = google_service_account.ui.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = "${local.image_base}/${var.ui_image_name}:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NUXT_PUBLIC_API_URL"
        value = "https://${var.api_subdomain}.${var.domain_root}/graphql"
      }

      startup_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = "/"
          port = 3000
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.main,
    google_cloud_run_v2_service.api,
  ]
}
