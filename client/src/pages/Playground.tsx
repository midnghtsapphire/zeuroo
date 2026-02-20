import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Zap, Clock, DollarSign, Copy, Check } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const MODELS = [
  { value: "auto", label: "Auto (Best Value)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gemini-pro", label: "Gemini Pro" },
];

const STRATEGIES = [
  { value: "balanced", label: "Balanced" },
  { value: "cost", label: "Lowest Cost" },
  { value: "speed", label: "Fastest" },
  { value: "quality", label: "Highest Quality" },
];

export default function Playground() {
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("auto");
  const [strategy, setStrategy] = useState<"balanced" | "cost" | "speed" | "quality">("balanced");
  const [response, setResponse] = useState<{ content: any; model: string; usage: any; cost: number; latencyMs: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const chatMutation = trpc.gateway.chat.useMutation({
    onSuccess: (data) => setResponse(data),
    onError: (err) => toast.error(err.message),
  });

  const messages = useMemo(() => {
    const msgs: { role: "system" | "user"; content: string }[] = [];
    if (systemPrompt.trim()) msgs.push({ role: "system", content: systemPrompt });
    if (prompt.trim()) msgs.push({ role: "user", content: prompt });
    return msgs;
  }, [prompt, systemPrompt]);

  const handleSend = () => {
    if (!prompt.trim()) return toast.error("Enter a prompt");
    chatMutation.mutate({ messages, model: model === "auto" ? undefined : model, routingStrategy: strategy });
  };

  const handleCopy = () => {
    if (response?.content) {
      navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-glow" /> AI Playground
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Test AI models through the Zeuroo gateway with real-time cost tracking.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Routing Strategy</label>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as any)}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">System Prompt (optional)</label>
                <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="You are a helpful assistant..." className="glass min-h-[80px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">User Prompt</label>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter your prompt here..." className="glass min-h-[140px] resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(); }} />
              </div>
              <Button onClick={handleSend} disabled={chatMutation.isPending || !prompt.trim()} className="w-full bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0 hover:opacity-90">
                {chatMutation.isPending ? (
                  <><Zap className="w-4 h-4 mr-2 animate-pulse" /> Processing...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Send Request</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Press Ctrl+Enter to send</p>
            </CardContent>
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {response && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="glass text-xs">
                <Zap className="w-3 h-3 mr-1 text-cyan-glow" /> {response.usage?.totalTokens ?? 0} tokens
              </Badge>
              <Badge variant="outline" className="glass text-xs">
                <DollarSign className="w-3 h-3 mr-1 text-emerald-400" /> ${response.cost?.toFixed(6)}
              </Badge>
              <Badge variant="outline" className="glass text-xs">
                <Clock className="w-3 h-3 mr-1 text-amber-400" /> {response.latencyMs}ms
              </Badge>
              <Badge variant="outline" className="glass text-xs">
                Model: {response.model}
              </Badge>
            </div>
          )}
          <Card className="glass-card border-0">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Response</CardTitle>
              {response && (
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {chatMutation.isPending ? (
                <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
                  <Zap className="w-5 h-5 animate-pulse text-cyan-glow" />
                  <span className="text-sm">Routing request through Zeuroo gateway...</span>
                </div>
              ) : response ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <Streamdown>{response.content}</Streamdown>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                  Send a request to see the AI response here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
