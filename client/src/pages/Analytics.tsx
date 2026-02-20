import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Activity, DollarSign, Zap, Clock } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const COLORS = [
  "oklch(0.82 0.18 195)",
  "oklch(0.65 0.25 290)",
  "oklch(0.78 0.15 160)",
  "oklch(0.70 0.20 320)",
  "oklch(0.60 0.15 50)",
];

export default function Analytics() {
  const { data: overview, isLoading: lo } = trpc.analytics.overview.useQuery();
  const { data: dailyData, isLoading: ld } = trpc.analytics.byDay.useQuery({ days: 30 });
  const { data: modelData } = trpc.analytics.byModel.useQuery();
  const { data: recentLogs } = trpc.analytics.recentLogs.useQuery({ limit: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-glow" /> Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Detailed usage analytics and cost breakdowns.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {lo ? Array.from({ length: 4 }).map((_, i) => <Card key={i} className="glass-card border-0"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>) : (
          <>
            <MiniStat icon={BarChart3} label="Total Requests" value={overview?.totalRequests?.toLocaleString() ?? "0"} color="text-cyan-glow" />
            <MiniStat icon={Zap} label="Total Tokens" value={formatNum(Number(overview?.totalTokens ?? 0))} color="text-purple-glow" />
            <MiniStat icon={DollarSign} label="Total Cost" value={`$${Number(overview?.totalCost ?? 0).toFixed(2)}`} color="text-emerald-400" />
            <MiniStat icon={Clock} label="Avg Latency" value={`${Math.round(overview?.avgLatency ?? 0)}ms`} color="text-amber-400" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-glow" /> Daily Cost Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ld ? <Skeleton className="h-[250px] w-full" /> : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyData ?? []}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 280 / 30%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.65 0.02 280)" }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.65 0.02 280)" }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.03 280 / 90%)", border: "1px solid oklch(0.4 0.06 280 / 30%)", borderRadius: "8px", color: "oklch(0.92 0.01 195)" }} />
                  <Area type="monotone" dataKey="totalCost" stroke="oklch(0.65 0.25 290)" fill="url(#costGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-glow" /> Usage by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!modelData?.length ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart>
                    <Pie data={modelData} dataKey="totalRequests" nameKey="model" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {modelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "oklch(0.16 0.03 280 / 90%)", border: "1px solid oklch(0.4 0.06 280 / 30%)", borderRadius: "8px", color: "oklch(0.92 0.01 195)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {modelData.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate flex-1">{String(m.model)}</span>
                      <span className="text-muted-foreground">{String(m.totalRequests)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentLogs?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No requests yet. Try the Playground!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Model</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Provider</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Tokens</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Cost</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Latency</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/20 hover:bg-accent/20">
                      <td className="py-2 px-2 font-mono">{log.model}</td>
                      <td className="py-2 px-2">{log.provider}</td>
                      <td className="py-2 px-2 text-right">{log.totalTokens.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-emerald-400">${Number(log.cost).toFixed(4)}</td>
                      <td className="py-2 px-2 text-right">{log.latencyMs}ms</td>
                      <td className="py-2 px-2 text-right">
                        <Badge variant="outline" className={`text-[10px] ${log.statusCode === 200 ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}`}>
                          {log.statusCode}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="glass-card border-0">
      <CardContent className="p-4">
        <Icon className={`w-4 h-4 ${color} mb-2`} />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
