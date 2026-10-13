output "ecr_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "Put this in .env.aws as ECR_REPOSITORY"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "ecs_migrate_task_family" {
  value = aws_ecs_task_definition.migrate.family
}

output "ecs_public_subnet_ids" {
  value = join(",", aws_subnet.public[*].id)
}

output "ecs_web_security_group_id" {
  value = aws_security_group.web.id
}

output "ecs_service_name" {
  value       = var.enable_web_service ? aws_ecs_service.web[0].name : null
  description = "Null until enable_web_service=true"
}

output "alb_dns_name" {
  value = aws_lb.web.dns_name
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.web.domain_name
  description = "Public HTTPS URL: https://<this>"
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "database_secret_id" {
  value = aws_secretsmanager_secret.database_url.id
}

output "auth_secret_id" {
  value = aws_secretsmanager_secret.auth_secret.id
}

output "rds_address" {
  value     = aws_db_instance.this.address
  sensitive = true
}

output "env_aws_snippet" {
  description = "Paste into .env.aws after apply"
  value       = <<-EOT
    AWS_REGION=${var.aws_region}
    AWS_PROFILE=${var.aws_profile}
    DOCKER_PLATFORM=linux/amd64
    ECR_REPOSITORY=${aws_ecr_repository.app.repository_url}
    STAGING_URL=https://${aws_cloudfront_distribution.web.domain_name}
    STAGING_DATABASE_SECRET_ID=${aws_secretsmanager_secret.database_url.id}
    WEB_COMPUTE=ecs
    ECS_CLUSTER=${aws_ecs_cluster.this.name}
    ECS_SERVICE_STAGING=${local.name}-web
    ECS_MIGRATE_TASK_FAMILY=${aws_ecs_task_definition.migrate.family}
    ECS_SUBNETS=${join(",", aws_subnet.public[*].id)}
    ECS_WEB_SG=${aws_security_group.web.id}
  EOT
}
