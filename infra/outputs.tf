output "load_balancer_ip" {
  description = "Global IP of the Application Load Balancer — add this as an A record for your domain"
  value       = google_compute_global_address.main.address
}

output "api_url" {
  description = "Public URL for the GraphQL API"
  value       = "https://${var.api_subdomain}.${var.domain_root}/graphql"
}

output "ui_url" {
  description = "Public URL for the UI"
  value       = "https://${var.ui_subdomain}.${var.domain_root}"
}

output "cloud_run_api_url" {
  description = "Direct Cloud Run URL for the API (bypass LB)"
  value       = google_cloud_run_v2_service.api.uri
}

output "cloud_run_ui_url" {
  description = "Direct Cloud Run URL for the UI (bypass LB)"
  value       = google_cloud_run_v2_service.ui.uri
}

output "artifact_registry_repo" {
  description = "Full Artifact Registry path for Docker push"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo}"
}

output "db_connection_name" {
  description = "Cloud SQL instance connection name (used by Cloud Run Cloud SQL connector)"
  value       = google_sql_database_instance.main.connection_name
}
