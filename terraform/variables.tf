variable "render_api_key" {
  type      = string
  sensitive = true
}

variable "render_owner_id" {
  type = string
}

variable "grafana_url" {
  type = string
}

variable "grafana_api_key" {
  type      = string
  sensitive = true
}

variable "grafana_stack_id" {
  type = string
}

variable "grafana_connections_token" {
  type      = string
  sensitive = true
}