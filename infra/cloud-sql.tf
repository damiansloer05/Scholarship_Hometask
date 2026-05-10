resource "google_sql_database_instance" "main" {
  name             = var.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-f1-micro"   # cheapest tier — upgrade for production load
    availability_type = "ZONAL"         # REGIONAL for HA in production

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = false
    }

    ip_configuration {
      ipv4_enabled    = false           # no public IP — access via Cloud SQL connector
      private_network = google_compute_network.main.id
      require_ssl     = false           # SSL enforced at socket level by Cloud SQL connector
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = false           # set true for production

  depends_on = [
    google_project_service.apis,
    google_service_networking_connection.private_vpc_connection,
  ]
}

resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
