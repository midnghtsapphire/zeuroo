import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint, decimal } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  // Subscription & billing
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro", "enterprise"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trialing", "past_due", "canceled", "unpaid"]).default("active"),
  // Token economy
  tokenBalance: int("tokenBalance").default(500).notNull(), // free tokens on signup
  tokensUsedThisMonth: int("tokensUsedThisMonth").default(0).notNull(),
  monthlyTokenLimit: int("monthlyTokenLimit").default(1000).notNull(),
  // Accessibility preferences
  accessibilityMode: varchar("accessibilityMode", { length: 128 }).default("none"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Projects ────────────────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  budgetLimit: decimal("budgetLimit", { precision: 10, scale: 2 }),
  budgetAlertThreshold: int("budgetAlertThreshold").default(80), // percentage
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── API Keys ────────────────────────────────────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  name: varchar("name", { length: 256 }).notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(), // first 8 chars for display
  rateLimit: int("rateLimit").default(60), // requests per minute
  usageQuota: int("usageQuota"), // monthly token limit, null = unlimited
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Provider Configs ────────────────────────────────────────────────────────
export const providerConfigs = mysqlTable("provider_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["openai", "anthropic", "google", "cohere", "mistral", "openrouter"]).notNull(),
  apiKeyEncrypted: text("apiKeyEncrypted").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(1).notNull(),
  maxBudget: decimal("maxBudget", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProviderConfig = typeof providerConfigs.$inferSelect;

// ─── Usage Logs ──────────────────────────────────────────────────────────────
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  apiKeyId: int("apiKeyId"),
  provider: varchar("provider", { length: 64 }).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  totalTokens: int("totalTokens").default(0).notNull(),
  cost: decimal("cost", { precision: 10, scale: 6 }).notNull(),
  latencyMs: int("latencyMs"),
  statusCode: int("statusCode"),
  routingStrategy: varchar("routingStrategy", { length: 64 }),
  cached: boolean("cached").default(false),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

// ─── Prompts (Version Control) ───────────────────────────────────────────────
export const prompts = mysqlTable("prompts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  name: varchar("name", { length: 256 }).notNull(),
  content: text("content").notNull(),
  version: int("version").default(1).notNull(),
  parentId: int("parentId"), // for version history
  isActive: boolean("isActive").default(true).notNull(),
  avgScore: decimal("avgScore", { precision: 5, scale: 2 }),
  usageCount: int("usageCount").default(0).notNull(),
  tags: text("tags"), // JSON array of tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

// ─── Prompt A/B Tests ────────────────────────────────────────────────────────
export const promptTests = mysqlTable("prompt_tests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  promptAId: int("promptAId").notNull(),
  promptBId: int("promptBId").notNull(),
  status: mysqlEnum("status", ["running", "completed", "paused"]).default("running").notNull(),
  totalRuns: int("totalRuns").default(0).notNull(),
  promptAWins: int("promptAWins").default(0).notNull(),
  promptBWins: int("promptBWins").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type PromptTest = typeof promptTests.$inferSelect;

// ─── Budget Alerts ───────────────────────────────────────────────────────────
export const budgetAlerts = mysqlTable("budget_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  alertType: mysqlEnum("alertType", ["threshold", "limit_reached", "anomaly"]).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BudgetAlert = typeof budgetAlerts.$inferSelect;

// ─── Support Tickets ─────────────────────────────────────────────────────────
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  category: mysqlEnum("category", ["billing", "technical", "account", "refund", "cancellation", "other"]).default("other").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;

// ─── Support Messages ────────────────────────────────────────────────────────
export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  isStaff: boolean("isStaff").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
