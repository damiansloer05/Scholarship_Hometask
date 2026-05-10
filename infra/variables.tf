variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "domain_root" {
  description = "Root domain (e.g. yourdomain.com)"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for the API service"
  type        = string
  default     = "api"
}

variable "ui_subdomain" {
  description = "Subdomain for the UI service"
  type        = string
  default     = "app"
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "admissions-repo"
}

variable "api_image_name" {
  description = "Docker image name for the API service"
  type        = string
  default     = "admissions-api"
}

variable "ui_image_name" {
  description = "Docker image name for the UI service"
  type        = string
  default     = "admissions-ui"
}

variable "api_service_name" {
  description = "Cloud Run service name for the API"
  type        = string
  default     = "admissions-api"
}

variable "ui_service_name" {
  description = "Cloud Run service name for the UI"
  type        = string
  default     = "admissions-ui"
}

variable "db_instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "admissions-db"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "admissions"
}

variable "db_user" {
  description = "PostgreSQL user"
  type        = string
  default     = "admissions_user"
}

variable "db_password" {
  description = "PostgreSQL password — stored in Secret Manager, never in state"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub username / organisation"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_branch" {
  description = "Branch that triggers Cloud Build"
  type        = string
  default     = "main"
}
