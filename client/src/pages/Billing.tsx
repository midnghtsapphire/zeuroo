import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, Zap, ArrowRight, Star, Shield, Crown } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const { data: currentPlan } = trpc.billing.currentPlan.useQuery();
  const { data: plans } = trpc.billing.plans.useQuery();

  const tokenPercent = currentPlan
    ? Math.min(100, (currentPlan.tokensUsedThisMonth / Math.max(currentPlan.monthlyTokenLimit, 1)) * 100)
    : 0;

  const tierIcons: Record<string, any> = { free: Zap, pro: Star, enterprise: Crown };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-cyan-glow" /> Billing & Plans
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription and token usage.</p>
      </div>

      {/* Current Plan */}
      <Card className="glass-card border-0 glow-cyan">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-glow to-purple-glow flex items-center justify-center">
                {(() => { const Icon = tierIcons[currentPlan?.tier ?? "free"] ?? Zap; return <Icon className="w-6 h-6 text-white" />; })()}
              </div>
              <div>
                <h2 className="text-lg font-bold capitalize">{currentPlan?.tier ?? "Free"} Plan</h2>
                <Badge variant="outline" className={`text-xs ${currentPlan?.subscriptionStatus === "active" ? "text-emerald-400 border-emerald-400/30" : "text-amber-400 border-amber-400/30"}`}>
                  {currentPlan?.subscriptionStatus ?? "active"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Token Usage This Month</span>
              <span className="font-medium">{currentPlan?.tokensUsedThisMonth?.toLocaleString() ?? 0} / {currentPlan?.monthlyTokenLimit?.toLocaleString() ?? 0}</span>
            </div>
            <Progress value={tokenPercent} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Token Balance</span>
              <span className="font-semibold gradient-text">{currentPlan?.tokenBalance?.toLocaleString() ?? 0} tokens</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {(plans ?? []).map((plan, i) => {
            const isCurrent = plan.id === (currentPlan?.tier ?? "free");
            return (
              <Card key={plan.id} className={`glass-card border-0 ${i === 1 ? "glow-cyan ring-1 ring-cyan-glow/30" : ""} ${isCurrent ? "ring-1 ring-emerald-400/30" : ""}`}>
                <CardContent className="p-6">
                  {i === 1 && (
                    <Badge className="mb-3 bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 text-xs">Most Popular</Badge>
                  )}
                  {isCurrent && (
                    <Badge className="mb-3 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">Current Plan</Badge>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-3xl font-extrabold gradient-text">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-cyan-glow shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${isCurrent ? "" : i === 1 ? "bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0" : "glass"}`}
                    variant={isCurrent ? "outline" : i === 1 ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => toast.info("Stripe checkout coming soon. Contact support to upgrade.")}
                  >
                    {isCurrent ? "Current Plan" : plan.price === 0 ? "Downgrade" : "Upgrade"} {!isCurrent && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Token Packs */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-glow" /> Token Packs (Overage)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Need more tokens? Purchase additional packs anytime.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { tokens: 10000, price: 5 },
              { tokens: 50000, price: 20 },
              { tokens: 200000, price: 70 },
              { tokens: 1000000, price: 300 },
            ].map((pack) => (
              <Card key={pack.tokens} className="glass border-0 hover:glow-purple transition-all cursor-pointer" onClick={() => toast.info("Stripe checkout coming soon")}>
                <CardContent className="p-4 text-center">
                  <Zap className="w-5 h-5 text-purple-glow mx-auto mb-2" />
                  <p className="font-bold">{(pack.tokens / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">tokens</p>
                  <p className="text-sm font-semibold gradient-text mt-2">${pack.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center">
        Payment processing provided by Stripe. All prices in USD. Subscriptions auto-renew monthly.
      </p>
    </div>
  );
}
