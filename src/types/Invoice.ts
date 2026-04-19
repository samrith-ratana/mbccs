export type InvoiceStatus = "draft" | "issued" | "paid" | "void";

export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  subscriberId: string;
  contractId: string;
  items: InvoiceItem[];
  total: number;
  autoInvoice: boolean;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCreateInput {
  subscriberId: string;
  contractId: string;
  items: InvoiceItem[];
  autoInvoice?: boolean;
  status?: InvoiceStatus;
}

export interface InvoiceUpdateInput {
  items?: InvoiceItem[];
  total?: number;
  autoInvoice?: boolean;
  status?: InvoiceStatus;
}
