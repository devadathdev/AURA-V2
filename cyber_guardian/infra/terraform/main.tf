# Cyber Range Infrastructure — Terraform (Phase 1 stub)
#
# This module will provision the isolated cyber range:
# - Private virtual network (10.99.0.0/16)
# - 2-3 target VMs (Ubuntu/Debian)
# - 1 attacker VM (CALDERA)
# - 1 defender VM (Wazuh + Suricata + ELK)
# - Management controller VM
#
# Usage (when implemented):
#   cd cyber_guardian/infra/terraform
#   terraform init
#   terraform plan -var-file=../../config/cyber-guardian/default-environment.json
#   terraform apply

terraform {
  required_version = ">= 1.5"
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "~> 0.7"
    }
  }
}

variable "range_name" {
  description = "Name of the cyber range environment"
  type        = string
  default     = "aura-mvp-range"
}

variable "network_cidr" {
  description = "CIDR for the isolated target network"
  type        = string
  default     = "10.99.0.0/24"
}

variable "target_count" {
  description = "Number of target VMs to provision"
  type        = number
  default     = 2
}

# Phase 1: Network and VM resources will be defined here
# output "environment_id" { value = ... }
# output "target_ips" { value = ... }
