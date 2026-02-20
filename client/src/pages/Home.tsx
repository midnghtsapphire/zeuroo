import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Zap, Shield, BarChart3, GitBranch, Cpu, Globe,
  ArrowRight, Check, Sparkles, Activity, Lock, Users,
  ChevronRight, Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: plans } = trpc.billing.plans.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-glow to-purple-glow flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Zeuroo</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => setLocation("/dashboard")} className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 hover:opacity-90">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => window.location.href = getLoginUrl()} className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = getLoginUrl()} className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 hover:opacity-90">
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 bg-mesh">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-cyan-glow/10 blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-purple-glow/10 blur-[120px]" />
        </div>
        <div className="container relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-cyan-glow" />
              <span>Intelligent AI Gateway — Save up to 60% on AI costs</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
              <span className="gradient-text">One Gateway.</span><br />
              <span className="text-foreground">Every AI Provider.</span><br />
              <span className="text-muted-foreground text-3xl md:text-5xl lg:text-5xl font-semibold">Optimized for Cost & Performance.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Route AI requests across OpenAI, Anthropic, Google, and more with intelligent cost optimization, real-time analytics, and prompt management — all through a single API.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 hover:opacity-90 h-14 px-8 text-lg glow-cyan">
                Start Free — 500 Tokens <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="h-14 px-8 text-lg glass">
                See Features
              </Button>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3, duration: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
            {[
              { label: "AI Providers", value: "6+", icon: Globe },
              { label: "Avg Cost Savings", value: "60%", icon: BarChart3 },
              { label: "Uptime SLA", value: "99.9%", icon: Shield },
              { label: "Avg Latency", value: "<200ms", icon: Activity },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <stat.icon className="w-5 h-5 text-cyan-glow mx-auto mb-2" />
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Everything You Need</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete AI infrastructure platform built for teams that demand reliability, cost efficiency, and deep insights.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: GitBranch, title: "Intelligent Routing", desc: "Automatically route requests to the best provider based on cost, speed, or quality. Fallback routing on provider outages." },
              { icon: BarChart3, title: "Real-Time Cost Tracking", desc: "Monitor spend by model, project, and time period. Set budget alerts and spending limits to prevent overruns." },
              { icon: Cpu, title: "Token Analytics", desc: "Detailed breakdowns by endpoint, user, and model. Track usage patterns and optimize token consumption." },
              { icon: Sparkles, title: "Prompt Optimization", desc: "A/B test prompts, cache responses, and version control your prompt library. AI-powered prompt improvement suggestions." },
              { icon: Lock, title: "API Key Management", desc: "Create and manage API keys with rate limiting, usage quotas, and team access controls. Full audit trail." },
              { icon: Users, title: "Team Management", desc: "Multi-team workspaces with role-based access control. Share projects, prompts, and analytics across your organization." },
              { icon: Shield, title: "Self-Healing Recovery", desc: "Automatic failover between providers. Request retry with exponential backoff. Zero downtime guarantee." },
              { icon: Activity, title: "Model Benchmarks", desc: "Compare AI models across cost, quality, and speed. Make data-driven decisions about which models to use." },
              { icon: Star, title: "Prompt Marketplace", desc: "Share and discover optimized prompts. Community-driven prompt library with ratings and usage stats." },
            ].map((feature, i) => (
              <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.05, duration: 0.5 }} className="glass-card rounded-2xl p-6 hover:glow-cyan transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-glow/20 flex items-center justify-center mb-4 group-hover:from-cyan-glow/30 group-hover:to-purple-glow/30 transition-all">
                  <feature.icon className="w-6 h-6 text-cyan-glow" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 md:py-32 bg-mesh relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in minutes. No infrastructure changes required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Connect Your Providers", desc: "Add your API keys for OpenAI, Anthropic, Google, and other providers. Zeuroo securely stores and manages them." },
              { step: "02", title: "Configure Routing", desc: "Set your routing strategy — optimize for cost, speed, or quality. Define budgets, rate limits, and fallback rules." },
              { step: "03", title: "Send Requests", desc: "Use our unified API endpoint. Zeuroo handles routing, caching, logging, and cost optimization automatically." },
            ].map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-glow to-purple-glow flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white glow-cyan">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 md:py-32 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Simple, Transparent Pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(plans ?? [
              { id: "free", name: "Free", price: 0, tokens: 500, features: ["500 free tokens", "Basic routing", "1 project", "Community support"] },
              { id: "pro", name: "Pro", price: 49, tokens: 50000, features: ["50,000 tokens/mo", "Smart routing", "Unlimited projects", "Priority support", "A/B testing", "Prompt optimization"] },
              { id: "enterprise", name: "Enterprise", price: 199, tokens: 500000, features: ["500,000 tokens/mo", "Advanced routing", "Unlimited everything", "Dedicated support", "Custom models", "SLA guarantee", "Team management"] },
            ]).map((plan, i) => (
              <motion.div key={plan.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`glass-card rounded-2xl p-8 relative ${i === 1 ? "glow-cyan ring-1 ring-cyan-glow/30" : ""}`}>
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-glow to-purple-glow text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold gradient-text">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-cyan-glow shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  className={`w-full ${i === 1 ? "bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 hover:opacity-90" : "glass"}`}
                  variant={i === 1 ? "default" : "outline"}
                >
                  {plan.price === 0 ? "Start Free" : "Get Started"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-32 bg-mesh relative">
        <div className="container">
          <div className="glass-card rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto glow-purple">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Ready to Optimize Your AI Costs?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of teams saving money and improving performance with intelligent AI routing.
            </p>
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 hover:opacity-90 h-14 px-10 text-lg glow-cyan">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 border-t border-border/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-glow to-purple-glow flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">Zeuroo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by free and open-source AI models via OpenRouter API &copy; {new Date().getFullYear()} Zeuroo by GlowStarLabs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
