export interface CameraStockBatch {
  id: number;
  model: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  quantityAvailable: number;
  quantityAssigned: number;
  unitPrice: number;
  installationFee?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CameraStockBatchCreateInput {
  model: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  quantityAvailable: number;
  quantityAssigned?: number;
  unitPrice: number;
  installationFee?: number | null;
  notes?: string | null;
}

export interface CameraStockBatchUpdateInput {
  model?: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  quantityAvailable?: number;
  quantityAssigned?: number;
  unitPrice?: number;
  installationFee?: number | null;
  notes?: string | null;
}
