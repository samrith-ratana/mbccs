export type ProductBillingCycle = "monthly" | "annual" | "prepaid";

export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  billingCycle: ProductBillingCycle;
  prepaidMonths?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  unitPrice: number;
  billingCycle?: ProductBillingCycle;
  prepaidMonths?: number;
  active?: boolean;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  unitPrice?: number;
  billingCycle?: ProductBillingCycle;
  prepaidMonths?: number;
  active?: boolean;
}
