variable "region" {
  type    = string
  default = "us-east-1"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "admin_cidr" {
  type        = string
  description = "Tu dirección IPv4 pública seguida por /32"
  validation {
    condition     = can(cidrnetmask(var.admin_cidr)) && endswith(var.admin_cidr, "/32")
    error_message = "Indica una dirección IPv4 individual con prefijo /32."
  }
}

variable "ssh_public_key" {
  type      = string
  sensitive = true
}

variable "github_repository" {
  type        = string
  default     = ""
  description = "Tu repositorio GitHub en formato propietario/repositorio; vacío deshabilita el despliegue por OIDC."
  validation {
    condition     = var.github_repository == "" || can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Usa propietario/repositorio."
  }
}

variable "github_oidc_provider_arn" {
  type        = string
  default     = ""
  description = "ARN del proveedor OIDC de GitHub si ya existe en tu cuenta AWS."
}
