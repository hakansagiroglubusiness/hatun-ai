import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"),
  plan: text("plan").notNull().default("creator"),
  creditBalance: integer("credit_balance").notNull().default(12000),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
]);

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),
  tool: text("tool").notNull(),
  model: text("model").notNull(),
  prompt: text("prompt"),
  status: text("status").notNull().default("queued"),
  provider: text("provider").notNull(),
  providerJobId: text("provider_job_id"),
  assetKey: text("asset_key"),
  thumbnailKey: text("thumbnail_key"),
  errorMessage: text("error_message"),
  creditsCharged: integer("credits_charged").notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: integer("duration_seconds"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("generations_user_created_idx").on(table.userId, table.createdAt),
  index("generations_status_idx").on(table.status),
]);

export const uploads = sqliteTable("uploads", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  purpose: text("purpose").notNull().default("reference"),
  consentConfirmed: integer("consent_confirmed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("uploads_user_created_idx").on(table.userId, table.createdAt),
]);

export const creditLedger = sqliteTable("credit_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(),
  referenceId: text("reference_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("credit_ledger_user_created_idx").on(table.userId, table.createdAt),
]);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull().default("stripe"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("subscriptions_provider_id_unique").on(table.providerSubscriptionId),
  index("subscriptions_user_idx").on(table.userId),
]);

export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  subjectName: text("subject_name").notNull(),
  subjectIsAdult: integer("subject_is_adult", { mode: "boolean" }).notNull(),
  explicitConsent: integer("explicit_consent", { mode: "boolean" }).notNull(),
  evidenceUploadId: text("evidence_upload_id").references(() => uploads.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("consent_records_user_idx").on(table.userId),
]);
