variable "project" {
  type        = string
  description = "Name prefix for all resources."
  default     = "coupon-hub"
}

variable "environment" {
  type        = string
  description = "staging or prod. Use a separate apply (or workspace) per env."
  default     = "staging"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_profile" {
  type        = string
  description = "Local AWS CLI profile (SSO). Empty = default chain."
  default     = "coupon-hub"
}

variable "az_count" {
  type        = number
  description = "How many AZs (2 is enough for ALB + later Multi-AZ RDS)."
  default     = 2
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_multi_az" {
  type    = bool
  default = false
}

variable "db_deletion_protection" {
  type    = bool
  default = false
}

variable "task_cpu" {
  type        = string
  description = "Fargate CPU units. 256 = 0.25 vCPU."
  default     = "256"
}

variable "task_memory" {
  type        = string
  description = "Fargate memory (MiB). 512 pairs with 256 CPU."
  default     = "512"
}

variable "desired_count" {
  type        = number
  description = "Web tasks. Launch = 1. Prod HA = 2."
  default     = 1
}

variable "container_image_tag" {
  type        = string
  description = "ECR image tag the service pulls (mutable staging/prod tag)."
  default     = "staging"
}

variable "public_base_url" {
  type        = string
  description = "Optional custom public URL (https://staging.example.com). Empty uses the CloudFront URL as AUTH_URL."
  default     = ""
}

variable "operator_cidr" {
  type        = string
  description = "Optional /32 SG hole on RDS. Does not make a private instance reachable from the internet. Leave empty; migrate runs in Fargate."
  default     = ""
}

variable "enable_web_service" {
  type        = bool
  description = "Set false on the first apply so ECR exists before the first image push."
  default     = true
}
