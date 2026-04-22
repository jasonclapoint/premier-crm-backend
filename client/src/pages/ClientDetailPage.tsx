import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, MapPin, Pencil, Trash2, Calendar } from "lucide-react";
import { ClientFormDrawer } from "@/components/ClientFormDrawer";

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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { token, profile } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ["/api/clients", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/clients/${id}`, undefined, token);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!token && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/clients/${id}`, undefined, token);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Client deleted" });
      navigate("/clients");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: "var(--color-surface-offset)" }} />
        <div className="h-40 rounded-2xl" style={{ background: "var(--color-surface-offset)" }} />
        <div className="h-64 rounded-2xl" style={{ background: "var(--color-surface-offset)" }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Client not found.</p>
        <button onClick={() => navigate("/clients")} className="mt-3 text-xs" style={{ color: "var(--color-primary)" }}>← Back to clients</button>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
        style={{ color: "var(--color-text-muted)" }}
        data-testid="button-back"
      >
        <ArrowLeft size={15} /> Back to Clients
      </button>

      {/* Hero card */}
      <div className="p-6 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: "var(--color-primary-highlight)", color: "var(--color-primary)" }}
          >
            {client.first_name[0]}{client.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                {client.first_name} {client.last_name}
              </h1>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                style={{ background: STATUS_BG[client.status], color: STATUS_COLORS[client.status] }}
                data-testid="client-status"
              >
                {client.status}
              </span>
            </div>
            {client.project_type && (
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{client.project_type}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--color-text-faint)" }}>
              <Calendar size={11} />
              Added {new Date(client.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              data-testid="button-edit-client"
            >
              <Pencil size={13} /> Edit
            </button>
            {isAdmin && (
              <button
                onClick={() => { if (confirm("Delete this client?")) deleteMutation.mutate(); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{ background: "#fde8eb", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                data-testid="button-delete-client"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="p-5 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>Contact</h2>
          <div className="space-y-3">
            <InfoRow icon={<Phone size={14} />} label="Phone" value={client.phone} />
            <InfoRow icon={<Mail size={14} />} label="Email" value={client.email} isEmail />
          </div>
        </div>

        {/* Address */}
        <div className="p-5 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>Address</h2>
          <div className="space-y-2">
            {client.address_street && (
              <div className="flex items-start gap-2">
                <MapPin size={14} style={{ color: "var(--color-text-faint)", marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div className="text-sm" style={{ color: "var(--color-text)" }}>{client.address_street}</div>
                  {(client.address_city || client.address_state || client.address_zip) && (
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {[client.address_city, client.address_state].filter(Boolean).join(", ")}
                      {client.address_zip ? ` ${client.address_zip}` : ""}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!client.address_street && (
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No address on file</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="p-5 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>Notes</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text)" }}>{client.notes}</p>
        </div>
      )}

      <ClientFormDrawer
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}

function InfoRow({ icon, label, value, isEmail }: { icon: React.ReactNode; label: string; value?: string | null; isEmail?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-surface-offset)", color: "var(--color-text-muted)" }}>
        {icon}
      </div>
      <div>
        <div className="text-xs" style={{ color: "var(--color-text-faint)" }}>{label}</div>
        {value ? (
          isEmail ? (
            <a href={`mailto:${value}`} className="text-sm hover:underline" style={{ color: "var(--color-primary)" }}>{value}</a>
          ) : (
            <div className="text-sm" style={{ color: "var(--color-text)" }}>{value}</div>
          )
        ) : (
          <div className="text-sm" style={{ color: "var(--color-text-faint)" }}>—</div>
        )}
      </div>
    </div>
  );
}
