// Supabase-backed types — no Drizzle ORM needed since we use Supabase client directly

export type UserRole = "admin" | "agent";
export type ClientStatus = "lead" | "estimate" | "active" | "completed" | "archived";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  project_type: string | null;
  status: ClientStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertClient = Omit<Client, "id" | "created_at" | "updated_at">;
export type UpdateClient = Partial<InsertClient>;
