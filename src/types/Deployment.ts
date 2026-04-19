export type DeploymentEnvironment = "production" | "staging" | "sandbox";
export type DeploymentStatus = "scheduled" | "in-progress" | "active" | "blocked";

export interface Deployment {
  id: string;
  customerId: string;
  serviceId: string;
  environment: DeploymentEnvironment;
  region: string;
  lead: string;
  accessMethod: string;
  activationDate?: string;
  status: DeploymentStatus;
  checklist?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentCreateInput {
  customerId: string;
  serviceId: string;
  environment: DeploymentEnvironment;
  region: string;
  lead: string;
  accessMethod: string;
  activationDate?: string;
  status?: DeploymentStatus;
  checklist?: string;
}

export interface DeploymentUpdateInput {
  customerId?: string;
  serviceId?: string;
  environment?: DeploymentEnvironment;
  region?: string;
  lead?: string;
  accessMethod?: string;
  activationDate?: string;
  status?: DeploymentStatus;
  checklist?: string;
}
