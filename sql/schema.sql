-- ---------------------------
-- Reset Existing Schema (Safe Drop)
-- ---------------------------
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE auth_sessions CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE auth_users CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE failed_payments CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE staff_activity_log CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE payments CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE invoices CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE contracts CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE products CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE subscribers CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE deployments CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE services CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE customers CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE camera_stock CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/


BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE camera_stock_batches CASCADE CONSTRAINTS PURGE';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN
      RAISE;
    END IF;
END;
/

-- ---------------------------
-- Customers
-- ---------------------------
CREATE TABLE customers (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  name VARCHAR2(255 CHAR) NOT NULL,
  company VARCHAR2(255 CHAR) NOT NULL,
  email VARCHAR2(255 CHAR) NOT NULL,
  phone VARCHAR2(50 CHAR),
  segment VARCHAR2(50 CHAR) NOT NULL,
  status VARCHAR2(50 CHAR) NOT NULL,
  owner VARCHAR2(100 CHAR) NOT NULL,
  region VARCHAR2(100 CHAR) NOT NULL,
  address VARCHAR2(255 CHAR),
  notes CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_customers_email ON customers(email);

-- ---------------------------
-- Services
-- ---------------------------
CREATE TABLE services (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  name VARCHAR2(255 CHAR) NOT NULL,
  category VARCHAR2(50 CHAR) NOT NULL,
  tier VARCHAR2(100 CHAR) NOT NULL,
  sla VARCHAR2(100 CHAR) NOT NULL,
  monthlyFee NUMBER(12,2) NOT NULL,
  billingModel VARCHAR2(50 CHAR),
  supportTier VARCHAR2(50 CHAR),
  backupRegion VARCHAR2(50 CHAR),
  overageFee NUMBER(12,2),
  startDate VARCHAR2(30 CHAR),
  renewalDate VARCHAR2(30 CHAR),
  status VARCHAR2(50 CHAR) NOT NULL,
  securityNotes CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

-- ---------------------------
-- Deployments
-- ---------------------------
CREATE TABLE deployments (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  customerId VARCHAR2(64 CHAR) NOT NULL,
  serviceId VARCHAR2(64 CHAR) NOT NULL,
  environment VARCHAR2(50 CHAR) NOT NULL,
  region VARCHAR2(100 CHAR) NOT NULL,
  lead VARCHAR2(100 CHAR) NOT NULL,
  accessMethod VARCHAR2(100 CHAR) NOT NULL,
  activationDate VARCHAR2(30 CHAR),
  status VARCHAR2(50 CHAR) NOT NULL,
  checklist CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_deployments_customer ON deployments(customerId);
CREATE INDEX idx_deployments_service ON deployments(serviceId);

-- ---------------------------
-- Subscribers
-- ---------------------------
CREATE TABLE subscribers (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  fullName VARCHAR2(255 CHAR) NOT NULL,
  email VARCHAR2(255 CHAR) NOT NULL,
  phone VARCHAR2(50 CHAR),
  address VARCHAR2(255 CHAR),
  status VARCHAR2(50 CHAR) NOT NULL,
  profile CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_subscribers_email ON subscribers(email);

-- ---------------------------
-- Products
-- ---------------------------
CREATE TABLE products (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  name VARCHAR2(255 CHAR) NOT NULL,
  description CLOB NOT NULL,
  unitPrice NUMBER(12,2) NOT NULL,
  billingCycle VARCHAR2(50 CHAR) NOT NULL,
  prepaidMonths NUMBER,
  active NUMBER(1) NOT NULL,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

-- ---------------------------
-- Camera Stock
-- ---------------------------
CREATE TABLE camera_stock (
  id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  serial VARCHAR2(100 CHAR) NOT NULL,
  model VARCHAR2(100 CHAR) NOT NULL,
  provinceCode VARCHAR2(10 CHAR),
  teamCode VARCHAR2(20 CHAR),
  status VARCHAR2(30 CHAR) NOT NULL,
  unitPrice NUMBER(12,2) NOT NULL,
  installationFee NUMBER(12,2),
  assignedSubscriberId VARCHAR2(64 CHAR),
  assignedContractId VARCHAR2(64 CHAR),
  assignedAt VARCHAR2(30 CHAR),
  notes CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE UNIQUE INDEX idx_camera_stock_serial ON camera_stock(serial);
CREATE INDEX idx_camera_stock_status ON camera_stock(status);
CREATE INDEX idx_camera_stock_province ON camera_stock(provinceCode);
CREATE INDEX idx_camera_stock_team ON camera_stock(teamCode);


-- Seed Camera Stock (sample)
INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-PNP-0001',
  'indoor',
  'PNP',
  'TEAMPNP1',
  'available',
  95,
  20,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-PNP-0002',
  'indoor_ry6',
  'PNP',
  'TEAMPNP2',
  'available',
  165,
  35,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-PNP-0003',
  'outdoor',
  'PNP',
  'TEAMPNP3',
  'available',
  130,
  30,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-TAK-0001',
  'outdoor_ry2',
  'TAK',
  'TEAMTAK1',
  'available',
  175,
  45,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-TAK-0002',
  'indoor_ry2',
  'TAK',
  'TEAMTAK3',
  'available',
  140,
  35,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-TAK-0003',
  'bullet_4mp',
  'TAK',
  'TEAMTAK4',
  'available',
  110,
  20,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-SPE-0001',
  'indoor',
  'SPE',
  'TEAMSPE1',
  'available',
  95,
  20,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock (
  serial,
  model,
  provinceCode,
  teamCode,
  status,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'CAM-CHH-0001',
  'ptz_4mp',
  'CHH',
  'TEAMCHH1',
  'available',
  220,
  40,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);


-- ---------------------------
-- Camera Stock Batches
-- ---------------------------
CREATE TABLE camera_stock_batches (
  id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  model VARCHAR2(100 CHAR) NOT NULL,
  provinceCode VARCHAR2(10 CHAR),
  teamCode VARCHAR2(20 CHAR),
  quantityAvailable NUMBER NOT NULL,
  quantityAssigned NUMBER NOT NULL,
  unitPrice NUMBER(12,2) NOT NULL,
  installationFee NUMBER(12,2),
  notes CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_camera_batches_model ON camera_stock_batches(model);
CREATE INDEX idx_camera_batches_province ON camera_stock_batches(provinceCode);
CREATE INDEX idx_camera_batches_team ON camera_stock_batches(teamCode);

-- Seed Camera Stock Batches (quantity-based)
INSERT INTO camera_stock_batches (
  model,
  provinceCode,
  teamCode,
  quantityAvailable,
  quantityAssigned,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'indoor',
  'PNP',
  'TEAMPNP3',
  5,
  0,
  95,
  20,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock_batches (
  model,
  provinceCode,
  teamCode,
  quantityAvailable,
  quantityAssigned,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'outdoor',
  'PNP',
  'TEAMPNP3',
  3,
  0,
  130,
  30,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock_batches (
  model,
  provinceCode,
  teamCode,
  quantityAvailable,
  quantityAssigned,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'indoor_ry6',
  'TAK',
  'TEAMTAK1',
  4,
  0,
  165,
  35,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock_batches (
  model,
  provinceCode,
  teamCode,
  quantityAvailable,
  quantityAssigned,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'outdoor_ry2',
  'SPE',
  'TEAMSPE1',
  6,
  0,
  175,
  45,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);

INSERT INTO camera_stock_batches (
  model,
  provinceCode,
  teamCode,
  quantityAvailable,
  quantityAssigned,
  unitPrice,
  installationFee,
  createdAt,
  updatedAt
) VALUES (
  'ptz_4mp',
  'CHH',
  'TEAMCHH1',
  2,
  0,
  220,
  40,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
);
-- ---------------------------
-- Contracts
-- ---------------------------
CREATE TABLE contracts (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  subscriberId VARCHAR2(64 CHAR) NOT NULL,
  productIds CLOB NOT NULL,
  startDate VARCHAR2(30 CHAR) NOT NULL,
  termMonths NUMBER NOT NULL,
  billingCycle VARCHAR2(50 CHAR) NOT NULL,
  status VARCHAR2(50 CHAR) NOT NULL,
  notes CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_contracts_subscriber ON contracts(subscriberId);

-- ---------------------------
-- Invoices
-- ---------------------------
CREATE TABLE invoices (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  subscriberId VARCHAR2(64 CHAR) NOT NULL,
  contractId VARCHAR2(64 CHAR) NOT NULL,
  items CLOB NOT NULL,
  total NUMBER(12,2) NOT NULL,
  autoInvoice NUMBER(1) NOT NULL,
  status VARCHAR2(50 CHAR) NOT NULL,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_invoices_subscriber ON invoices(subscriberId);
CREATE INDEX idx_invoices_contract ON invoices(contractId);

-- ---------------------------
-- Payments
-- ---------------------------
CREATE TABLE payments (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  subscriberId VARCHAR2(64 CHAR) NOT NULL,
  invoiceId VARCHAR2(64 CHAR) NOT NULL,
  method VARCHAR2(50 CHAR) NOT NULL,
  amount NUMBER(12,2) NOT NULL,
  status VARCHAR2(50 CHAR) NOT NULL,
  traceId VARCHAR2(100 CHAR) NOT NULL,
  qrReference VARCHAR2(100 CHAR),
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_payments_subscriber ON payments(subscriberId);
CREATE INDEX idx_payments_invoice ON payments(invoiceId);

-- ---------------------------
-- Failed Payments
-- ---------------------------
CREATE TABLE failed_payments (
  id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  traceId VARCHAR2(100 CHAR) NOT NULL,
  reason VARCHAR2(255 CHAR) NOT NULL,
  payload CLOB NOT NULL,
  createdAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_failed_payments_trace ON failed_payments(traceId);

-- ---------------------------
-- Staff Activity Log
-- ---------------------------
CREATE TABLE staff_activity_log (
  id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  userId VARCHAR2(64 CHAR) NOT NULL,
  role VARCHAR2(50 CHAR) NOT NULL,
  action VARCHAR2(50 CHAR) NOT NULL,
  entity VARCHAR2(100 CHAR),
  entityId VARCHAR2(100 CHAR),
  summary VARCHAR2(255 CHAR),
  ipAddress VARCHAR2(64 CHAR),
  userAgent VARCHAR2(255 CHAR),
  metadata CLOB,
  createdAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_staff_activity_user ON staff_activity_log(userId);
CREATE INDEX idx_staff_activity_created ON staff_activity_log(createdAt);

-- ---------------------------
-- Auth Users
-- ---------------------------
CREATE TABLE auth_users (
  id VARCHAR2(64 CHAR) PRIMARY KEY,
  email VARCHAR2(255 CHAR) NOT NULL UNIQUE,
  passwordHash CLOB NOT NULL,
  role VARCHAR2(50 CHAR) NOT NULL,
  active NUMBER(1) NOT NULL,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  updatedAt VARCHAR2(30 CHAR) NOT NULL
);

ALTER TABLE auth_users
  ADD CONSTRAINT chk_auth_users_role
  CHECK (role IN ('admin', 'staff'));

ALTER TABLE auth_users
  ADD CONSTRAINT chk_auth_users_active
  CHECK (active IN (0, 1));

-- Default Admin Seed (matches DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD)
INSERT INTO auth_users (id, email, passwordHash, role, active, createdAt, updatedAt)
SELECT
  'usr-' || TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'MM-YY') || '-0001',
  'admin@techsolutions.com',
  'pbkdf2$100000$2xoO7xhl6PVV8Zq/82VHFw==$9prJwLEEmhWTkDafUF3UG5PJRAGHWscy4PKmSUPVPzQ=',
  'admin',
  1,
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
  TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
FROM dual
WHERE NOT EXISTS (
  SELECT 1 FROM auth_users WHERE email = 'admin@techsolutions.com'
);

-- Insert Basic Cloud Storage
INSERT INTO products (id, name, description, unitPrice, billingCycle, prepaidMonths, active, createdAt, updatedAt)
VALUES (
  'prd-03-0001',
  'Basic Cloud Storage',
  '7-day retention, 50GB per camera.',
  3,
  'monthly',
  NULL,
  1,
  '2026-03-17T16:49:14.484Z',
  '2026-03-17T16:49:14.484Z'
);

-- Insert Standard Cloud Storage
INSERT INTO products (id, name, description, unitPrice, billingCycle, prepaidMonths, active, createdAt, updatedAt)
VALUES (
  'prd-03-0002',
  'Standard Cloud Storage',
  '30-day retention, 200GB per camera.',
  9,
  'monthly',
  NULL,
  1,
  '2026-03-17T16:49:14.484Z',
  '2026-03-17T16:49:14.484Z'
);

-- Insert Premium Cloud Storage
INSERT INTO products (id, name, description, unitPrice, billingCycle, prepaidMonths, active, createdAt, updatedAt)
VALUES (
  'prd-03-0003',
  'Premium Cloud Storage',
  '90-day retention, 1TB per camera.',
  20,
  'monthly',
  NULL,
  1,
  '2026-03-17T16:49:14.484Z',
  '2026-03-17T16:49:14.484Z'
);

-- ---------------------------
-- Auth Sessions
-- ---------------------------
CREATE TABLE auth_sessions (
  sessionId VARCHAR2(64 CHAR) PRIMARY KEY,
  userId VARCHAR2(64 CHAR) NOT NULL,
  refreshToken CLOB NOT NULL,
  createdAt VARCHAR2(30 CHAR) NOT NULL,
  expiresAt VARCHAR2(30 CHAR) NOT NULL
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(userId);
CREATE INDEX idx_auth_sessions_refresh ON auth_sessions(refreshToken(128));
