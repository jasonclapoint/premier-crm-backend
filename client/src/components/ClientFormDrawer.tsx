import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, ClientStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
}

const STATUSES: ClientStatus[] = ["lead", "estimate", "active", "completed", "archived"];
const PROJECT_TYPES = ["Kitchen Remodel", "Bathroom Remodel", "Deck / Patio", "Fence", "Addition", "Full Renovation", "Light Commercial", "Other"];

const EMPTY = {
  first_name: "", last_name: "", email: "", phone: "",
  address_street: "", address_city: "", address_state: "", address_zip: "",
  project_type: "", status: "lead" as ClientStatus, notes: "",
};

export function ClientFormDrawer({ open, client, onClose }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => {
    if (client) {
      setForm({
        first_name: client.first_name ?? "",
        last_name: client.last_name ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        address_street: client.address_street ?? "",
        address_city: client.address_city ?? "",
        address_state: client.address_state ?? "",
        address_zip: client.address_zip ?? "",
        project_type: client.project_type ?? "",
        status: client.status ?? "lead",
        notes: client.notes ?? "",
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [client, open]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PATCH" : "POST";
      const res = await apiRequest(method, url, body, token);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: client ? "Client updated" : "Client added" });
      onClose();
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: "First and last name required", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col shadow-2xl"
        style={{ background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)" }}
        data-testid="client-form-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
            {client ? "Edit Client" : "Add New Client"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
            data-testid="button-close-drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <input value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Jane" data-testid="input-first-name" />
            </Field>
            <Field label="Last Name" required>
              <input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Smith" data-testid="input-last-name" />
            </Field>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@email.com" data-testid="input-email" />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(704) 555-0123" data-testid="input-phone" />
            </Field>
          </div>

          {/* Address */}
          <Field label="Street Address">
            <input value={form.address_street} onChange={e => set("address_street", e.target.value)} placeholder="123 Oak Street" data-testid="input-address-street" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="City">
                <input value={form.address_city} onChange={e => set("address_city", e.target.value)} placeholder="Charlotte" data-testid="input-address-city" />
              </Field>
            </div>
            <Field label="State">
              <input value={form.address_state} onChange={e => set("address_state", e.target.value)} placeholder="NC" maxLength={2} data-testid="input-address-state" />
            </Field>
          </div>
          <Field label="ZIP Code">
            <input value={form.address_zip} onChange={e => set("address_zip", e.target.value)} placeholder="28202" maxLength={10} data-testid="input-address-zip" className="max-w-[180px]" />
          </Field>

          {/* Project */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Type">
              <select value={form.project_type} onChange={e => set("project_type", e.target.value)} data-testid="select-project-type">
                <option value="">Select…</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set("status", e.target.value as ClientStatus)} data-testid="select-status">
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Project details, follow-up notes…" data-testid="textarea-notes" />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
            data-testid="button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
            data-testid="button-save-client"
          >
            {mutation.isPending ? "Saving…" : client ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </>
  );
}

// Reusable field wrapper
function Field({ label, children, required }: { label: string; children: React.ReactElement; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
        {label}{required && <span style={{ color: "var(--color-error)" }}> *</span>}
      </label>
      {applyFieldStyles(children)}
    </div>
  );
}

function applyFieldStyles(el: React.ReactElement) {
  const base = "w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all";
  const style = {
    background: "var(--color-surface-2)",
    borderColor: "var(--color-border)",
    color: "var(--color-text)",
  };
  return (
    <el.type
      {...el.props}
      className={`${base} ${el.props.className ?? ""}`}
      style={style}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        (e.target as HTMLElement).style.borderColor = "var(--color-primary)";
        el.props.onFocus?.(e);
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        (e.target as HTMLElement).style.borderColor = "var(--color-border)";
        el.props.onBlur?.(e);
      }}
    />
  );
}
