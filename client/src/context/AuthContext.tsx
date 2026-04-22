import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "agent";
  created_at: string;
  updated_at: string;
}

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// In-memory token store — persists across renders, lost on full page reload
// (acceptable since the CRM is a deployed app; on *.pplx.app the token stays in memory)
let _memToken: string | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    profile: null,
    loading: true,
  });

  const fetchMe = async (token: string) => {
    try {
      const res = await apiRequest("GET", "/api/auth/me", undefined, token);
      if (res.ok) {
        const data = await res.json();
        _memToken = token;
        setState({ token, profile: data.profile, loading: false });
        return;
      }
    } catch {}
    // Token invalid
    _memToken = null;
    setState({ token: null, profile: null, loading: false });
  };

  useEffect(() => {
    // Try in-memory token (survives renders but not hard refresh — by design)
    if (_memToken) {
      fetchMe(_memToken);
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    const token = data.session?.access_token;
    if (!token) throw new Error("No session token returned");
    _memToken = token;
    const meRes = await apiRequest("GET", "/api/auth/me", undefined, token);
    const meData = await meRes.json();
    setState({ token, profile: meData.profile, loading: false });
  };

  const signup = async (email: string, password: string, full_name: string) => {
    const res = await apiRequest("POST", "/api/auth/signup", { email, password, full_name });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Signup failed");
    }
    const data = await res.json();
    const token = data.session?.access_token;
    if (token) {
      _memToken = token;
      const meRes = await apiRequest("GET", "/api/auth/me", undefined, token);
      const meData = await meRes.json();
      setState({ token, profile: meData.profile, loading: false });
    } else {
      // Email confirmation required
      throw new Error("CHECK_EMAIL");
    }
  };

  const logout = () => {
    _memToken = null;
    setState({ token: null, profile: null, loading: false });
    queryClient.clear();
  };

  const refreshProfile = async () => {
    if (!state.token) return;
    await fetchMe(state.token);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Lazy import to avoid circular
import { queryClient } from "@/lib/queryClient";
