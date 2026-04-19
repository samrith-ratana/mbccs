export type SubscriberStatus = "active" | "pending" | "suspended";
export type SubscriberSegment = "enterprise" | "midmarket" | "smb";

export interface SubscriberProfile {
  companyName?: string;
  taxId?: string;
  segment?: SubscriberSegment;
  provinceCode?: string;
  teamCode?: string;
  notes?: string;
}

export interface Subscriber {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  status: SubscriberStatus;
  profile?: SubscriberProfile;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberCreateInput {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  status?: SubscriberStatus;
  profile?: SubscriberProfile;
}

export interface SubscriberUpdateInput {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: SubscriberStatus;
  profile?: SubscriberProfile;
}
