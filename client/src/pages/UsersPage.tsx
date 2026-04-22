import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Profile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCheck, Trash2, Crown } from "lucide-react";

export default function UsersPage() {
  const { token, profile: me } = useAuth();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users", undefined, token);
      if (!res.ok) throw new Error("Access denied");
      return res.json();
    },
    enabled: !!token,
  });

  const rolesMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}/role`, { role }, token);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Role updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`, undefined, token);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>User Management</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {users.length} team member{users.length !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "var(--color-primary-highlight)", border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
        <Shield size={16} style={{ color: "var(--color-primary)", marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>Role-Based Access Control</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Agents can add/edit clients. Only Admins can delete clients and manage users. All data is protected by Supabase RLS policies.
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--color-surface-offset)" }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No users found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {users.map(user => {
              const isSelf = user.id === me?.id;
              return (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4" data-testid={`user-row-${user.id}`}>
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: user.role === "admin" ? "var(--color-primary)" : "var(--color-surface-offset)",
                      color: user.role === "admin" ? "var(--color-text-inverse)" : "var(--color-text-muted)",
                    }}
                  >
                    {(user.full_name?.[0] ?? user.email[0]).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        {user.full_name || "—"}
                      </span>
                      {isSelf && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--color-surface-offset)", color: "var(--color-text-muted)" }}>
                          You
                        </span>
                      )}
                      {user.role === "admin" && (
                        <Crown size={12} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
                      )}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{user.email}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                      Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  {/* Role badge */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                    style={{
                      background: user.role === "admin" ? "color-mix(in srgb, var(--color-warning) 14%, var(--color-surface))" : "var(--color-surface-2)",
                      color: user.role === "admin" ? "var(--color-warning)" : "var(--color-text-muted)",
                    }}
                  >
                    {user.role}
                  </span>

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => rolesMutation.mutate({ id: user.id, role: user.role === "admin" ? "agent" : "admin" })}
                        disabled={rolesMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                        data-testid={`button-toggle-role-${user.id}`}
                        title={user.role === "admin" ? "Demote to Agent" : "Promote to Admin"}
                      >
                        {user.role === "admin" ? <><UserCheck size={12} /> Demote</> : <><Shield size={12} /> Promote</>}
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remove ${user.full_name || user.email}? This cannot be undone.`)) deleteMutation.mutate(user.id); }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-xl transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ color: "var(--color-error)" }}
                        data-testid={`button-delete-user-${user.id}`}
                        title="Remove user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to add users */}
      <div className="p-4 rounded-2xl" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Adding Team Members</p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Share the CRM link with your team. They can sign up directly using the Create Account screen. New accounts default to the Agent role — promote them to Admin here as needed.
        </p>
      </div>
    </div>
  );
}
