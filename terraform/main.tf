terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = ">= 1.0.0"
    }
    grafana = {
      source  = "grafana/grafana"
      version = ">= 3.0.0"
    }
  }
}

# --- Providers ---
provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

provider "grafana" {
  url  = var.grafana_url
  auth = var.grafana_api_key

  connections_api_access_token = var.grafana_connections_token
  connections_api_url          = "https://connections-api-prod-eu-west-2.grafana.net"
}

# --- 1. Base PostgreSQL Cloud (Render) ---
resource "render_postgres" "ivo_db" {
  name          = "ivo-postgres"
  plan          = "free"
  region        = "frankfurt"
  version       = "15"
  database_name = "ivo_db"
  database_user = "ivo_user"
}

# --- 2. Backend Python (Render) ---
resource "render_web_service" "ivo_api" {
  name    = "ivo-backend"
  plan    = "free"
  region  = "frankfurt"

  runtime_source = {
    docker = {
      repo_url        = "https://github.com/faniry2727/IVO-marketplace"
      branch          = "main"
      context         = "./backend"
      dockerfile_path = "./backend/Dockerfile"
    }
  }

  env_vars = {
    DATABASE_URL = {
      value = render_postgres.ivo_db.connection_info.internal_connection_string
    }
  }
}

# --- 3. Frontend React (Render) ---
resource "render_static_site" "ivo_frontend" {
  name          = "ivo-shop"
  repo_url      = "https://github.com/faniry2727/IVO-marketplace"
  branch        = "main"
  build_command = "npm run build"
  publish_path  = "dist"

  env_vars = {
    VITE_API_URL = {
      value = "${render_web_service.ivo_api.url}/api"
    }
  }

  routes = [
    {
      type        = "rewrite"
      source      = "/*"
      destination = "/index.html"
    }
  ]
}

# --- 4. Grafana Cloud : Collecte des métriques ---
resource "grafana_connections_metrics_endpoint_scrape_job" "ivo_metrics" {
  stack_id                = var.grafana_stack_id
  name                    = "ivo-backend-scrape"
  enabled                 = true
  url                     = "${render_web_service.ivo_api.url}/metrics"
  scrape_interval_seconds = 60

  # On utilise les mêmes identifiants que dans main.py
  authentication_method         = "basic"
  authentication_basic_username = "ivo_metrics_user"
  authentication_basic_password = "ivo_metrics_password_123"
}

# --- 5. Grafana Cloud : Tableau de bord ---
resource "grafana_dashboard" "ivo_dashboard" {
  config_json = jsonencode({
    title = "IVO - Backend Monitoring"
    uid   = "ivo-backend-monitoring"
    panels = [
      {
        title = "Requêtes HTTP par seconde"
        type  = "timeseries"
        gridPos = { h = 8, w = 12, x = 0, y = 0 }
        targets = [
          {
            expr = "rate(http_requests_total[5m])"
            legendFormat = "{{handler}}"
          }
        ]
      }
    ]
  })
}

# --- Outputs ---
output "frontend_url" {
  value = render_static_site.ivo_frontend.url
}

output "backend_url" {
  value = render_web_service.ivo_api.url
}