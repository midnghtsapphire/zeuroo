import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Key, Plus, Copy, Check, Trash2, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ApiKeys() {
  const { data: keys, isLoading } = trpc.apiKeys.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [rateLimit, setRateLimit] = useState("60");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setNewKey(data.key);
      utils.apiKeys.list.invalidate();
      toast.success("API key created");
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      utils.apiKeys.list.invalidate();
      toast.success("API key revoked");
    },
  });

  const handleCreate = () => {
    if (!newKeyName.trim()) return toast.error("Enter a key name");
    createMutation.mutate({ name: newKeyName, rateLimit: parseInt(rateLimit) || 60 });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-cyan-glow" /> API Keys
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your API keys for gateway access.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> Create Key
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>{newKey ? "Your New API Key" : "Create API Key"}</DialogTitle>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Copy this key now. You won't be able to see it again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg glass text-xs font-mono break-all">{newKey}</code>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(newKey)} className="glass shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button onClick={() => { setShowCreate(false); setNewKey(null); setNewKeyName(""); }} className="w-full">Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Key Name</label>
                  <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g., Production API Key" className="glass" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Rate Limit (req/min)</label>
                  <Input type="number" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} className="glass" />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                  {createMutation.isPending ? "Creating..." : "Create API Key"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Endpoint Info */}
      <Card className="glass-card border-0 glow-cyan">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-glow mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Gateway Endpoint</p>
              <code className="text-xs font-mono text-muted-foreground">POST /api/trpc/gateway.chat</code>
              <p className="text-xs text-muted-foreground mt-2">Include your API key in the Authorization header: <code className="text-cyan-glow">Bearer zk_...</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-card border-0 animate-pulse"><CardContent className="p-5 h-20" /></Card>
          ))
        ) : !keys?.length ? (
          <Card className="glass-card border-0">
            <CardContent className="p-12 text-center">
              <Key className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No API keys yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id} className="glass-card border-0 hover:glow-cyan transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-glow/20 flex items-center justify-center">
                      <Key className="w-5 h-5 text-cyan-glow" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{key.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-muted-foreground">{key.keyPrefix}...****</code>
                        <Badge variant="outline" className={`text-xs ${key.isActive ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}`}>
                          {key.isActive ? "Active" : "Revoked"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{key.rateLimit} req/min</span>
                    {key.isActive && (
                      <Button variant="ghost" size="sm" onClick={() => revokeMutation.mutate({ id: key.id })} className="text-destructive hover:text-destructive h-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
