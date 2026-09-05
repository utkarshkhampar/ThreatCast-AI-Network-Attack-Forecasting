# ThreatCast — Multi-Cloud Reference Architecture (IaC)

## 1. Cloud-Native Reference Topology (AWS / Azure / GCP)
ThreatCast is built on cloud-agnostic container primitives, enabling native deployment across AWS (EKS), Azure (AKS), and Google Cloud (GKE).

```
+-------------------------------------------------------------------+
|                        AWS PRODUCTION VPC                         |
|                                                                   |
| [Public Subnets - 2 AZs]                                          |
|  └─ Internet-Facing Application Load Balancer (ALB)               |
|                                                                   |
| [Private Application Subnets - 2 AZs]                             |
|  ├─ AWS EKS Managed Node Groups (ThreatCast Microservices)        |
|  └─ NAT Gateways                                                  |
|                                                                   |
| [Private Data Subnets - 2 AZs]                                    |
|  ├─ Amazon RDS PostgreSQL (Multi-AZ with Read Replica)            |
|  ├─ Amazon ElastiCache for Redis (Cluster Mode Enabled)          |
|  ├─ Amazon MSK (Managed Streaming for Apache Kafka)               |
|  └─ Amazon S3 (Encrypted with KMS, Object Lock WORM enabled)      |
+-------------------------------------------------------------------+
```

---

## 2. Infrastructure as Code (Terraform)
The `terraform/aws/` module provisions all foundational networking and managed services:
- **VPC Module**: Creates 10.100.0.0/16 VPC with isolated 3-tier subnets across 3 Availability Zones.
- **EKS Module**: Sets up Kubernetes 1.30 cluster with AWS VPC CNI for native pod IP routing.
- **KMS Keys**: Provisions customer-managed keys (CMK) with automated 90-day rotation for database and evidence encryption.
- **S3 Bucket with Object Lock**: Configures strict WORM (Write Once, Read Many) retention for compliance evidence audit archives.
