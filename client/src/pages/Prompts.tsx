import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Plus, Wand2, Trash2, Edit, FileText, Copy, Check } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Prompts() {
  const { data: promptsList, isLoading } = trpc.prompts.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [optimizeContent, setOptimizeContent] = useState("");
  const [optimizeGoal, setOptimizeGoal] = useState("");
  const [optimizedResult, setOptimizedResult] = useState("");
  const [showOptimize, setShowOptimize] = useState(false);
  const [copied, setCopied] = useState(false);

  const createMutation = trpc.prompts.create.useMutation({
    onSuccess: () => { utils.prompts.list.invalidate(); setShowCreate(false); setName(""); setContent(""); setTags(""); toast.success("Prompt created"); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.prompts.delete.useMutation({
    onSuccess: () => { utils.prompts.list.invalidate(); toast.success("Prompt deleted"); },
  });

  const optimizeMutation = trpc.prompts.optimize.useMutation({
    onSuccess: (data) => setOptimizedResult(String(data.optimized ?? '')),
    onError: (err) => toast.error(err.message),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-glow" /> Prompt Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage, version, and optimize your prompts.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showOptimize} onOpenChange={setShowOptimize}>
            <DialogTrigger asChild>
              <Button variant="outline" className="glass">
                <Wand2 className="w-4 h-4 mr-2" /> Optimize
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-2xl">
              <DialogHeader><DialogTitle>AI Prompt Optimizer</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Your Prompt</label>
                  <Textarea value={optimizeContent} onChange={(e) => setOptimizeContent(e.target.value)} placeholder="Paste your prompt here..." className="glass min-h-[120px]" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Optimization Goal (optional)</label>
                  <Input value={optimizeGoal} onChange={(e) => setOptimizeGoal(e.target.value)} placeholder="e.g., Better code generation, more concise output..." className="glass" />
                </div>
                <Button onClick={() => optimizeMutation.mutate({ content: optimizeContent, goal: optimizeGoal || undefined })} disabled={optimizeMutation.isPending || !optimizeContent.trim()} className="w-full bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                  {optimizeMutation.isPending ? "Optimizing..." : "Optimize Prompt"}
                </Button>
                {optimizedResult && (
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Optimized Result</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(optimizedResult)} className="h-7 text-xs">
                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="prose prose-invert prose-sm max-w-none">
                      <Streamdown>{optimizedResult}</Streamdown>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                <Plus className="w-4 h-4 mr-2" /> New Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader><DialogTitle>Create Prompt</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Code Review Assistant" className="glass" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Prompt Content</label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="You are a..." className="glass min-h-[150px]" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tags (comma-separated)</label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="coding, review, quality" className="glass" />
                </div>
                <Button onClick={() => createMutation.mutate({ name, content, tags: tags || undefined })} disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                  {createMutation.isPending ? "Creating..." : "Create Prompt"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Prompts Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="glass-card border-0 animate-pulse"><CardContent className="p-5 h-40" /></Card>)}
        </div>
      ) : !promptsList?.length ? (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No prompts yet. Create your first one or use the optimizer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {promptsList.map((prompt) => (
            <Card key={prompt.id} className="glass-card border-0 hover:glow-cyan transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{prompt.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">v{prompt.version} · Used {prompt.usageCount} times</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleCopy(prompt.content)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate({ id: prompt.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{prompt.content}</p>
                {prompt.tags && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.split(",").map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] glass">{tag.trim()}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
