terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = ">= 1.0.0"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

variable "render_api_key" {
  type      = string
  sensitive = true
}

variable "render_owner_id" {
  type = string
}

# 1. Base PostgreSQL Cloud
resource "render_postgres" "ivo_db" {
  name          = "ivo-postgres"
  plan          = "free"
  region        = "frankfurt"
  version       = "15"
  database_name = "ivo_db"
  database_user = "ivo_user"
}

# 2. Backend Python (FastAPI en conteneur Docker)
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

# 3. Frontend React (Static Site)
resource "render_static_site" "ivo_frontend" {
  name          = "ivo-frontend"
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

output "frontend_url" {
  value = render_static_site.ivo_frontend.url
}

output "backend_url" {
  value = render_web_service.ivo_api.url
}