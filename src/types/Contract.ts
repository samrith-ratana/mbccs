export type ContractStatus = "draft" | "active" | "expired";

export interface Contract {
  id: string;
  subscriberId: string;
  productIds: string[];
  startDate: string;
  termMonths: number;
  billingCycle: string;
  status: ContractStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractCreateInput {
  subscriberId: string;
  productIds: string[];
  startDate: string;
  termMonths: number;
  billingCycle: string;
  status?: ContractStatus;
  notes?: string;
}

export interface ContractUpdateInput {
  productIds?: string[];
  startDate?: string;
  termMonths?: number;
  billingCycle?: string;
  status?: ContractStatus;
  notes?: string;
}
