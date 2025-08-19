# =============================================
# LFA LEGACY GO - TERRAFORM OUTPUTS
# =============================================

# =============================================
# APPLICATION URLS
# =============================================

output "backend_url" {
  description = "URL of the backend Cloud Run service"
  value       = google_cloud_run_service.backend.status[0].url
}

output "backend_service_name" {
  description = "Name of the backend Cloud Run service"
  value       = google_cloud_run_service.backend.name
}

# =============================================
# DATABASE INFORMATION
# =============================================

output "database_connection_name" {
  description = "Cloud SQL connection name for applications"
  value       = google_sql_database_instance.main.connection_name
}

output "database_public_ip" {
  description = "Public IP address of the database instance"
  value       = google_sql_database_instance.main.public_ip_address
}

output "database_name" {
  description = "Name of the database"
  value       = google_sql_database.main.name
}

output "database_user" {
  description = "Database username"
  value       = google_sql_user.main.name
  sensitive   = false
}

output "database_url" {
  description = "Complete database URL for application configuration"
  value       = "postgresql://${google_sql_user.main.name}:${random_password.db_password.result}@${google_sql_database_instance.main.public_ip_address}:5432/${google_sql_database.main.name}"
  sensitive   = true
}

# =============================================
# SECRETS AND SECURITY
# =============================================

output "jwt_secret_name" {
  description = "Name of the JWT secret in Secret Manager"
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

output "db_password_secret_name" {
  description = "Name of the database password secret in Secret Manager"
  value       = google_secret_manager_secret.db_password.secret_id
}

# =============================================
# PROJECT INFORMATION
# =============================================

output "project_id" {
  description = "Google Cloud Project ID"
  value       = var.project_id
}

output "project_number" {
  description = "Google Cloud Project Number"
  value       = data.google_project.project.number
}

output "region" {
  description = "Google Cloud region where resources are deployed"
  value       = var.region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

# =============================================
# MONITORING
# =============================================

output "uptime_check_id" {
  description = "ID of the uptime monitoring check"
  value       = google_monitoring_uptime_check_config.backend_health.uptime_check_id
}

output "cloud_build_trigger_id" {
  description = "ID of the Cloud Build trigger"
  value       = google_cloudbuild_trigger.backend_deploy.trigger_id
}

# =============================================
# DEPLOYMENT INFORMATION
# =============================================

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    backend_service = {
      name   = google_cloud_run_service.backend.name
      url    = google_cloud_run_service.backend.status[0].url
      region = google_cloud_run_service.backend.location
    }
    database = {
      instance_name   = google_sql_database_instance.main.name
      database_name   = google_sql_database.main.name
      connection_name = google_sql_database_instance.main.connection_name
      public_ip      = google_sql_database_instance.main.public_ip_address
    }
    monitoring = {
      uptime_check = google_monitoring_uptime_check_config.backend_health.uptime_check_id
    }
    ci_cd = {
      build_trigger = google_cloudbuild_trigger.backend_deploy.name
    }
  }
}

# =============================================
# GITHUB ACTIONS CONFIGURATION
# =============================================

output "github_secrets_required" {
  description = "GitHub secrets required for CI/CD"
  value = {
    GCP_PROJECT_ID = var.project_id
    DATABASE_URL   = "postgresql://${google_sql_user.main.name}:${random_password.db_password.result}@${google_sql_database_instance.main.public_ip_address}:5432/${google_sql_database.main.name}"
    JWT_SECRET_KEY = random_password.jwt_secret.result
  }
  sensitive = true
}

# =============================================
# CONNECTION STRINGS
# =============================================

output "connection_strings" {
  description = "Connection strings for different environments"
  value = {
    backend_health_check = "${google_cloud_run_service.backend.status[0].url}/health"
    database_connection  = "postgresql://${google_sql_user.main.name}:[PASSWORD]@${google_sql_database_instance.main.public_ip_address}:5432/${google_sql_database.main.name}"
  }
  sensitive = false
}

# =============================================
# TERRAFORM STATE INFORMATION
# =============================================

output "terraform_workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "resource_count" {
  description = "Summary of created resources"
  value = {
    cloud_run_services    = 1
    sql_instances        = 1
    sql_databases        = 1
    sql_users           = 1
    secrets             = 2
    uptime_checks       = 1
    build_triggers      = 1
  }
}