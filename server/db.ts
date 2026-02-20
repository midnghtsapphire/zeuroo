import { eq, desc, and, sql, gte, lte, count, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  projects, InsertProject,
  apiKeys, InsertApiKey,
  providerConfigs,
  usageLogs, InsertUsageLog,
  prompts, InsertPrompt,
  promptTests,
  budgetAlerts,
  supportTickets,
  supportMessages,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  // Auto-admin for angelreporters@gmail.com
  if (user.email === 'angelreporters@gmail.com') { values.role = 'admin'; updateSet.role = 'admin'; }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

export async function updateUserTokens(userId: number, tokensUsed: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    tokenBalance: sql`GREATEST(${users.tokenBalance} - ${tokensUsed}, 0)`,
    tokensUsedThisMonth: sql`${users.tokensUsedThisMonth} + ${tokensUsed}`,
  }).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, tier: "free" | "pro" | "enterprise", stripeCustomerId?: string, stripeSubscriptionId?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { subscriptionTier: tier };
  if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
  if (tier === "pro") { updateData.monthlyTokenLimit = 50000; updateData.tokenBalance = sql`${users.tokenBalance} + 50000`; }
  if (tier === "enterprise") { updateData.monthlyTokenLimit = 500000; updateData.tokenBalance = sql`${users.tokenBalance} + 500000`; }
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

// ─── Projects ────────────────────────────────────────────────────────────────
export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(projects).values(data);
  return result[0]?.insertId;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(eq(projects.id, id));
}

// ─── API Keys ────────────────────────────────────────────────────────────────
export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(apiKeys).values(data);
  return result[0]?.insertId;
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}

export async function deleteApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));
}

// ─── Usage Logs ──────────────────────────────────────────────────────────────
export async function createUsageLog(data: InsertUsageLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(usageLogs).values(data);
  return result[0]?.insertId;
}

export async function getUserUsageLogs(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usageLogs).where(eq(usageLogs.userId, userId)).orderBy(desc(usageLogs.createdAt)).limit(limit);
}

export async function getUsageStats(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [eq(usageLogs.userId, userId)];
  if (startDate) conditions.push(gte(usageLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(usageLogs.createdAt, endDate));

  const result = await db.select({
    totalRequests: count(),
    totalTokens: sum(usageLogs.totalTokens),
    totalCost: sum(usageLogs.cost),
    avgLatency: sql<number>`AVG(${usageLogs.latencyMs})`,
  }).from(usageLogs).where(and(...conditions));

  return result[0];
}

export async function getUsageByModel(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    model: usageLogs.model,
    provider: usageLogs.provider,
    totalRequests: count(),
    totalTokens: sum(usageLogs.totalTokens),
    totalCost: sum(usageLogs.cost),
  }).from(usageLogs).where(eq(usageLogs.userId, userId))
    .groupBy(usageLogs.model, usageLogs.provider);
}

export async function getUsageByDay(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return db.select({
    date: sql<string>`DATE(${usageLogs.createdAt})`,
    totalRequests: count(),
    totalTokens: sum(usageLogs.totalTokens),
    totalCost: sum(usageLogs.cost),
  }).from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, startDate)))
    .groupBy(sql`DATE(${usageLogs.createdAt})`)
    .orderBy(sql`DATE(${usageLogs.createdAt})`);
}

// ─── Prompts ─────────────────────────────────────────────────────────────────
export async function createPrompt(data: InsertPrompt) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(prompts).values(data);
  return result[0]?.insertId;
}

export async function getUserPrompts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prompts).where(and(eq(prompts.userId, userId), eq(prompts.isActive, true))).orderBy(desc(prompts.updatedAt));
}

export async function updatePrompt(id: number, data: Partial<InsertPrompt>) {
  const db = await getDb();
  if (!db) return;
  await db.update(prompts).set(data).where(eq(prompts.id, id));
}

export async function deletePrompt(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(prompts).set({ isActive: false }).where(eq(prompts.id, id));
}

// ─── Support Tickets ─────────────────────────────────────────────────────────
export async function createSupportTicket(data: { userId: number; subject: string; description: string; category?: string; priority?: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(supportTickets).values(data as any);
  return result[0]?.insertId;
}

export async function getUserTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
}

export async function getAllTickets(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(limit);
}

export async function updateTicketStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === "resolved") updateData.resolvedAt = new Date();
  await db.update(supportTickets).set(updateData).where(eq(supportTickets.id, id));
}

export async function addSupportMessage(data: { ticketId: number; userId: number; message: string; isStaff?: boolean }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(supportMessages).values(data as any);
  return result[0]?.insertId;
}

export async function getTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportMessages).where(eq(supportMessages.ticketId, ticketId)).orderBy(supportMessages.createdAt);
}

// ─── Admin Stats ─────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const [userCount] = await db.select({ count: count() }).from(users);
  const [logCount] = await db.select({ count: count(), totalCost: sum(usageLogs.cost), totalTokens: sum(usageLogs.totalTokens) }).from(usageLogs);
  const [projectCount] = await db.select({ count: count() }).from(projects);
  const [ticketCount] = await db.select({ count: count() }).from(supportTickets);
  return {
    totalUsers: userCount?.count ?? 0,
    totalRequests: logCount?.count ?? 0,
    totalRevenue: logCount?.totalCost ?? "0",
    totalTokens: logCount?.totalTokens ?? "0",
    totalProjects: projectCount?.count ?? 0,
    openTickets: ticketCount?.count ?? 0,
  };
}
