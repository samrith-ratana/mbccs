export type CameraStockStatus = "available" | "reserved" | "assigned" | "maintenance";

export interface CameraStock {
  id: number;
  serial: string;
  model: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  status: CameraStockStatus;
  unitPrice: number;
  installationFee: number;
  assignedSubscriberId?: string | null;
  assignedContractId?: string | null;
  assignedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CameraStockCreateInput {
  serial: string;
  model: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  status?: CameraStockStatus;
  unitPrice: number;
  installationFee?: number;
  assignedSubscriberId?: string | null;
  assignedContractId?: string | null;
  assignedAt?: string | null;
  notes?: string | null;
}

export interface CameraStockUpdateInput {
  serial?: string;
  model?: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  status?: CameraStockStatus;
  unitPrice?: number;
  installationFee?: number;
  assignedSubscriberId?: string | null;
  assignedContractId?: string | null;
  assignedAt?: string | null;
  notes?: string | null;
}
