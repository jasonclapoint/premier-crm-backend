import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Premier SVG Logo (standalone version)
function PremierLogoBig() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Premier Kitchens & Baths">
        <rect width="40" height="40" rx="10" fill="var(--color-primary)" />
        <rect x="8" y="8" width="10" height="13" rx="1.5" stroke="var(--color-text-inverse)" strokeWidth="1.6" />
        <rect x="22" y="8" width="10" height="13" rx="1.5" stroke="var(--color-text-inverse)" strokeWidth="1.6" />
        <rect x="8" y="24" width="24" height="8" rx="1.5" stroke="var(--color-text-inverse)" strokeWidth="1.6" />
        <circle cx="13" cy="15.5" r="1.2" fill="var(--color-text-inverse)" opacity="0.7" />
        <circle cx="27" cy="15.5" r="1.2" fill="var(--color-text-inverse)" opacity="0.7" />
        <circle cx="20" cy="28" r="1.2" fill="var(--color-text-inverse)" opacity="0.7" />
      </svg>
      <div className="text-center">
        <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--color-text)" }}>
          Premier Kitchens & Baths
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Client Management System
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const { signup } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signup(signupEmail, signupPassword, signupName);
      navigate("/");
    } catch (err: any) {
      if (err.message === "CHECK_EMAIL") {
        setCheckEmail(true);
      } else {
        toast({ title: "Signup failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
        <div className="w-full max-w-sm text-center p-8 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <PremierLogoBig />
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: "var(--color-primary-highlight)" }}>
            ✉️
          </div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>Check your email</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            We sent a confirmation link to <strong>{signupEmail}</strong>. Click it to activate your account, then come back to log in.
          </p>
          <button
            className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
            onClick={() => { setCheckEmail(false); setTab("login"); }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">
        <PremierLogoBig />

        {/* Tab switcher */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: "var(--color-surface-offset)" }}>
          {(["login", "signup"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: tab === t ? "var(--color-surface-2)" : "transparent",
                color: tab === t ? "var(--color-text)" : "var(--color-text-muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
              data-testid={`tab-${t}`}
            >
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  data-testid="input-login-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                data-testid="button-login-submit"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4" data-testid="form-signup">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  placeholder="Jason Clapoint"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  data-testid="input-signup-name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  data-testid="input-signup-email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  data-testid="input-signup-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={signupConfirm}
                  onChange={e => setSignupConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
                  data-testid="input-signup-confirm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
                data-testid="button-signup-submit"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-faint)" }}>
          Premier Kitchens & Baths · Charlotte, NC
        </p>
      </div>
    </div>
  );
}
