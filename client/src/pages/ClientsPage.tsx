import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, ClientStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, X, ChevronRight, Phone, Mail, MapPin, Pencil, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { ClientFormDrawer } from "@/components/ClientFormDrawer";

const STATUSES: ClientStatus[] = ["lead", "estimate", "active", "completed", "archived"];

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

export default function ClientsPage() {
  const { token, profile } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClientStatus | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients", undefined, token);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/clients/${id}`, undefined, token);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = clients.filter(c => {
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.address_city ?? "").toLowerCase().includes(q) ||
      (c.project_type ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const isAdmin = profile?.role === "admin";

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {clients.length} total client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditClient(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
          data-testid="button-add-client"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <Search size={15} style={{ color: "var(--color-text-faint)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, city…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-text)" }}
            data-testid="input-search-clients"
          />
          {search && (
            <button onClick={() => setSearch("")} data-testid="button-clear-search">
              <X size={14} style={{ color: "var(--color-text-faint)" }} />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filterStatus === "all" ? "var(--color-primary)" : "var(--color-surface)",
              color: filterStatus === "all" ? "var(--color-text-inverse)" : "var(--color-text-muted)",
              border: `1px solid ${filterStatus === "all" ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
            data-testid="filter-all"
          >
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: filterStatus === s ? STATUS_BG[s] : "var(--color-surface)",
                color: filterStatus === s ? STATUS_COLORS[s] : "var(--color-text-muted)",
                border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] : "var(--color-border)"}`,
              }}
              data-testid={`filter-${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--color-surface-offset)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Search size={28} style={{ color: "var(--color-text-faint)" }} className="mb-2" />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
              {search || filterStatus !== "all" ? "No clients match your filters" : "No clients yet"}
            </p>
            {!search && filterStatus === "all" && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
              >
                Add your first client
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    {["Client", "Contact", "Location", "Project", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {filtered.map(c => (
                    <tr key={c.id} className="group hover:opacity-80 transition-opacity" data-testid={`client-row-${c.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--color-primary-highlight)", color: "var(--color-primary)" }}>
                            {c.first_name[0]}{c.last_name[0]}
                          </div>
                          <Link href={`/clients/${c.id}`}>
                            <a className="text-sm font-semibold hover:underline" style={{ color: "var(--color-text)" }}>
                              {c.first_name} {c.last_name}
                            </a>
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {c.phone && <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}><Phone size={11} />{c.phone}</div>}
                          {c.email && <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}><Mail size={11} />{c.email}</div>}
                          {!c.phone && !c.email && <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.address_city ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            <MapPin size={11} />{c.address_city}{c.address_state ? `, ${c.address_state}` : ""}
                          </div>
                        ) : <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.project_type || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{ background: STATUS_BG[c.status], color: STATUS_COLORS[c.status] }}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditClient(c); setDrawerOpen(true); }}
                            className="p-1.5 rounded-lg hover:opacity-70"
                            style={{ color: "var(--color-text-muted)" }}
                            data-testid={`button-edit-client-${c.id}`}
                          >
                            <Pencil size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => { if (confirm(`Delete ${c.first_name} ${c.last_name}?`)) deleteMutation.mutate(c.id); }}
                              className="p-1.5 rounded-lg hover:opacity-70"
                              style={{ color: "var(--color-error)" }}
                              data-testid={`button-delete-client-${c.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <Link href={`/clients/${c.id}`}>
                            <a className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--color-text-faint)" }} data-testid={`link-client-${c.id}`}>
                              <ChevronRight size={14} />
                            </a>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "var(--color-border)" }}>
              {filtered.map(c => (
                <div key={c.id} className="p-4 space-y-2" data-testid={`client-card-${c.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--color-primary-highlight)", color: "var(--color-primary)" }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div className="flex-1">
                      <Link href={`/clients/${c.id}`}>
                        <a className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{c.first_name} {c.last_name}</a>
                      </Link>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.project_type || "—"}</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: STATUS_BG[c.status], color: STATUS_COLORS[c.status] }}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditClient(c); setDrawerOpen(true); }} className="flex-1 py-1.5 text-xs font-medium rounded-lg" style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}>
                      Edit
                    </button>
                    <Link href={`/clients/${c.id}`}>
                      <a className="flex-1 py-1.5 text-xs font-medium rounded-lg text-center" style={{ background: "var(--color-primary-highlight)", color: "var(--color-primary)" }}>
                        View
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      <ClientFormDrawer
        open={drawerOpen}
        client={editClient}
        onClose={() => { setDrawerOpen(false); setEditClient(null); }}
      />
    </div>
  );
}
