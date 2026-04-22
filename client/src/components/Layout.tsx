import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, UserCog, LogOut, Menu, X,
  ChevronRight, Wrench, Moon, Sun
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
];

const adminItems = [
  { href: "/users", label: "User Management", icon: UserCog },
];

// Premier Kitchens & Baths SVG Logo
function PremierLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 40 40"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-label="Premier Kitchens & Baths"
      style={{ flexShrink: 0 }}
    >
      <rect width="40" height="40" rx="10" fill="var(--color-primary)" />
      {/* Cabinet / panel lines — construction craft mark */}
      <rect x="8" y="8" width="10" height="13" rx="1.5" stroke="var(--color-text-inverse)" strokeWidth="1.6" />
      <rect x="22" y="8" width="10" height="13" rx="1.5" stroke="var(--color-text-inverse)" strokeWidth="1.6" />
      <rect x="8" y="24" width="24" height="8" rx="1.5" stroke="var(--color-text-inverse)" strokeWidth="1.6" />
      {/* Handle dots */}
      <circle cx="13" cy="15.5" r="1.2" fill="var(--color-text-inverse)" opacity="0.7" />
      <circle cx="27" cy="15.5" r="1.2" fill="var(--color-text-inverse)" opacity="0.7" />
      <circle cx="20" cy="28" r="1.2" fill="var(--color-text-inverse)" opacity="0.7" />
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-72 border-r transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
        data-testid="sidebar"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <PremierLogo size={40} />
          <div>
            <div className="font-semibold text-sm leading-tight" style={{ color: "var(--color-text)" }}>
              Premier Kitchens
            </div>
            <div className="text-xs leading-tight" style={{ color: "var(--color-text-muted)" }}>
              & Baths CRM
            </div>
          </div>
          <button
            className="ml-auto lg:hidden p-2 rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
            onClick={() => setSidebarOpen(false)}
            data-testid="button-close-sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>
            Main
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "text-white"
                      : "hover:opacity-100"
                  )}
                  style={{
                    background: active ? "var(--color-primary)" : "transparent",
                    color: active ? "var(--color-text-inverse)" : "var(--color-text-muted)",
                  }}
                  data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} />
                  {label}
                  {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
                </a>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="mt-5 mb-1 px-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>
                Admin
              </div>
              {adminItems.map(({ href, label, icon: Icon }) => {
                const active = location.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <a
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      )}
                      style={{
                        background: active ? "var(--color-primary)" : "transparent",
                        color: active ? "var(--color-text-inverse)" : "var(--color-text-muted)",
                      }}
                      data-testid="nav-user-management"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={17} />
                      {label}
                      {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
                    </a>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--color-border)" }}>
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "var(--color-primary)", color: "var(--color-text-inverse)" }}
            >
              {profile?.full_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
                {profile?.full_name || "User"}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--color-text-faint)" }}>
                {profile?.role === "admin" ? "Administrator" : "Agent"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggle}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
              style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
              style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
              data-testid="button-logout"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center gap-4 px-5 h-16 border-b flex-shrink-0"
          style={{
            background: "color-mix(in srgb, var(--color-bg) 80%, transparent)",
            backdropFilter: "blur(12px)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            className="lg:hidden p-2 rounded-xl"
            style={{ color: "var(--color-text-muted)" }}
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <Wrench size={14} />
            <span>Premier Kitchens & Baths</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
