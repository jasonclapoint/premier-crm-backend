import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import { Users, ClipboardList, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  lead: "var(--color-primary)",
  estimate: "var(--color-warning)",
  active: "var(--color-success)",
  completed: "var(--color-text-muted)",
  archived: "var(--color-text-faint)",
};
const STATUS_BG: Record<string, string> = {
  lead: "var(--color-primary-highlight)",
  estimate: "#ffe8d6",
  active: "#dff0d4",
  completed: "var(--color-surface-offset)",
  archived: "var(--color-surface-dynamic)",
};

export default function DashboardPage() {
  const { profile, token } = useAuth();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients", undefined, token);
      if (!res.ok) throw new Error("Failed to load clients");
      return res.json();
    },
    enabled: !!token,
  });

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const leads = clients.filter(c => c.status === "lead").length;
  const completed = clients.filter(c => c.status === "completed").length;

  const recentClients = [...clients].slice(0, 6);

  const statusCounts: Record<string, number> = {};
  for (const c of clients) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }

  const kpis = [
    { label: "Total Clients", value: totalClients, icon: Users, color: "var(--color-primary)" },
    { label: "Active Projects", value: activeClients, icon: ClipboardList, color: "var(--color-success)" },
    { label: "Open Leads", value: leads, icon: TrendingUp, color: "var(--color-warning)" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "var(--color-text-muted)" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          Good {getGreeting()}, {profile?.full_name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Here's your Premier Kitchens & Baths overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="p-5 rounded-2xl border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                {label}
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 14%, var(--color-surface))` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-16 rounded-lg animate-pulse" style={{ background: "var(--color-surface-offset)" }} />
            ) : (
              <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline + Recent */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Pipeline */}
        <div className="lg:col-span-2 p-5 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            Pipeline Breakdown
          </h2>
          <div className="space-y-3">
            {["lead", "estimate", "active", "completed", "archived"].map(status => {
              const count = statusCounts[status] || 0;
              const pct = totalClients > 0 ? Math.round((count / totalClients) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="capitalize font-medium" style={{ color: "var(--color-text)" }}>{status}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-offset)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: STATUS_COLORS[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent clients */}
        <div className="lg:col-span-3 rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Recent Clients</h2>
            <Link href="/clients">
              <a className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "var(--color-primary)" }}>
                View all <ArrowRight size={12} />
              </a>
            </Link>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--color-surface-offset)" }} />
              ))}
            </div>
          ) : recentClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Users size={28} style={{ color: "var(--color-text-faint)" }} className="mb-2" />
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No clients yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>Add your first client to get started</p>
              <Link href="/clients">
                <a className="mt-3 text-xs font-semibold px-4 py-2 rounded-xl" style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}>
                  Add Client
                </a>
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {recentClients.map(client => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <a className="flex items-center gap-3 px-5 py-3.5 hover:opacity-80 transition-opacity" data-testid={`client-row-${client.id}`}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--color-primary-highlight)", color: "var(--color-primary)" }}
                    >
                      {client.first_name[0]}{client.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                        {client.first_name} {client.last_name}
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                        {client.project_type || "—"} · {client.address_city || "—"}
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize flex-shrink-0"
                      style={{ background: STATUS_BG[client.status] || "var(--color-surface-offset)", color: STATUS_COLORS[client.status] || "var(--color-text-muted)" }}
                    >
                      {client.status}
                    </span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
