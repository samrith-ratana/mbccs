import "server-only";

import oracledb from "oracledb";
import { createId } from "@/lib/ids";
import {
  execute,
  fromDbBoolean,
  parseJson,
  query,
  toDbBoolean,
  toJson,
} from "@/lib/db/oracle";
import {
  ENTITY_DEFINITIONS,
  type EntityDefinition,
  type EntityField,
} from "@/lib/fixedDevelopmentConfig";
import { ServiceError } from "@/services/errors";
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from "@/types/Customer";
import type { Service, ServiceCreateInput, ServiceUpdateInput } from "@/types/Service";
import type { Deployment, DeploymentCreateInput, DeploymentUpdateInput } from "@/types/Deployment";
import type { Subscriber, SubscriberCreateInput, SubscriberUpdateInput } from "@/types/Subscriber";
import type { Product, ProductCreateInput, ProductUpdateInput } from "@/types/Product";
import type { CameraStockBatch, CameraStockBatchCreateInput, CameraStockBatchUpdateInput } from "@/types/CameraStockBatch";
import type {
  CameraStock,
  CameraStockCreateInput,
  CameraStockUpdateInput,
} from "@/types/CameraStock";
import type { Contract, ContractCreateInput, ContractUpdateInput } from "@/types/Contract";
import type { Invoice, InvoiceCreateInput, InvoiceUpdateInput } from "@/types/Invoice";
import type { Payment, PaymentCreateInput, PaymentUpdateInput } from "@/types/Payment";
import type { AuthUser, AuthUserCreateInput, AuthUserUpdateInput } from "@/types/AuthUser";
import type { AuthSession, AuthSessionCreateInput, AuthSessionUpdateInput } from "@/types/AuthSession";
import type {
  FailedPayment,
  FailedPaymentCreateInput,
  FailedPaymentUpdateInput,
} from "@/types/FailedPayment";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function now() {
  return new Date().toISOString();
}

function isEmpty(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

class OracleEntityService<
  RecordType extends Record<string, unknown>,
  CreateInput extends Record<string, unknown>,
  UpdateInput extends Record<string, unknown>
> {
  protected definition: EntityDefinition;
  private fieldMap: Map<string, EntityField>;

  constructor(definition: EntityDefinition) {
    this.definition = definition;
    this.fieldMap = new Map(definition.fields.map((field) => [field.key, field]));
  }

  private normalizeFieldValue(field: EntityField, value: unknown) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (field.type === "number") {
      if (value === "") return undefined;
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        throw new ServiceError(`Field ${field.label} must be a number.`, 400, "invalid_number");
      }
      return numeric;
    }

    if (field.type === "boolean") {
      if (typeof value === "string") {
        return value === "true" || value === "1";
      }
      return Boolean(value);
    }

    if (field.type === "json") {
      if (value === "") return undefined;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          throw new ServiceError(`Field ${field.label} must be valid JSON.`, 400, "invalid_json");
        }
      }
      return value;
    }

    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }

  private validate(record: Record<string, unknown>) {
    for (const field of this.definition.fields) {
      if (field.system) continue;
      const value = record[field.key];

      if (field.required && isEmpty(value)) {
        throw new ServiceError(`Field ${field.label} is required.`, 400, "missing_field");
      }

      if (field.type === "email" && !isEmpty(value)) {
        const valueString = String(value);
        if (!EMAIL_REGEX.test(valueString)) {
          throw new ServiceError(`Field ${field.label} must be a valid email.`, 400, "invalid_email");
        }
      }
    }
  }

  private toDbValue(field: EntityField, value: unknown) {
    if (value === undefined) return null;
    if (value === null) return null;

    if (field.type === "boolean") {
      return toDbBoolean(value as boolean);
    }

    if (field.type === "json") {
      return toJson(value);
    }

    return value;
  }

  private fromDbValue(field: EntityField, value: unknown) {
    if (value === null || value === undefined) {
      return field.required ? value : undefined;
    }

    if (field.type === "boolean") {
      return fromDbBoolean(value);
    }

    if (field.type === "json") {
      const fallback = field.defaultValue ?? (Array.isArray(field.defaultValue) ? [] : {});
      return parseJson(value, fallback as Record<string, unknown> | unknown[]);
    }

    return value;
  }

  private buildRecord(input: Record<string, unknown>, existing?: Record<string, unknown>) {
    const record: Record<string, unknown> = existing ? { ...existing } : {};

    for (const field of this.definition.fields) {
      if (field.system) continue;
      if (!(field.key in input)) continue;
      record[field.key] = this.normalizeFieldValue(field, input[field.key]);
    }

    for (const field of this.definition.fields) {
      if (field.defaultValue !== undefined && record[field.key] === undefined) {
        record[field.key] = field.defaultValue;
      }
    }

    return record;
  }

  private async insert(record: Record<string, unknown>) {
    const columns = this.definition.fields
      .filter((field) => field.key !== this.definition.idField || !this.definition.autoId)
      .map((field) => field.key);

    const columnList = columns.join(", ");
    const valuesList = columns.map((column) => `:${column}`).join(", ");

    const binds: oracledb.BindParameters = {};
    for (const column of columns) {
      const field = this.fieldMap.get(column);
      if (!field) continue;
      binds[column] = this.toDbValue(field, record[column]);
    }

    let returningClause = "";
    if (this.definition.autoId) {
      returningClause = ` RETURNING ${this.definition.idField} INTO :${this.definition.idField}`;
      binds[this.definition.idField] = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
    }

    const sql = `INSERT INTO ${this.definition.table} (${columnList}) VALUES (${valuesList})${returningClause}`;
    const result = await execute(sql, binds);

    if (this.definition.autoId && result.outBinds) {
      const out = (result.outBinds as Record<string, unknown>)[this.definition.idField];
      if (Array.isArray(out)) {
        record[this.definition.idField] = out[0];
      } else if (out !== undefined) {
        record[this.definition.idField] = out as number;
      }
    }
  }

  private async updateRecord(record: Record<string, unknown>) {
    const columns = this.definition.fields
      .filter((field) => field.key !== this.definition.idField)
      .map((field) => field.key);

    const setList = columns.map((column) => `${column} = :${column}`).join(", ");
    const sql = `UPDATE ${this.definition.table} SET ${setList} WHERE ${this.definition.idField} = :${this.definition.idField}`;

    const binds: oracledb.BindParameters = {};
    for (const column of columns) {
      const field = this.fieldMap.get(column);
      if (!field) continue;
      binds[column] = this.toDbValue(field, record[column]);
    }

    binds[this.definition.idField] = record[this.definition.idField];

    await execute(sql, binds);
  }

  private rowToRecord(row: Record<string, unknown>) {
    const record: Record<string, unknown> = {};
    for (const field of this.definition.fields) {
      record[field.key] = this.fromDbValue(field, row[field.key]);
    }
    return record as RecordType;
  }

  private selectColumns() {
    return this.definition.fields
      .map((field) => `${field.key} "${field.key}"`)
      .join(", ");
  }

  async list(): Promise<RecordType[]> {
    const orderBy = this.definition.orderBy
      ? ` ORDER BY ${this.definition.orderBy} DESC`
      : "";
    const rows = await query<Record<string, unknown>[]>(
      `SELECT ${this.selectColumns()} FROM ${this.definition.table}${orderBy}`
    );
    return rows.map((row) => this.rowToRecord(row));
  }

  async getById(id: string | number): Promise<RecordType | null> {
    const rows = await query<Record<string, unknown>[]>(
      `SELECT ${this.selectColumns()} FROM ${this.definition.table} WHERE ${this.definition.idField} = :id FETCH FIRST 1 ROWS ONLY`,
      { id }
    );
    return rows[0] ? this.rowToRecord(rows[0]) : null;
  }

  async create(input: CreateInput): Promise<RecordType> {
    const record = this.buildRecord(input);

    if (!this.definition.autoId) {
      if (!this.definition.idPrefix) {
        throw new ServiceError("Missing id prefix for entity.", 500, "missing_id_prefix");
      }
      const periodPrefix = (() => {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear()).slice(-2);
        return `${this.definition.idPrefix}-${month}-${year}-`;
      })();

      const rows = await query<Record<string, unknown>[]>(
        `SELECT ${this.definition.idField} "${this.definition.idField}" FROM ${this.definition.table} WHERE ${this.definition.idField} LIKE :pattern`,
        { pattern: `${periodPrefix}%` }
      );
      const existingIds = rows.map((row) => String(row[this.definition.idField]));
      record[this.definition.idField] = createId(this.definition.idPrefix, existingIds);
    }

    if (this.definition.fields.some((field) => field.key === "createdAt")) {
      record.createdAt = now();
    }

    if (this.definition.fields.some((field) => field.key === "updatedAt")) {
      record.updatedAt = now();
    }

    this.validate(record);

    await this.insert(record);
    return record as RecordType;
  }

  async update(id: string | number, input: UpdateInput): Promise<RecordType | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const record = this.buildRecord(input, existing as Record<string, unknown>);
    record[this.definition.idField] = (existing as Record<string, unknown>)[
      this.definition.idField
    ];

    if (this.definition.fields.some((field) => field.key === "updatedAt")) {
      record.updatedAt = now();
    }

    this.validate(record);

    await this.updateRecord(record);
    return record as RecordType;
  }

  async remove(id: string | number): Promise<RecordType | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    await execute(
      `DELETE FROM ${this.definition.table} WHERE ${this.definition.idField} = :id`,
      { id }
    );

    return existing;
  }
}

export class CustomerService extends OracleEntityService<
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.customers);
  }

  createCustomer(data: CustomerCreateInput) {
    return this.create(data);
  }

  getAllCustomers() {
    return this.list();
  }

  getCustomerById(id: string) {
    return this.getById(id);
  }

  updateCustomer(id: string, data: CustomerUpdateInput) {
    return this.update(id, data);
  }

  deleteCustomer(id: string) {
    return this.remove(id);
  }
}

export class ServiceService extends OracleEntityService<
  Service,
  ServiceCreateInput,
  ServiceUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.services);
  }

  createService(data: ServiceCreateInput) {
    return this.create(data);
  }

  getAllServices() {
    return this.list();
  }

  getServiceById(id: string) {
    return this.getById(id);
  }

  updateService(id: string, data: ServiceUpdateInput) {
    return this.update(id, data);
  }

  deleteService(id: string) {
    return this.remove(id);
  }
}

export class DeploymentService extends OracleEntityService<
  Deployment,
  DeploymentCreateInput,
  DeploymentUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.deployments);
  }

  createDeployment(data: DeploymentCreateInput) {
    return this.create(data);
  }

  getAllDeployments() {
    return this.list();
  }

  getDeploymentById(id: string) {
    return this.getById(id);
  }

  updateDeployment(id: string, data: DeploymentUpdateInput) {
    return this.update(id, data);
  }

  deleteDeployment(id: string) {
    return this.remove(id);
  }
}

export class SubscriberService extends OracleEntityService<
  Subscriber,
  SubscriberCreateInput,
  SubscriberUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.subscribers);
  }

  createSubscriber(data: SubscriberCreateInput) {
    return this.create(data);
  }

  getAllSubscribers() {
    return this.list();
  }

  getSubscriberById(id: string) {
    return this.getById(id);
  }

  updateSubscriber(id: string, data: SubscriberUpdateInput) {
    return this.update(id, data);
  }

  deleteSubscriber(id: string) {
    return this.remove(id);
  }
}

export class ProductService extends OracleEntityService<
  Product,
  ProductCreateInput,
  ProductUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.products);
  }

  createProduct(data: ProductCreateInput) {
    return this.create(data);
  }

  getAllProducts() {
    return this.list();
  }

  getProductById(id: string) {
    return this.getById(id);
  }

  updateProduct(id: string, data: ProductUpdateInput) {
    return this.update(id, data);
  }

  deleteProduct(id: string) {
    return this.remove(id);
  }
}

export class CameraStockService extends OracleEntityService<
  CameraStock,
  CameraStockCreateInput,
  CameraStockUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.camera_stock);
  }

  createCameraStock(data: CameraStockCreateInput) {
    return this.create(data);
  }

  getAllCameraStock() {
    return this.list();
  }

  getCameraStockById(id: number) {
    return this.getById(id);
  }

  updateCameraStock(id: number, data: CameraStockUpdateInput) {
    return this.update(id, data);
  }

  deleteCameraStock(id: number) {
    return this.remove(id);
  }

}

export class CameraStockBatchService extends OracleEntityService<
  CameraStockBatch,
  CameraStockBatchCreateInput,
  CameraStockBatchUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.camera_stock_batches);
  }

  createCameraStockBatch(data: CameraStockBatchCreateInput) {
    return this.create(data);
  }

  getAllCameraStockBatches() {
    return this.list();
  }

  getCameraStockBatchById(id: number) {
    return this.getById(id);
  }

  updateCameraStockBatch(id: number, data: CameraStockBatchUpdateInput) {
    return this.update(id, data);
  }

  deleteCameraStockBatch(id: number) {
    return this.remove(id);
  }
}

export class ContractService extends OracleEntityService<
  Contract,
  ContractCreateInput,
  ContractUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.contracts);
  }

  createContract(data: ContractCreateInput) {
    return this.create(data);
  }

  getAllContracts() {
    return this.list();
  }

  getContractById(id: string) {
    return this.getById(id);
  }

  updateContract(id: string, data: ContractUpdateInput) {
    return this.update(id, data);
  }

  deleteContract(id: string) {
    return this.remove(id);
  }
}

export class InvoiceService extends OracleEntityService<
  Invoice,
  InvoiceCreateInput,
  InvoiceUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.invoices);
  }

  createInvoice(data: InvoiceCreateInput) {
    return this.create(data);
  }

  getAllInvoices() {
    return this.list();
  }

  getInvoiceById(id: string) {
    return this.getById(id);
  }

  updateInvoice(id: string, data: InvoiceUpdateInput) {
    return this.update(id, data);
  }

  deleteInvoice(id: string) {
    return this.remove(id);
  }
}

export class PaymentService extends OracleEntityService<
  Payment,
  PaymentCreateInput,
  PaymentUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.payments);
  }

  createPayment(data: PaymentCreateInput) {
    return this.create(data);
  }

  getAllPayments() {
    return this.list();
  }

  getPaymentById(id: string) {
    return this.getById(id);
  }

  updatePayment(id: string, data: PaymentUpdateInput) {
    return this.update(id, data);
  }

  deletePayment(id: string) {
    return this.remove(id);
  }
}

export class AuthUserService extends OracleEntityService<
  AuthUser,
  AuthUserCreateInput,
  AuthUserUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.auth_users);
  }

  createAuthUser(data: AuthUserCreateInput) {
    return this.create(data);
  }

  getAllAuthUsers() {
    return this.list();
  }

  getAuthUserById(id: string) {
    return this.getById(id);
  }

  updateAuthUser(id: string, data: AuthUserUpdateInput) {
    return this.update(id, data);
  }

  deleteAuthUser(id: string) {
    return this.remove(id);
  }
}

export class AuthSessionService extends OracleEntityService<
  AuthSession,
  AuthSessionCreateInput,
  AuthSessionUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.auth_sessions);
  }

  createAuthSession(data: AuthSessionCreateInput) {
    return this.create(data);
  }

  getAllAuthSessions() {
    return this.list();
  }

  getAuthSessionById(id: string) {
    return this.getById(id);
  }

  updateAuthSession(id: string, data: AuthSessionUpdateInput) {
    return this.update(id, data);
  }

  deleteAuthSession(id: string) {
    return this.remove(id);
  }
}

export class FailedPaymentService extends OracleEntityService<
  FailedPayment,
  FailedPaymentCreateInput,
  FailedPaymentUpdateInput
> {
  constructor() {
    super(ENTITY_DEFINITIONS.failed_payments);
  }

  createFailedPayment(data: FailedPaymentCreateInput) {
    return this.create(data);
  }

  getAllFailedPayments() {
    return this.list();
  }

  getFailedPaymentById(id: string) {
    return this.getById(id);
  }

  updateFailedPayment(id: string, data: FailedPaymentUpdateInput) {
    return this.update(id, data);
  }

  deleteFailedPayment(id: string) {
    return this.remove(id);
  }
}

export const customerService = new CustomerService();
export const serviceService = new ServiceService();
export const deploymentService = new DeploymentService();
export const subscriberService = new SubscriberService();
export const productService = new ProductService();
export const cameraStockService = new CameraStockService();
export const cameraStockBatchService = new CameraStockBatchService();
export const contractService = new ContractService();
export const invoiceService = new InvoiceService();
export const paymentService = new PaymentService();
export const authUserService = new AuthUserService();
export const authSessionService = new AuthSessionService();
export const failedPaymentService = new FailedPaymentService();

export const ENTITY_SERVICES = {
  customers: customerService,
  services: serviceService,
  deployments: deploymentService,
  subscribers: subscriberService,
  products: productService,
  camera_stock: cameraStockService,
  contracts: contractService,
  invoices: invoiceService,
  payments: paymentService,
  auth_users: authUserService,
  auth_sessions: authSessionService,
  failed_payments: failedPaymentService,
};

export type EntityKey = keyof typeof ENTITY_SERVICES;
