export type ServiceCategory = "security" | "data" | "integration" | "archive";
export type ServiceStatus = "configured" | "pending" | "active";
export type ServiceBillingModel = "per-camera" | "per-site" | "usage-based";
export type ServiceSupportTier = "standard" | "priority" | "enterprise";
export type ServiceBackupRegion = "regional" | "multi-region" | "global";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  tier: string;
  sla: string;
  monthlyFee: number;
  billingModel?: ServiceBillingModel;
  supportTier?: ServiceSupportTier;
  backupRegion?: ServiceBackupRegion;
  overageFee?: number;
  startDate?: string;
  renewalDate?: string;
  status: ServiceStatus;
  securityNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCreateInput {
  name: string;
  category: ServiceCategory;
  tier: string;
  sla: string;
  monthlyFee: number;
  billingModel?: ServiceBillingModel;
  supportTier?: ServiceSupportTier;
  backupRegion?: ServiceBackupRegion;
  overageFee?: number;
  startDate?: string;
  renewalDate?: string;
  status?: ServiceStatus;
  securityNotes?: string;
}

export interface ServiceUpdateInput {
  name?: string;
  category?: ServiceCategory;
  tier?: string;
  sla?: string;
  monthlyFee?: number;
  billingModel?: ServiceBillingModel;
  supportTier?: ServiceSupportTier;
  backupRegion?: ServiceBackupRegion;
  overageFee?: number;
  startDate?: string;
  renewalDate?: string;
  status?: ServiceStatus;
  securityNotes?: string;
}
