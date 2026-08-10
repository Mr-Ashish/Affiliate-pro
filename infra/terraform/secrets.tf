resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

locals {
  database_url = format(
    "postgresql://coupon:%s@%s:%s/coupon?sslmode=require&connection_limit=3",
    random_password.db.result,
    aws_db_instance.this.address,
    aws_db_instance.this.port,
  )
}

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${local.name}/DATABASE_URL"
  recovery_window_in_days = var.environment == "prod" ? 7 : 0
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = local.database_url
}

resource "aws_secretsmanager_secret" "auth_secret" {
  name                    = "${local.name}/AUTH_SECRET"
  recovery_window_in_days = var.environment == "prod" ? 7 : 0
}

resource "aws_secretsmanager_secret_version" "auth_secret" {
  secret_id     = aws_secretsmanager_secret.auth_secret.id
  secret_string = random_password.auth_secret.result
}
