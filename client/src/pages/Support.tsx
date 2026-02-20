import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Plus, MessageSquare, Send, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  open: "text-amber-400 border-amber-400/30",
  in_progress: "text-blue-400 border-blue-400/30",
  resolved: "text-emerald-400 border-emerald-400/30",
  closed: "text-muted-foreground border-border",
};

export default function Support() {
  const { data: tickets, isLoading } = trpc.support.tickets.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("technical");
  const [priority, setPriority] = useState<string>("medium");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: messages } = trpc.support.messages.useQuery(
    { ticketId: selectedTicket! },
    { enabled: !!selectedTicket }
  );

  const createMutation = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      utils.support.tickets.invalidate();
      setShowCreate(false);
      setSubject(""); setDescription("");
      toast.success("Ticket created");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMutation = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      utils.support.messages.invalidate();
      setNewMessage("");
      toast.success("Message sent");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-cyan-glow" /> Support
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Get help with billing, technical issues, or account questions.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Subject</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" className="glass" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="cancellation">Cancellation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail..." className="glass min-h-[120px]" />
              </div>
              <Button onClick={() => createMutation.mutate({ subject, description, category: category as any, priority: priority as any })} disabled={createMutation.isPending || !subject.trim() || !description.trim()} className="w-full bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                {createMutation.isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Your Tickets</h3>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Card key={i} className="glass-card border-0 animate-pulse"><CardContent className="p-5 h-20" /></Card>)
          ) : !tickets?.length ? (
            <Card className="glass-card border-0">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No tickets yet.</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className={`glass-card border-0 cursor-pointer transition-all duration-300 ${selectedTicket === ticket.id ? "glow-cyan ring-1 ring-cyan-glow/30" : "hover:glow-cyan"}`} onClick={() => setSelectedTicket(ticket.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[ticket.status] ?? ""}`}>{ticket.status}</Badge>
                        <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Messages */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Conversation</h3>
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              {!selectedTicket ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  Select a ticket to view the conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                    {messages?.map((msg) => (
                      <div key={msg.id} className={`p-3 rounded-xl text-sm ${msg.isStaff ? "glass-strong ml-4" : "glass mr-4"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{msg.isStaff ? "Support Team" : "You"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">{msg.message}</p>
                      </div>
                    ))}
                    {!messages?.length && <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="glass flex-1" onKeyDown={(e) => { if (e.key === "Enter" && newMessage.trim()) sendMutation.mutate({ ticketId: selectedTicket, message: newMessage }); }} />
                    <Button size="sm" onClick={() => { if (newMessage.trim()) sendMutation.mutate({ ticketId: selectedTicket, message: newMessage }); }} disabled={sendMutation.isPending || !newMessage.trim()} className="bg-gradient-to-r from-cyan-glow to-purple-glow text-white border-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
