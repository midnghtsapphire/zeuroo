import { useAuth } from "@/_core/hooks/useAuth";
import { useAccessibility, AccessibilityMode } from "@/contexts/AccessibilityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Accessibility, Eye, Leaf, Brain, BookOpen, Moon, User, Shield, Bell } from "lucide-react";

const A11Y_MODES: { id: AccessibilityMode; label: string; desc: string; icon: any; color: string }[] = [
  { id: "none", label: "Standard", desc: "Default experience with all visual effects", icon: Eye, color: "text-foreground" },
  { id: "eco", label: "ECO CODE", desc: "Reduced animations, no blur effects — saves energy and battery", icon: Leaf, color: "text-emerald-400" },
  { id: "neuro", label: "NEURO CODE", desc: "High contrast, increased line spacing, reduced visual noise for neurodivergent users", icon: Brain, color: "text-purple-glow" },
  { id: "dyslexic", label: "DYSLEXIC MODE", desc: "OpenDyslexic font, wider letter/word spacing for easier reading", icon: BookOpen, color: "text-amber-400" },
  { id: "no-blue-light", label: "NO BLUE LIGHT", desc: "Warm filter that removes blue light — easier on eyes at night", icon: Moon, color: "text-orange-400" },
];

export default function Settings() {
  const { user } = useAuth();
  const { mode, setMode, wcagAAA, setWcagAAA } = useAccessibility();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-glow" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your account and accessibility preferences.</p>
      </div>

      {/* Account Info */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-glow" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="outline" className={`text-xs ${user?.role === "admin" ? "text-cyan-glow border-cyan-glow/30" : ""}`}>
              {user?.role ?? "user"}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Login Method</span>
            <span className="text-sm font-medium capitalize">{user?.loginMethod ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* WCAG AAA */}
      <Card className="glass-card border-0 glow-cyan">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-glow/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-glow" />
              </div>
              <div>
                <p className="text-sm font-semibold">WCAG AAA Compliance</p>
                <p className="text-xs text-muted-foreground">Enhanced contrast ratios (7:1) and focus indicators for maximum accessibility</p>
              </div>
            </div>
            <Switch checked={wcagAAA} onCheckedChange={setWcagAAA} />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Modes */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-purple-glow" /> Accessibility Modes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {A11Y_MODES.map((a11y) => (
            <div key={a11y.id} className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${mode === a11y.id ? "glass-strong glow-cyan ring-1 ring-cyan-glow/20" : "glass hover:glass-strong"}`} onClick={() => setMode(a11y.id)}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === a11y.id ? "bg-gradient-to-br from-cyan-glow/30 to-purple-glow/30" : "bg-muted/20"}`}>
                  <a11y.icon className={`w-5 h-5 ${a11y.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{a11y.label}</p>
                  <p className="text-xs text-muted-foreground">{a11y.desc}</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${mode === a11y.id ? "border-cyan-glow bg-cyan-glow" : "border-muted-foreground/30"}`}>
                {mode === a11y.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Budget Alerts", desc: "Get notified when spending approaches budget limits" },
            { label: "Usage Reports", desc: "Weekly summary of token usage and costs" },
            { label: "System Updates", desc: "New features, maintenance windows, and provider changes" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
