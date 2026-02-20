import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import crypto from "crypto";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.email !== "angelreporters@gmail.com") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Projects ────────────────────────────────────────────────────────
  projects: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserProjects(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(256),
      description: z.string().optional(),
      budgetLimit: z.string().optional(),
      budgetAlertThreshold: z.number().min(0).max(100).optional(),
    })).mutation(({ ctx, input }) => db.createProject({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      budgetLimit: z.string().optional(),
      budgetAlertThreshold: z.number().min(0).max(100).optional(),
      isActive: z.boolean().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateProject(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteProject(input.id)),
  }),

  // ─── API Keys ────────────────────────────────────────────────────────
  apiKeys: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserApiKeys(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(256),
      projectId: z.number().optional(),
      rateLimit: z.number().min(1).max(10000).optional(),
      usageQuota: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const rawKey = `zk_${crypto.randomBytes(32).toString("hex")}`;
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = rawKey.substring(0, 10);
      await db.createApiKey({
        ...input,
        userId: ctx.user.id,
        keyHash,
        keyPrefix,
      });
      return { key: rawKey, prefix: keyPrefix };
    }),
    revoke: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteApiKey(input.id)),
  }),

  // ─── Gateway (AI Routing) ───────────────────────────────────────────
  gateway: router({
    chat: protectedProcedure.input(z.object({
      messages: z.array(z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      })),
      model: z.string().optional(),
      projectId: z.number().optional(),
      routingStrategy: z.enum(["cost", "speed", "quality", "balanced"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const startTime = Date.now();
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      // Check token balance
      if (user.tokenBalance <= 0 && user.subscriptionTier === "free") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tokens remaining. Please upgrade your plan.",
        });
      }

      try {
        const response = await invokeLLM({ messages: input.messages });
        const latencyMs = Date.now() - startTime;
        const inputTokens = response.usage?.prompt_tokens ?? 0;
        const outputTokens = response.usage?.completion_tokens ?? 0;
        const totalTokens = inputTokens + outputTokens;

        // Estimate cost (simplified)
        const costPerToken = 0.000002;
        const cost = (totalTokens * costPerToken).toFixed(6);

        // Log usage
        await db.createUsageLog({
          userId: ctx.user.id,
          projectId: input.projectId,
          provider: "openrouter",
          model: input.model || "auto",
          inputTokens,
          outputTokens,
          totalTokens,
          cost,
          latencyMs,
          statusCode: 200,
          routingStrategy: input.routingStrategy || "balanced",
          cached: false,
        });

        // Deduct tokens
        await db.updateUserTokens(ctx.user.id, Math.ceil(totalTokens / 10));

        return {
          content: response.choices?.[0]?.message?.content ?? "",
          model: response.model ?? input.model ?? "auto",
          usage: { inputTokens, outputTokens, totalTokens },
          cost: parseFloat(cost),
          latencyMs,
        };
      } catch (error: any) {
        await db.createUsageLog({
          userId: ctx.user.id,
          projectId: input.projectId,
          provider: "openrouter",
          model: input.model || "auto",
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: "0",
          latencyMs: Date.now() - startTime,
          statusCode: 500,
          routingStrategy: input.routingStrategy || "balanced",
          cached: false,
          errorMessage: error.message,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),
  }),

  // ─── Analytics ──────────────────────────────────────────────────────
  analytics: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getUsageStats(ctx.user.id);
      const user = await db.getUserById(ctx.user.id);
      return {
        totalRequests: stats?.totalRequests ?? 0,
        totalTokens: stats?.totalTokens ?? "0",
        totalCost: stats?.totalCost ?? "0",
        avgLatency: stats?.avgLatency ?? 0,
        tokenBalance: user?.tokenBalance ?? 0,
        tokensUsedThisMonth: user?.tokensUsedThisMonth ?? 0,
        monthlyTokenLimit: user?.monthlyTokenLimit ?? 0,
        subscriptionTier: user?.subscriptionTier ?? "free",
      };
    }),
    byModel: protectedProcedure.query(({ ctx }) => db.getUsageByModel(ctx.user.id)),
    byDay: protectedProcedure.input(z.object({ days: z.number().min(1).max(365).optional() }).optional()).query(({ ctx, input }) =>
      db.getUsageByDay(ctx.user.id, input?.days ?? 30)
    ),
    recentLogs: protectedProcedure.input(z.object({ limit: z.number().min(1).max(200).optional() }).optional()).query(({ ctx, input }) =>
      db.getUserUsageLogs(ctx.user.id, input?.limit ?? 50)
    ),
  }),

  // ─── Prompts ────────────────────────────────────────────────────────
  prompts: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserPrompts(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(256),
      content: z.string().min(1),
      projectId: z.number().optional(),
      tags: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createPrompt({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      content: z.string().optional(),
      tags: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updatePrompt(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePrompt(input.id)),
    optimize: protectedProcedure.input(z.object({
      content: z.string().min(1),
      goal: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a prompt engineering expert. Optimize the given prompt for clarity, specificity, and effectiveness. Return the optimized prompt and explain what you changed and why." },
          { role: "user", content: `Optimize this prompt${input.goal ? ` for the goal: ${input.goal}` : ""}:\n\n${input.content}` },
        ],
      });
      return { optimized: response.choices?.[0]?.message?.content ?? "" };
    }),
  }),

  // ─── Support ────────────────────────────────────────────────────────
  support: router({
    tickets: protectedProcedure.query(({ ctx }) => db.getUserTickets(ctx.user.id)),
    createTicket: protectedProcedure.input(z.object({
      subject: z.string().min(1).max(512),
      description: z.string().min(1),
      category: z.enum(["billing", "technical", "account", "refund", "cancellation", "other"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    })).mutation(({ ctx, input }) => db.createSupportTicket({ ...input, userId: ctx.user.id })),
    messages: protectedProcedure.input(z.object({ ticketId: z.number() })).query(({ input }) => db.getTicketMessages(input.ticketId)),
    sendMessage: protectedProcedure.input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
    })).mutation(({ ctx, input }) => db.addSupportMessage({ ...input, userId: ctx.user.id })),
  }),

  // ─── Billing ────────────────────────────────────────────────────────
  billing: router({
    currentPlan: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return {
        tier: user?.subscriptionTier ?? "free",
        tokenBalance: user?.tokenBalance ?? 0,
        tokensUsedThisMonth: user?.tokensUsedThisMonth ?? 0,
        monthlyTokenLimit: user?.monthlyTokenLimit ?? 0,
        stripeCustomerId: user?.stripeCustomerId,
        subscriptionStatus: user?.subscriptionStatus,
      };
    }),
    plans: publicProcedure.query(() => [
      {
        id: "free",
        name: "Free",
        price: 0,
        tokens: 500,
        features: ["500 free tokens", "Basic routing", "1 project", "Community support"],
      },
      {
        id: "pro",
        name: "Pro",
        price: 49,
        tokens: 50000,
        features: ["50,000 tokens/mo", "Smart routing", "Unlimited projects", "Priority support", "A/B testing", "Prompt optimization"],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 199,
        tokens: 500000,
        features: ["500,000 tokens/mo", "Advanced routing", "Unlimited everything", "Dedicated support", "Custom models", "SLA guarantee", "Team management"],
      },
    ]),
  }),

  // ─── Admin ──────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => db.getAdminStats()),
    users: adminProcedure.input(z.object({
      limit: z.number().min(1).max(500).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(({ input }) => db.getAllUsers(input?.limit ?? 100, input?.offset ?? 0)),
    tickets: adminProcedure.query(() => db.getAllTickets()),
    updateTicket: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]),
    })).mutation(({ input }) => db.updateTicketStatus(input.id, input.status)),
    replyTicket: adminProcedure.input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
    })).mutation(({ ctx, input }) => db.addSupportMessage({ ...input, userId: ctx.user.id, isStaff: true })),
    updateUserRole: adminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return;
      const { users: usersTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await dbInstance.update(usersTable).set({ role: input.role }).where(eq(usersTable.id, input.userId));
    }),
  }),
});

export type AppRouter = typeof appRouter;
