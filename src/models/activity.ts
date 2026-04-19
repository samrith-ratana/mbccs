export type ActivityAction =
  | "login"
  | "logout"
  | "failed_login"
  | "create"
  | "update"
  | "delete";

export type ActivityMetadata = Record<string, unknown> | null;

export type ActivityLog = {
  id: number;
  userId: string;
  role: string;
  action: ActivityAction;
  entity: string | null;
  entityId: string | null;
  summary: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata: ActivityMetadata;
};

export type ActivityCreateInput = {
  userId: string;
  role: string;
  action: ActivityAction;
  entity?: string | null;
  entityId?: string | null;
  summary?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
  metadata?: ActivityMetadata;
};
