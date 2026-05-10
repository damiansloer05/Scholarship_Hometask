# VPC for private Cloud SQL connectivity
resource "google_compute_network" "main" {
  name                    = "admissions-vpc"
  auto_create_subnetworks = false

  depends_on = [google_project_service.apis]
}

resource "google_compute_subnetwork" "main" {
  name          = "admissions-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

# Private services access — required for Cloud SQL private IP
resource "google_compute_global_address" "private_ip_range" {
  name          = "admissions-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]

  depends_on = [google_project_service.apis]
}

# Serverless VPC Connector — allows Cloud Run to reach private IP resources
resource "google_vpc_access_connector" "main" {
  name          = "admissions-connector"
  region        = var.region
  network       = google_compute_network.main.name
  ip_cidr_range = "10.8.0.0/28"   # must not overlap with other subnets
  min_instances = 2
  max_instances = 5
  machine_type  = "f1-micro"

  depends_on = [google_project_service.apis]
}
