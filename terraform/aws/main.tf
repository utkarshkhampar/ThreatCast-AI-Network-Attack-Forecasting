# ThreatCast AWS Production Infrastructure as Code
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# VPC & Security
resource "aws_vpc" "threatcast_vpc" {
  cidr_block           = "10.100.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "threatcast-soc-vpc"
    Project = "ThreatCast"
  }
}

# EKS Cluster for ThreatCast Microservices
resource "aws_eks_cluster" "threatcast_cluster" {
  name     = "threatcast-cluster"
  role_arn = "arn:aws:iam::123456789012:role/ThreatCastEKSClusterRole"
  version  = "1.29"

  vpc_config {
    subnet_ids = ["subnet-0123456789abcdef0", "subnet-0123456789abcdef1"]
  }
}
