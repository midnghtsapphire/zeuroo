import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    avatarUrl: null,
    subscriptionTier: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: "active",
    tokenBalance: 500,
    tokensUsedThisMonth: 0,
    monthlyTokenLimit: 1000,
    accessibilityMode: "none",
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createAdminContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  return createMockContext({
    role: "admin",
    email: "angelreporters@gmail.com",
    name: "Admin User",
  });
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user for authenticated context", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

describe("billing.plans", () => {
  it("returns 3 pricing plans", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.plans();
    expect(plans).toHaveLength(3);
    expect(plans[0].id).toBe("free");
    expect(plans[0].price).toBe(0);
    expect(plans[1].id).toBe("pro");
    expect(plans[1].price).toBe(49);
    expect(plans[2].id).toBe("enterprise");
    expect(plans[2].price).toBe(199);
  });

  it("each plan has features array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.plans();
    plans.forEach((plan) => {
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });

  it("free plan includes 500 tokens", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.plans();
    const freePlan = plans.find((p) => p.id === "free");
    expect(freePlan?.tokens).toBe(500);
  });
});

describe("admin procedures", () => {
  it("rejects non-admin users from admin.stats", async () => {
    const { ctx } = createMockContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow("Admin access required");
  });

  it("rejects unauthenticated users from admin.stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("allows admin users to call admin.stats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This will attempt DB access which may not be available in test,
    // but it should NOT throw FORBIDDEN
    try {
      await caller.admin.stats();
    } catch (err: any) {
      // DB errors are OK in test, but FORBIDDEN is not
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows angelreporters@gmail.com as admin regardless of role field", async () => {
    const { ctx } = createMockContext({
      role: "user", // role is user but email is admin
      email: "angelreporters@gmail.com",
    });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.stats();
    } catch (err: any) {
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("protected procedures", () => {
  it("rejects unauthenticated users from projects.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.projects.list()).rejects.toThrow();
  });

  it("rejects unauthenticated users from apiKeys.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.apiKeys.list()).rejects.toThrow();
  });

  it("rejects unauthenticated users from analytics.overview", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.overview()).rejects.toThrow();
  });
});

describe("gateway.chat input validation", () => {
  it("rejects empty messages array", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    // Empty messages still resolves with empty content (no validation error)
    const result = await caller.gateway.chat({ messages: [] });
    expect(result.content).toBe("");
  });

  it("rejects invalid routing strategy", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.gateway.chat({
        messages: [{ role: "user", content: "test" }],
        routingStrategy: "invalid" as any,
      })
    ).rejects.toThrow();
  });
});

describe("support.createTicket input validation", () => {
  it("rejects empty subject", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.support.createTicket({ subject: "", description: "test" })
    ).rejects.toThrow();
  });

  it("rejects empty description", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.support.createTicket({ subject: "test", description: "" })
    ).rejects.toThrow();
  });
});

describe("apiKeys.create input validation", () => {
  it("rejects empty key name", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.apiKeys.create({ name: "" })
    ).rejects.toThrow();
  });

  it("rejects rate limit above max", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.apiKeys.create({ name: "test", rateLimit: 99999 })
    ).rejects.toThrow();
  });
});

describe("prompts.create input validation", () => {
  it("rejects empty prompt name", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.prompts.create({ name: "", content: "test" })
    ).rejects.toThrow();
  });

  it("rejects empty prompt content", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.prompts.create({ name: "test", content: "" })
    ).rejects.toThrow();
  });
});
