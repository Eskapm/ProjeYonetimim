import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PrintHeaderFooter } from "@/components/print-header-footer";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProjectProvider } from "@/hooks/use-project-context";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Transactions from "@/pages/transactions";
import SiteDiary from "@/pages/site-diary";
import Puantaj from "@/pages/puantaj";
import Subcontractors from "@/pages/subcontractors";
import Customers from "@/pages/customers";
import WorkSchedule from "@/pages/work-schedule";
import Budget from "@/pages/budget";
import Reports from "@/pages/reports";
import Invoices from "@/pages/invoices";
import Hakedis from "@/pages/hakedis";
import Contracts from "@/pages/contracts";
import PaymentPlans from "@/pages/payment-plans";
import Documents from "@/pages/documents";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import logoUrl from "@assets/ESKA LOGO TASARIMI_1761497797352.png";

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}

function LogoutButton() {
  const { logoutMutation } = useAuth();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => logoutMutation.mutate()}
      data-testid="button-logout"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projeler" component={Projects} />
      <ProtectedRoute path="/projeler/:id" component={ProjectDetail} />
      <ProtectedRoute path="/islemler" component={Transactions} />
      <ProtectedRoute path="/santiye-defteri" component={SiteDiary} />
      <ProtectedRoute path="/puantaj" component={Puantaj} />
      <ProtectedRoute path="/faturalar" component={Invoices} />
      <ProtectedRoute path="/hakedis" component={Hakedis} />
      <ProtectedRoute path="/is-programi" component={WorkSchedule} />
      <ProtectedRoute path="/butce" component={Budget} />
      <ProtectedRoute path="/taseronlar" component={Subcontractors} />
      <ProtectedRoute path="/musteriler" component={Customers} />
      <ProtectedRoute path="/raporlar" component={Reports} />
      <ProtectedRoute path="/sozlesmeler" component={Contracts} />
      <ProtectedRoute path="/odeme-planlari" component={PaymentPlans} />
      <ProtectedRoute path="/dokumanlar" component={Documents} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (!user) {
    return <Router />;
  }

  return (
    <ProjectProvider>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <PrintHeaderFooter />
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-2">
                    <img
                      src={logoUrl}
                      alt="ESKA"
                      className="h-10 w-auto object-contain"
                    />
                    <span className="text-xs font-medium">
                      İnşaat Proje Yönetim Sistemi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <LogoutButton />
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6 bg-background print:pt-28 print:pb-20">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
