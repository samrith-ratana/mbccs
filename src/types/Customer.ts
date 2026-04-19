export type CustomerSegment = "enterprise" | "midmarket" | "smb";
export type CustomerStatus = "active" | "prospect" | "paused";

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  owner: string;
  region: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateInput {
  name: string;
  company: string;
  email: string;
  phone?: string;
  segment: CustomerSegment;
  status?: CustomerStatus;
  owner: string;
  region: string;
  address?: string;
  notes?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  segment?: CustomerSegment;
  status?: CustomerStatus;
  owner?: string;
  region?: string;
  address?: string;
  notes?: string;
}
