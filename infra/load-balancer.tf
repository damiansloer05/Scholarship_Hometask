# ── Global static IP ──────────────────────────────────────────────────────────
resource "google_compute_global_address" "main" {
  name = "admissions-ip"
}

# ── Serverless NEGs (Network Endpoint Groups for Cloud Run) ───────────────────
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "admissions-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

resource "google_compute_region_network_endpoint_group" "ui_neg" {
  name                  = "admissions-ui-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.ui.name
  }
}

# ── Backend services ──────────────────────────────────────────────────────────
resource "google_compute_backend_service" "api" {
  name     = "admissions-api-backend"
  protocol = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
}

resource "google_compute_backend_service" "ui" {
  name     = "admissions-ui-backend"
  protocol = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.ui_neg.id
  }
}

# ── URL Map — route by host header ────────────────────────────────────────────
resource "google_compute_url_map" "main" {
  name            = "admissions-url-map"
  default_service = google_compute_backend_service.ui.id

  host_rule {
    hosts        = ["${var.api_subdomain}.${var.domain_root}"]
    path_matcher = "api"
  }

  host_rule {
    hosts        = ["${var.ui_subdomain}.${var.domain_root}"]
    path_matcher = "ui"
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.api.id
  }

  path_matcher {
    name            = "ui"
    default_service = google_compute_backend_service.ui.id
  }
}

# ── Managed SSL Certificate ───────────────────────────────────────────────────
resource "google_compute_managed_ssl_certificate" "main" {
  name = "admissions-ssl-cert"

  managed {
    domains = [
      "${var.api_subdomain}.${var.domain_root}",
      "${var.ui_subdomain}.${var.domain_root}",
    ]
  }
}

# ── HTTPS proxy ───────────────────────────────────────────────────────────────
resource "google_compute_target_https_proxy" "main" {
  name             = "admissions-https-proxy"
  url_map          = google_compute_url_map.main.id
  ssl_certificates = [google_compute_managed_ssl_certificate.main.id]
}

# ── HTTPS forwarding rule ─────────────────────────────────────────────────────
resource "google_compute_global_forwarding_rule" "https" {
  name                  = "admissions-https-forwarding"
  target                = google_compute_target_https_proxy.main.id
  port_range            = "443"
  ip_address            = google_compute_global_address.main.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# ── HTTP → HTTPS redirect ─────────────────────────────────────────────────────
resource "google_compute_url_map" "http_redirect" {
  name = "admissions-http-redirect"
  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "redirect" {
  name    = "admissions-http-proxy"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "admissions-http-forwarding"
  target                = google_compute_target_http_proxy.redirect.id
  port_range            = "80"
  ip_address            = google_compute_global_address.main.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
