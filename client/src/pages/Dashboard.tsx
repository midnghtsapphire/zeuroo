import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  BarChart3, Zap, DollarSign, Clock, ArrowUpRight,
  TrendingUp, Activity, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: overview, isLoading: loadingOverview } = trpc.analytics.overview.useQuery();
  const { data: dailyData, isLoading: loadingDaily } = trpc.analytics.byDay.useQuery({ days: 30 });
  const { data: modelData } = trpc.analytics.byModel.useQuery();

  const tokenUsagePercent = overview
    ? Math.min(100, ((overview.tokensUsedThisMonth / Math.max(overview.monthlyTokenLimit, 1)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "there"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's your AI gateway overview for the last 30 days.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="glass" onClick={() => setLocation("/playground")}>
            <Sparkles className="w-4 h-4 mr-2" /> Playground
          </Button>
          <Button className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0" onClick={() => setLocation("/api-keys")}>
            <Zap className="w-4 h-4 mr-2" /> New API Key
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card border-0">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard icon={BarChart3} label="Total Requests" value={overview?.totalRequests?.toLocaleString() ?? "0"} trend="+12%" color="text-cyan-glow" />
            <StatCard icon={Zap} label="Tokens Used" value={formatNumber(Number(overview?.totalTokens ?? 0))} trend="+8%" color="text-purple-glow" />
            <StatCard icon={DollarSign} label="Total Cost" value={`$${Number(overview?.totalCost ?? 0).toFixed(2)}`} trend="-15%" color="text-emerald-400" />
            <StatCard icon={Clock} label="Avg Latency" value={`${Math.round(overview?.avgLatency ?? 0)}ms`} trend="-5%" color="text-amber-400" />
          </>
        )}
      </div>

      {/* Token Usage */}
      <Card className="glass-card border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Token Usage This Month</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {overview?.tokensUsedThisMonth?.toLocaleString() ?? 0} / {overview?.monthlyTokenLimit?.toLocaleString() ?? 0} tokens
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold gradient-text capitalize">{overview?.subscriptionTier ?? "free"} Plan</span>
              <p className="text-xs text-muted-foreground">{overview?.tokenBalance?.toLocaleString() ?? 0} remaining</p>
            </div>
          </div>
          <Progress value={tokenUsagePercent} className="h-2" />
          {tokenUsagePercent > 80 && (
            <p className="text-xs text-amber-400 mt-2">You're approaching your monthly limit. Consider upgrading your plan.</p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-glow" /> Daily Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDaily ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData ?? []}>
                  <defs>
                    <linearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.82 0.18 195)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.82 0.18 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 280 / 30%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.65 0.02 280)" }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 280)" }} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.03 280 / 90%)", border: "1px solid oklch(0.4 0.06 280 / 30%)", borderRadius: "8px", color: "oklch(0.92 0.01 195)" }} />
                  <Area type="monotone" dataKey="totalRequests" stroke="oklch(0.82 0.18 195)" fill="url(#gradientCyan)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cost by Model */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-glow" /> Cost by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!modelData?.length ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No usage data yet. Send your first request!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 280 / 30%)" />
                  <XAxis dataKey="model" tick={{ fontSize: 10, fill: "oklch(0.65 0.02 280)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 280)" }} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.03 280 / 90%)", border: "1px solid oklch(0.4 0.06 280 / 30%)", borderRadius: "8px", color: "oklch(0.92 0.01 195)" }} />
                  <Bar dataKey="totalCost" fill="oklch(0.65 0.25 290)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string; trend: string; color: string }) {
  const isPositive = trend.startsWith("+") || trend.startsWith("-");
  return (
    <Card className="glass-card border-0 hover:glow-cyan transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-glow/20 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            {trend} <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
