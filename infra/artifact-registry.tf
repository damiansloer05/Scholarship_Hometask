resource "google_artifact_registry_repository" "main" {
  provider      = google
  repository_id = var.artifact_registry_repo
  format        = "DOCKER"
  location      = var.region
  description   = "Docker images for admissions dashboard services"

  depends_on = [google_project_service.apis]
}
