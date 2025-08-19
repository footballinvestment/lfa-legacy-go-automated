# =============================================
# LFA LEGACY GO - TERRAFORM INFRASTRUCTURE
# Google Cloud Platform resources
# =============================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  
  # Uncomment and configure for remote state
  # backend "gcs" {
  #   bucket = "lfa-legacy-go-terraform-state"
  #   prefix = "terraform/state"
  # }
}

# =============================================
# VARIABLES
# =============================================

variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
  default     = "lfa-legacy-go-376491487980"
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "lfa-legacy-go"
}

# =============================================
# PROVIDERS
# =============================================

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# =============================================
# DATA SOURCES
# =============================================

data "google_project" "project" {
  project_id = var.project_id
}

# =============================================
# GOOGLE CLOUD SERVICES
# =============================================

resource "google_project_service" "required_services" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "sqladmin.googleapis.com"
  ])
  
  service = each.key
  
  disable_dependent_services = false
  disable_on_destroy        = false
}

# =============================================
# CLOUD RUN SERVICE
# =============================================

resource "google_cloud_run_service" "backend" {
  name     = "${var.app_name}-backend"
  location = var.region
  
  depends_on = [google_project_service.required_services]
  
  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
        "run.googleapis.com/cpu-throttling" = "false"
        "run.googleapis.com/execution-environment" = "gen2"
      }
      
      labels = {
        app         = var.app_name
        environment = var.environment
        component   = "backend"
        version     = "1.0.0"
      }
    }
    
    spec {
      container_concurrency = 100
      timeout_seconds      = 300
      
      containers {
        image = "gcr.io/${var.project_id}/${var.app_name}-backend:latest"
        
        ports {
          container_port = 8080
        }
        
        env {
          name  = "DATABASE_URL"
          value = google_sql_database_instance.main.connection_name
        }
        
        env {
          name = "JWT_SECRET_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.jwt_secret.secret
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
        }
        
        liveness_probe {
          http_get {
            path = "/health"
            port = 8080
          }
          initial_delay_seconds = 30
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 3
        }
        
        startup_probe {
          http_get {
            path = "/health"
            port = 8080
          }
          initial_delay_seconds = 10
          period_seconds        = 5
          timeout_seconds       = 3
          failure_threshold     = 30
        }
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
}

# =============================================
# IAM POLICY FOR CLOUD RUN
# =============================================

resource "google_cloud_run_service_iam_policy" "backend_public" {
  location = google_cloud_run_service.backend.location
  project  = google_cloud_run_service.backend.project
  service  = google_cloud_run_service.backend.name
  
  policy_data = data.google_iam_policy.public.policy_data
}

data "google_iam_policy" "public" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

# =============================================
# CLOUD SQL INSTANCE
# =============================================

resource "google_sql_database_instance" "main" {
  name             = "${var.app_name}-db-${var.environment}"
  database_version = "POSTGRES_15"
  region          = var.region
  
  depends_on = [google_project_service.required_services]
  
  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 20
    disk_autoresize   = true
    
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }
    
    ip_configuration {
      ipv4_enabled    = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
    
    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM
      update_track = "stable"
    }
  }
  
  deletion_protection = false  # Set to true for production
}

resource "google_sql_database" "main" {
  name     = "${var.app_name}_${var.environment}"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = "${var.app_name}_user"
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# =============================================
# SECRET MANAGER
# =============================================

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.app_name}-jwt-secret"
  
  replication {
    automatic = true
  }
  
  depends_on = [google_project_service.required_services]
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.app_name}-db-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# =============================================
# MONITORING & ALERTING
# =============================================

resource "google_monitoring_uptime_check_config" "backend_health" {
  display_name = "${var.app_name} Backend Health Check"
  timeout      = "10s"
  period       = "300s"
  
  http_check {
    path           = "/health"
    port           = "443"
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
  }
  
  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = google_cloud_run_service.backend.status[0].url
    }
  }
}

# =============================================
# CLOUD BUILD TRIGGER
# =============================================

resource "google_cloudbuild_trigger" "backend_deploy" {
  name        = "${var.app_name}-backend-deploy"
  description = "Trigger for backend deployment"
  
  depends_on = [google_project_service.required_services]
  
  github {
    owner = "YOUR-GITHUB-USERNAME"  # Update this
    name  = "lfa-legacy-go"
    
    push {
      branch = "^main$"
    }
  }
  
  filename = "cloudbuild.yaml"
  
  substitutions = {
    _DATABASE_URL    = "postgresql://${google_sql_user.main.name}:${random_password.db_password.result}@${google_sql_database_instance.main.connection_name}/${google_sql_database.main.name}"
    _JWT_SECRET_KEY = random_password.jwt_secret.result
  }
}

# =============================================
# OUTPUTS
# =============================================

output "backend_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_service.backend.status[0].url
}

output "database_connection_name" {
  description = "Database connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "database_url" {
  description = "Database URL for applications"
  value       = "postgresql://${google_sql_user.main.name}:${random_password.db_password.result}@${google_sql_database_instance.main.public_ip_address}:5432/${google_sql_database.main.name}"
  sensitive   = true
}

output "project_id" {
  description = "Google Cloud Project ID"
  value       = var.project_id
}

output "region" {
  description = "Google Cloud region"
  value       = var.region
}

# =============================================
# TERRAFORM CONFIGURATION SUMMARY
# =============================================
# This Terraform configuration creates:
# ✅ Google Cloud Run service for backend
# ✅ Cloud SQL PostgreSQL database
# ✅ Secret Manager for sensitive data
# ✅ Monitoring and health checks
# ✅ Cloud Build trigger for CI/CD
# ✅ Proper IAM permissions
# ✅ SSL/TLS configuration
# ✅ Backup and maintenance settings
# =============================================