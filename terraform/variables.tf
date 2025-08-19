# =============================================
# LFA LEGACY GO - TERRAFORM VARIABLES
# =============================================

variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
  default     = "lfa-legacy-go-376491487980"
  
  validation {
    condition     = length(var.project_id) > 0
    error_message = "Project ID must not be empty."
  }
}

variable "region" {
  description = "The Google Cloud region for resources"
  type        = string
  default     = "us-central1"
  
  validation {
    condition = contains([
      "us-central1", "us-east1", "us-east4", "us-west1", "us-west2", "us-west3", "us-west4",
      "europe-west1", "europe-west2", "europe-west3", "europe-west4", "europe-west6",
      "asia-east1", "asia-northeast1", "asia-south1", "asia-southeast1"
    ], var.region)
    error_message = "Region must be a valid Google Cloud region."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
  
  validation {
    condition = contains([
      "dev", "development", 
      "staging", "stage", 
      "prod", "production"
    ], var.environment)
    error_message = "Environment must be one of: dev, development, staging, stage, prod, production."
  }
}

variable "app_name" {
  description = "Application name for resource naming"
  type        = string
  default     = "lfa-legacy-go"
  
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.app_name))
    error_message = "App name must start with a letter, contain only lowercase letters, numbers, and hyphens, and end with a letter or number."
  }
}

variable "database_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
  
  validation {
    condition = contains([
      "db-f1-micro", "db-g1-small", "db-n1-standard-1", "db-n1-standard-2", "db-n1-standard-4"
    ], var.database_tier)
    error_message = "Database tier must be a valid Cloud SQL tier."
  }
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_instances >= 1 && var.max_instances <= 100
    error_message = "Max instances must be between 1 and 100."
  }
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
  
  validation {
    condition     = var.min_instances >= 0 && var.min_instances <= 10
    error_message = "Min instances must be between 0 and 10."
  }
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run service"
  type        = string
  default     = "1Gi"
  
  validation {
    condition = contains([
      "128Mi", "256Mi", "512Mi", "1Gi", "2Gi", "4Gi", "8Gi"
    ], var.memory_limit)
    error_message = "Memory limit must be a valid Cloud Run memory value."
  }
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run service"
  type        = string
  default     = "1000m"
  
  validation {
    condition = contains([
      "1000m", "2000m", "4000m", "8000m"
    ], var.cpu_limit)
    error_message = "CPU limit must be a valid Cloud Run CPU value."
  }
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for database"
  type        = bool
  default     = false  # Set to true for production
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 365
    error_message = "Backup retention days must be between 1 and 365."
  }
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "YOUR-GITHUB-USERNAME"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "lfa-legacy-go"
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "ssl_certificate" {
  description = "SSL certificate for custom domain (optional)"
  type        = string
  default     = ""
}

# =============================================
# LOCAL VARIABLES
# =============================================

locals {
  # Common labels applied to all resources
  common_labels = {
    app         = var.app_name
    environment = var.environment
    managed_by  = "terraform"
    project     = var.project_id
  }
  
  # Resource naming convention
  resource_prefix = "${var.app_name}-${var.environment}"
  
  # Service account email
  service_account_email = "${var.project_id}@appspot.gserviceaccount.com"
  
  # Database configuration
  database_name = replace("${var.app_name}_${var.environment}", "-", "_")
  database_user = replace("${var.app_name}_user", "-", "_")
}