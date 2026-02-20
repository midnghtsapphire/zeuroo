import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, BarChart3, MessageSquare, DollarSign, Zap, FolderOpen, Crown } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  const { data: stats, isLoading: loadingStats } = trpc.admin.stats.useQuery();
  const { data: usersList } = trpc.admin.users.useQuery({});
  const { data: ticketsList } = trpc.admin.tickets.useQuery();
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("Role updated"); },
    onError: (err) => toast.error(err.message),
  });

  const updateTicketMutation = trpc.admin.updateTicket.useMutation({
    onSuccess: () => { utils.admin.tickets.invalidate(); toast.success("Ticket updated"); },
  });

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-cyan-glow" /> Admin Panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">System overview, user management, and support operations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? Array.from({ length: 4 }).map((_, i) => <Card key={i} className="glass-card border-0"><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>) : (
          <>
            <AdminStat icon={Users} label="Total Users" value={stats?.totalUsers?.toLocaleString() ?? "0"} color="text-cyan-glow" />
            <AdminStat icon={BarChart3} label="Total Requests" value={stats?.totalRequests?.toLocaleString() ?? "0"} color="text-purple-glow" />
            <AdminStat icon={DollarSign} label="Total Revenue" value={`$${Number(stats?.totalRevenue ?? 0).toFixed(2)}`} color="text-emerald-400" />
            <AdminStat icon={FolderOpen} label="Total Projects" value={stats?.totalProjects?.toLocaleString() ?? "0"} color="text-amber-400" />
          </>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="tickets"><MessageSquare className="w-4 h-4 mr-1" /> Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">User</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Email</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Tier</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Tokens</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Role</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList?.map((u) => (
                      <tr key={u.id} className="border-b border-border/20 hover:bg-accent/20">
                        <td className="py-2 px-2 font-medium">{u.name ?? "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{u.email ?? "—"}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{u.subscriptionTier}</Badge>
                        </td>
                        <td className="py-2 px-2 text-right">{u.tokenBalance?.toLocaleString()}</td>
                        <td className="py-2 px-2">
                          <Select value={u.role} onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role: role as "user" | "admin" })}>
                            <SelectTrigger className="h-7 text-xs w-20 glass"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!usersList?.length && <p className="text-sm text-muted-foreground text-center py-8">No users yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticketsList?.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 rounded-xl glass">
                    <div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">{ticket.priority}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Select value={ticket.status} onValueChange={(status) => updateTicketMutation.mutate({ id: ticket.id, status: status as any })}>
                      <SelectTrigger className="h-7 text-xs w-28 glass"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {!ticketsList?.length && <p className="text-sm text-muted-foreground text-center py-8">No tickets.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
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
