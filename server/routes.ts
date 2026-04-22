import type { Express } from "express";
import type { Server } from "http";
import supabase from "./supabase";

export function registerRoutes(httpServer: Server, app: Express) {
  // Health check
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Helper to get the auth user from bearer token
  async function getAuthUser(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  }

  // Helper to get profile (with role)
  async function getProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  }

  // ─── AUTH ────────────────────────────────────────────────────────────────────

  // Sign up
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "email, password and full_name required" });
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role: "agent" } },
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  });

  // Get current user profile
  app.get("/api/auth/me", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const profile = await getProfile(user.id);
    return res.json({ user, profile });
  });

  // ─── CLIENTS ─────────────────────────────────────────────────────────────────

  // List all clients
  app.get("/api/clients", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Use authed client for RLS
    const authedClient = createAuthedClient(req.headers.authorization!.slice(7));
    const { data, error } = await authedClient
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  // Get single client
  app.get("/api/clients/:id", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const authedClient = createAuthedClient(req.headers.authorization!.slice(7));
    const { data, error } = await authedClient
      .from("clients")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) return res.status(404).json({ error: "Client not found" });
    return res.json(data);
  });

  // Create client
  app.post("/api/clients", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const authedClient = createAuthedClient(req.headers.authorization!.slice(7));
    const { data, error } = await authedClient
      .from("clients")
      .insert({ ...req.body, created_by: user.id })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  });

  // Update client
  app.patch("/api/clients/:id", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const authedClient = createAuthedClient(req.headers.authorization!.slice(7));
    const { data, error } = await authedClient
      .from("clients")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  });

  // Delete client (admin only — enforced by RLS)
  app.delete("/api/clients/:id", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const authedClient = createAuthedClient(req.headers.authorization!.slice(7));
    const { error } = await authedClient
      .from("clients")
      .delete()
      .eq("id", req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  });

  // ─── USERS (Admin only) ───────────────────────────────────────────────────────

  // List all users/profiles
  app.get("/api/users", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const profile = await getProfile(user.id);
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  // Update user role (admin only)
  app.patch("/api/users/:id/role", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const profile = await getProfile(user.id);
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { role } = req.body;
    if (!["admin", "agent"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", async (req, res) => {
    const user = await getAuthUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const profile = await getProfile(user.id);
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Delete from auth (cascades to profiles)
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  });
}

// Create a Supabase client that uses the user's JWT for RLS
import { createClient } from "@supabase/supabase-js";
function createAuthedClient(token: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
}
