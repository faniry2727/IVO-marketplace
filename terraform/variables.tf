variable "render_api_key" {
  type      = string
  sensitive = true
}

variable "render_owner_id" {
  type = string
}

variable "grafana_url" {
  description = "URL de votre stack Grafana Cloud (ex: https://faniry.grafana.net)"
  type        = string
}

variable "grafana_api_key" {
  description = "Clé API Grafana Cloud"
  type        = string
  sensitive   = true
}

variable "grafana_stack_id" {
  description = "ID numérique de votre stack Grafana Cloud"
  type        = string
}
