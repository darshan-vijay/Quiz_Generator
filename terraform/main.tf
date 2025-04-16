terraform { 
  cloud { 
    organization = "DCSC-Project" 
    workspaces { 
      name = "quiz-setup" 
    } 
  } 

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  credentials = var.ALT_GOOGLE_CREDENTIALS
  project     = "quizproject-454218"
  region      = "us-east1"
}

resource "google_container_cluster" "primary" {
  name     = "quiz-app-cluster"
  location = "us-east1"

  remove_default_node_pool = true
  initial_node_count       = 1

  node_config {
    machine_type = "e2-medium"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = "us-east1"
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    machine_type = "e2-medium"
  }

  lifecycle {
    prevent_destroy = false
  }
}