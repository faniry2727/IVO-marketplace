terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "1.2.0"
    }
  }
}

provider "render" { api_key = var.render_api_key }

variable "render_api_key" {
  type = string
  sensitive = true
}

# Basede donnée POSTGRESQL
resource "render_postgres" "ivo_db" {
         name = "ivo-postgres"
               plan = "free"
                    region = "frankfurt"
               version = "15"
         database_name = "ivo_db"
database_user = "ivo_user"
}


              # backend
resource "render_web_service" "ivo_api" {
        name = "ivo-backend"
            plan = "standard"
              region = "frankfurt"
                   runtime = "docker"
                repo = "https://github.com/faniry2727/IVO-marketplace"
             branch = "main"
         docker_context   = "./backend"
  dockerfile_path  = "./backend/Dockerfile"


                          # Règle d' auto scalling
 scaling = {
       min_instances = 1
            max_instances = 5
                    target_cpu_percent = 70
            target_memory_percent = 75
              }
env_vars = { DATABASE_URL = render_postgres.ivo_db.connection_info.internal_connection_string }
}


# frontend
resource "render_static_site" "ivo_frontend" {
           name = "ivo-frontend"
                 repo = "https://github.com/faniry2727/IVO-marketplace"
                          branch = "main"
                              build_command = "npm run build"
                          publish_path  = "dist"
                 env_vars = {VITE_API_URL = "${render_web_service.ivo_api.url}/api"}
           routes = [{ type = "rewrite", source = "/*", target = "/index.html" }]}
output "site_url" {value = render_static_site.ivo_frontend.url}