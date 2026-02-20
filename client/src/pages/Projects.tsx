import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderOpen, Plus, Trash2, Settings, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function Projects() {
  const { data: projectsList, isLoading } = trpc.projects.list.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); setShowCreate(false); setName(""); setDescription(""); setBudgetLimit(""); toast.success("Project created"); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); toast.success("Project deleted"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-cyan-glow" /> Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Organize API usage by project with budget tracking.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Project Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Production API" className="glass" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project for?" className="glass" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Monthly Budget Limit ($)</label>
                <Input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} placeholder="e.g., 100" className="glass" />
              </div>
              <Button onClick={() => createMutation.mutate({ name, description: description || undefined, budgetLimit: budgetLimit || undefined })} disabled={createMutation.isPending || !name.trim()} className="w-full bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                {createMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="glass-card border-0 animate-pulse"><CardContent className="p-5 h-32" /></Card>)}
        </div>
      ) : !projectsList?.length ? (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No projects yet. Create one to organize your API usage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projectsList.map((project) => (
            <Card key={project.id} className="glass-card border-0 hover:glow-cyan transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-glow/20 to-purple-glow/20 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-cyan-glow" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{project.name}</h3>
                      <Badge variant="outline" className={`text-[10px] mt-0.5 ${project.isActive ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}`}>
                        {project.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate({ id: project.id })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {project.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>}
                {project.budgetLimit && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> Budget: ${project.budgetLimit}/mo
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">Created {new Date(project.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
