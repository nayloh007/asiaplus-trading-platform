import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { SplashScreen } from "@/components/splash-screen";
import { useState, useEffect, Suspense, lazy } from "react";
import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";

// Lazy load all page components
const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const TradingPage = lazy(() => import("@/pages/trading-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users-page"));
const AdminTransactionsPage = lazy(() => import("@/pages/admin-transactions-page"));
const AdminTradesPage = lazy(() => import("@/pages/admin-trades-page"));
const AdminReportsPage = lazy(() => import("@/pages/admin-reports-page"));
const AdminSettingsPage = lazy(() => import("@/pages/admin-settings-page"));
const WalletPage = lazy(() => import("@/pages/wallet-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const NewsPage = lazy(() => import("@/pages/news-page"));
const TradeHistoryPage = lazy(() => import("@/pages/trade-history-page"));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/trade" component={TradingPage} />
        <ProtectedRoute path="/trades/history" component={TradeHistoryPage} />
        <ProtectedRoute path="/wallet" component={WalletPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/news" component={NewsPage} />
        <AdminRoute path="/admin" component={AdminDashboardPage} />
        <AdminRoute path="/admin/users" component={AdminUsersPage} />
        <AdminRoute path="/admin/transactions" component={AdminTransactionsPage} />
        <AdminRoute path="/admin/trades" component={AdminTradesPage} />
        <AdminRoute path="/admin/reports" component={AdminReportsPage} />
        <AdminRoute path="/admin/settings" component={AdminSettingsPage} />
        <AdminRoute path="/admin/old" component={AdminPage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // แสดง splash screen ทุกครั้งที่มีการรีเฟรช
  // ไม่มีการเช็ค session storage แล้ว

  const handleSplashComplete = () => {
    setShowSplash(false);
    // ไม่ต้องบันทึกค่าใน sessionStorage แล้ว เพื่อให้แสดงทุกครั้งที่รีเฟรช
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              {showSplash ? (
                <SplashScreen onComplete={handleSplashComplete} />
              ) : (
                <>
                  <Router />
                </>
              )}
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
