# Terraform configuration for Google Cloud Run deployment
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio Phone Number"
  type        = string
}

variable "supabase_url" {
  description = "Supabase URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase Anon Key"
  type        = string
  sensitive   = true
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "run" {
  service = "run.googleapis.com"
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
}

resource "google_project_service" "secretmanager" {
  service = "secretmanager.googleapis.com"
}

# Create secrets for sensitive data
resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "openai-api-key"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

resource "google_secret_manager_secret" "twilio_auth_token" {
  secret_id = "twilio-auth-token"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_auth_token" {
  secret = google_secret_manager_secret.twilio_auth_token.id
  secret_data = var.twilio_auth_token
}

# Cloud Run service for WebSocket server
resource "google_cloud_run_service" "websocket_server" {
  name     = "ai-voice-caller-websocket"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/websocket-server:latest"
        
        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "PORT"
          value = "8080"
        }

        env {
          name  = "TWILIO_ACCOUNT_SID"
          value = var.twilio_account_sid
        }

        env {
          name  = "TWILIO_PHONE_NUMBER"
          value = var.twilio_phone_number
        }

        env {
          name = "OPENAI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.openai_api_key.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "TWILIO_AUTH_TOKEN"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.twilio_auth_token.secret_id
              key  = "latest"
            }
          }
        }
      }

      container_concurrency = 1000
      timeout_seconds       = 3600
      service_account_name  = google_service_account.run_sa.email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"         = "1"
        "autoscaling.knative.dev/maxScale"         = "100"
        "run.googleapis.com/cpu-throttling"        = "false"
        "run.googleapis.com/session-affinity"      = "true"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Cloud Run service for frontend webapp
resource "google_cloud_run_service" "webapp" {
  name     = "ai-voice-caller-webapp"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/webapp:latest"
        
        ports {
          container_port = 3000
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "NEXT_PUBLIC_WEBSOCKET_URL"
          value = "wss://${google_cloud_run_service.websocket_server.status[0].url}"
        }

        env {
          name  = "NEXT_PUBLIC_SUPABASE_URL"
          value = var.supabase_url
        }

        env {
          name  = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
          value = var.supabase_anon_key
        }
      }

      container_concurrency = 80
      timeout_seconds       = 300
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "50"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Service Account for Cloud Run
resource "google_service_account" "run_sa" {
  account_id   = "cloud-run-sa"
  display_name = "Cloud Run Service Account"
}

# Grant Secret Manager access to service account
resource "google_secret_manager_secret_iam_member" "openai_secret_access" {
  secret_id = google_secret_manager_secret.openai_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "twilio_secret_access" {
  secret_id = google_secret_manager_secret.twilio_auth_token.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

# IAM policy for public access
resource "google_cloud_run_service_iam_member" "websocket_public" {
  service  = google_cloud_run_service.websocket_server.name
  location = google_cloud_run_service.websocket_server.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "webapp_public" {
  service  = google_cloud_run_service.webapp.name
  location = google_cloud_run_service.webapp.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "websocket_url" {
  value = google_cloud_run_service.websocket_server.status[0].url
  description = "URL of the WebSocket server"
}

output "webapp_url" {
  value = google_cloud_run_service.webapp.status[0].url
  description = "URL of the web application"
}

output "twilio_webhook_url" {
  value = "${google_cloud_run_service.websocket_server.status[0].url}/incoming-call"
  description = "URL to configure in Twilio for incoming calls"
}