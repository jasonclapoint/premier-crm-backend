import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import UsersPage from "@/pages/UsersPage";

function AppRoutes() {
  const { token, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/clients/:id" component={ClientDetailPage} />
        {profile?.role === "admin" && <Route path="/users" component={UsersPage} />}
        <Route>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Page not found</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>The page you're looking for doesn't exist.</p>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router hook={useHashLocation}>
            <AppRoutes />
            <Toaster />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
