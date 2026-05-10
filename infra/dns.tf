# Managed Cloud DNS zone.
# After terraform apply, copy the NS records shown in `name_servers` output
# to your domain registrar's nameserver settings.
resource "google_dns_managed_zone" "main" {
  name        = "admissions-zone"
  dns_name    = "${var.domain_root}."
  description = "Admissions dashboard DNS zone"

  depends_on = [google_project_service.apis]
}

resource "google_dns_record_set" "api" {
  name         = "${var.api_subdomain}.${var.domain_root}."
  managed_zone = google_dns_managed_zone.main.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.main.address]
}

resource "google_dns_record_set" "ui" {
  name         = "${var.ui_subdomain}.${var.domain_root}."
  managed_zone = google_dns_managed_zone.main.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.main.address]
}

output "name_servers" {
  description = "Add these NS records at your domain registrar to delegate DNS to Google Cloud"
  value       = google_dns_managed_zone.main.name_servers
}
