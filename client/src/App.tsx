import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { SplashScreen } from "@/components/splash-screen";
import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TradingPage from "@/pages/trading-page";
import AdminPage from "@/pages/admin-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminTransactionsPage from "@/pages/admin-transactions-page";
import AdminTradesPage from "@/pages/admin-trades-page";
import AdminReportsPage from "@/pages/admin-reports-page";
import AdminSettingsPage from "@/pages/admin-settings-page";
import WalletPage from "@/pages/wallet-page";
import ProfilePage from "@/pages/profile-page";
import NewsPage from "@/pages/news-page";
import TradeHistoryPage from "@/pages/trade-history-page";

function Router() {
  return (
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
          <TooltipProvider>
            <Toaster />
            {showSplash ? (
              <SplashScreen onComplete={handleSplashComplete} />
            ) : (
              <Router />
            )}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
