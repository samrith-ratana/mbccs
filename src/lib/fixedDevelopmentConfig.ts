export type FieldKind =
  | "text"
  | "email"
  | "number"
  | "boolean"
  | "json"
  | "textarea"
  | "date"
  | "select";

export type EntityField = {
  key: string;
  label: string;
  type: FieldKind;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  system?: boolean;
  defaultValue?: unknown;
  showInTable?: boolean;
};

export type EntityDefinition = {
  key:
    | "customers"
    | "services"
    | "deployments"
    | "subscribers"
    | "products"
    | "camera_stock"
    | "camera_stock_batches"
    | "contracts"
    | "invoices"
    | "payments"
    | "auth_users"
    | "auth_sessions"
    | "failed_payments";
  label: string;
  description: string;
  table: string;
  idField: string;
  idPrefix?: string;
  autoId?: boolean;
  fields: EntityField[];
  orderBy?: string;
};

export const ENTITY_DEFINITIONS: Record<EntityDefinition["key"], EntityDefinition> = {
  customers: {
    key: "customers",
    label: "Customers",
    description: "Store customer accounts and ownership details.",
    table: "customers",
    idField: "id",
    idPrefix: "cus",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "company", label: "Company", type: "text", required: true, showInTable: true },
      { key: "email", label: "Email", type: "email", required: true, showInTable: true },
      { key: "phone", label: "Phone", type: "text" },
      {
        key: "segment",
        label: "Segment",
        type: "select",
        required: true,
        options: ["enterprise", "midmarket", "smb"],
        showInTable: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["active", "prospect", "paused"],
        defaultValue: "active",
        showInTable: true,
      },
      { key: "owner", label: "Owner", type: "text", required: true, showInTable: true },
      { key: "region", label: "Region", type: "text", required: true, showInTable: true },
      { key: "address", label: "Address", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  services: {
    key: "services",
    label: "Services",
    description: "Define service packages, SLAs, and billing tiers.",
    table: "services",
    idField: "id",
    idPrefix: "srv",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "category", label: "Category", type: "text", required: true, showInTable: true },
      { key: "tier", label: "Tier", type: "text", required: true, showInTable: true },
      { key: "sla", label: "SLA", type: "text", required: true, showInTable: true },
      {
        key: "monthlyFee",
        label: "Monthly Fee",
        type: "number",
        required: true,
        showInTable: true,
      },
      { key: "billingModel", label: "Billing Model", type: "text" },
      { key: "supportTier", label: "Support Tier", type: "text" },
      { key: "backupRegion", label: "Backup Region", type: "text" },
      { key: "overageFee", label: "Overage Fee", type: "number" },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "renewalDate", label: "Renewal Date", type: "date" },
      {
        key: "status",
        label: "Status",
        type: "text",
        required: true,
        defaultValue: "pending",
        showInTable: true,
      },
      { key: "securityNotes", label: "Security Notes", type: "textarea" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  deployments: {
    key: "deployments",
    label: "Deployments",
    description: "Track rollout progress by customer and service.",
    table: "deployments",
    idField: "id",
    idPrefix: "dep",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "customerId", label: "Customer ID", type: "text", required: true, showInTable: true },
      { key: "serviceId", label: "Service ID", type: "text", required: true, showInTable: true },
      { key: "environment", label: "Environment", type: "text", required: true, showInTable: true },
      { key: "region", label: "Region", type: "text", required: true, showInTable: true },
      { key: "lead", label: "Lead", type: "text", required: true, showInTable: true },
      { key: "accessMethod", label: "Access Method", type: "text", required: true },
      { key: "activationDate", label: "Activation Date", type: "date" },
      { key: "status", label: "Status", type: "text", required: true, defaultValue: "scheduled", showInTable: true },
      { key: "checklist", label: "Checklist", type: "textarea" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  subscribers: {
    key: "subscribers",
    label: "Subscribers",
    description: "Subscriber identities and contact channels.",
    table: "subscribers",
    idField: "id",
    idPrefix: "sub",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "fullName", label: "Full Name", type: "text", required: true, showInTable: true },
      { key: "email", label: "Email", type: "email", required: true, showInTable: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "status", label: "Status", type: "text", required: true, defaultValue: "active", showInTable: true },
      { key: "profile", label: "Profile (JSON)", type: "json", defaultValue: {} },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  products: {
    key: "products",
    label: "Products",
    description: "Billable products and subscription pricing.",
    table: "products",
    idField: "id",
    idPrefix: "prd",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "description", label: "Description", type: "textarea", required: true, showInTable: true },
      { key: "unitPrice", label: "Unit Price", type: "number", required: true, showInTable: true },
      { key: "billingCycle", label: "Billing Cycle", type: "text", required: true, showInTable: true },
      { key: "prepaidMonths", label: "Prepaid Months", type: "number" },
      { key: "active", label: "Active", type: "boolean", required: true, defaultValue: true, showInTable: true },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  camera_stock: {
    key: "camera_stock",
    label: "Camera Stock",
    description: "Camera inventory items available for deployment.",
    table: "camera_stock",
    idField: "id",
    autoId: true,
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "number", system: true, showInTable: true },
      { key: "serial", label: "Serial", type: "text", required: true, showInTable: true },
      { key: "model", label: "Model", type: "text", required: true, showInTable: true },
      {
        key: "provinceCode",
        label: "Province Code",
        type: "text",
        placeholder: "PNP / TAK / SPE / CHH",
        showInTable: true,
      },
      {
        key: "teamCode",
        label: "Team Code",
        type: "text",
        placeholder: "TEAMPNP1",
        showInTable: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        required: true,
        options: ["available", "reserved", "assigned", "maintenance"],
        defaultValue: "available",
        showInTable: true,
      },
      { key: "unitPrice", label: "Unit Price", type: "number", required: true, showInTable: true },
      { key: "installationFee", label: "Installation Fee", type: "number", defaultValue: 0 },
      { key: "assignedSubscriberId", label: "Subscriber ID", type: "text" },
      { key: "assignedContractId", label: "Contract ID", type: "text" },
      { key: "assignedAt", label: "Assigned At", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },

  camera_stock_batches: {
    key: "camera_stock_batches",
    label: "Camera Stock Batches",
    description: "Quantity-based camera stock by model and team.",
    table: "camera_stock_batches",
    idField: "id",
    autoId: true,
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "number", system: true, showInTable: true },
      { key: "model", label: "Model", type: "text", required: true, showInTable: true },
      {
        key: "provinceCode",
        label: "Province Code",
        type: "text",
        placeholder: "PNP / TAK / SPE / CHH",
        showInTable: true,
      },
      {
        key: "teamCode",
        label: "Team Code",
        type: "text",
        placeholder: "TEAMPNP1",
        showInTable: true,
      },
      {
        key: "quantityAvailable",
        label: "Qty Available",
        type: "number",
        required: true,
        showInTable: true,
      },
      {
        key: "quantityAssigned",
        label: "Qty Assigned",
        type: "number",
        required: true,
        defaultValue: 0,
        showInTable: true,
      },
      { key: "unitPrice", label: "Unit Price", type: "number", required: true, showInTable: true },
      { key: "installationFee", label: "Installation Fee", type: "number", defaultValue: 0 },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },

  contracts: {
    key: "contracts",
    label: "Contracts",
    description: "Subscriber contracts and term details.",
    table: "contracts",
    idField: "id",
    idPrefix: "ctr",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "subscriberId", label: "Subscriber ID", type: "text", required: true, showInTable: true },
      { key: "productIds", label: "Product IDs (JSON)", type: "json", required: true, showInTable: true, defaultValue: [] },
      { key: "startDate", label: "Start Date", type: "date", required: true, showInTable: true },
      { key: "termMonths", label: "Term Months", type: "number", required: true, showInTable: true },
      { key: "billingCycle", label: "Billing Cycle", type: "text", required: true },
      { key: "status", label: "Status", type: "text", required: true, defaultValue: "draft", showInTable: true },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  invoices: {
    key: "invoices",
    label: "Invoices",
    description: "Invoice headers and line items.",
    table: "invoices",
    idField: "id",
    idPrefix: "inv",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "subscriberId", label: "Subscriber ID", type: "text", required: true, showInTable: true },
      { key: "contractId", label: "Contract ID", type: "text", required: true, showInTable: true },
      { key: "items", label: "Items (JSON)", type: "json", required: true, showInTable: true, defaultValue: [] },
      { key: "total", label: "Total", type: "number", required: true, showInTable: true },
      { key: "autoInvoice", label: "Auto Invoice", type: "boolean", required: true, defaultValue: false, showInTable: true },
      { key: "status", label: "Status", type: "text", required: true, defaultValue: "draft", showInTable: true },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  payments: {
    key: "payments",
    label: "Payments",
    description: "Payment processing and tracking.",
    table: "payments",
    idField: "id",
    idPrefix: "pay",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "subscriberId", label: "Subscriber ID", type: "text", required: true, showInTable: true },
      { key: "invoiceId", label: "Invoice ID", type: "text", required: true, showInTable: true },
      { key: "method", label: "Method", type: "text", required: true, showInTable: true },
      { key: "amount", label: "Amount", type: "number", required: true, showInTable: true },
      { key: "status", label: "Status", type: "text", required: true, defaultValue: "pending", showInTable: true },
      { key: "traceId", label: "Trace ID", type: "text", required: true, showInTable: true },
      { key: "qrReference", label: "QR Reference", type: "text" },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  auth_users: {
    key: "auth_users",
    label: "Auth Users",
    description: "Authentication accounts and roles.",
    table: "auth_users",
    idField: "id",
    idPrefix: "usr",
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "text", system: true, showInTable: true },
      { key: "email", label: "Email", type: "email", required: true, showInTable: true },
      { key: "passwordHash", label: "Password Hash", type: "textarea", required: true },
      {
        key: "role",
        label: "Role",
        type: "select",
        required: true,
        options: ["admin", "staff"],
        showInTable: true,
      },
      { key: "active", label: "Active", type: "boolean", required: true, defaultValue: true, showInTable: true },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "updatedAt", label: "Updated", type: "date", system: true },
    ],
  },
  auth_sessions: {
    key: "auth_sessions",
    label: "Auth Sessions",
    description: "Refresh tokens and session windows.",
    table: "auth_sessions",
    idField: "sessionId",
    idPrefix: "ses",
    orderBy: "createdAt",
    fields: [
      { key: "sessionId", label: "Session ID", type: "text", system: true, showInTable: true },
      { key: "userId", label: "User ID", type: "text", required: true, showInTable: true },
      { key: "refreshToken", label: "Refresh Token", type: "textarea", required: true },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
      { key: "expiresAt", label: "Expires At", type: "date", required: true, showInTable: true },
    ],
  },
  failed_payments: {
    key: "failed_payments",
    label: "Failed Payments",
    description: "Failure logs from payment processing.",
    table: "failed_payments",
    idField: "id",
    autoId: true,
    orderBy: "createdAt",
    fields: [
      { key: "id", label: "ID", type: "number", system: true, showInTable: true },
      { key: "traceId", label: "Trace ID", type: "text", required: true, showInTable: true },
      { key: "reason", label: "Reason", type: "textarea", required: true, showInTable: true },
      { key: "payload", label: "Payload (JSON)", type: "json", required: true, defaultValue: {} },
      { key: "createdAt", label: "Created", type: "date", system: true, showInTable: true },
    ],
  },
};

export const ENTITY_LIST = Object.values(ENTITY_DEFINITIONS);
