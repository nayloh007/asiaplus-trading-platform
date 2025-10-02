import { Link, useLocation } from "wouter";
import { adminNavPaths } from "@/components/layout/admin-nav-paths";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileBarChart,
  Settings,
  LogOut,
  ChevronRight,
  Trophy
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const handleLogout = async () => {
    logoutMutation.mutate();
  };
  
  // เลือกไอคอนตามเส้นทาง
  const getIconForPath = (path: string) => {
    if (path === "/admin") return <LayoutDashboard className="h-5 w-5" />;
    if (path === "/admin/users") return <Users className="h-5 w-5" />;
    if (path === "/admin/transactions") return <Receipt className="h-5 w-5" />;
    if (path === "/admin/trades") return <Trophy className="h-5 w-5" />;
    if (path === "/admin/reports") return <FileBarChart className="h-5 w-5" />;
    if (path === "/admin/settings") return <Settings className="h-5 w-5" />;
    return <ChevronRight className="h-5 w-5" />;
  };
  
  return (
    <div className="w-64 border-r border-border bg-card h-screen flex flex-col overflow-hidden">
      {/* Logo และหัวเรื่อง */}
      <div className="p-6 border-b border-border">
        <Link href="/admin">
          <a className="flex items-center">
            <img 
              src="/Asia_Plus_Securities.png" 
              alt="โลโก้ Asia Plus Securities" 
              className="h-8 mr-2" 
            />
            <h1 className="text-xl font-bold ml-2">Asia Plus Admin</h1>
          </a>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1">
          {adminNavPaths.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {getIconForPath(item.path)}
                <span className="ml-3">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
      
      {/* User Info & Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">แอดมิน</p>
            <p className="text-xs text-muted-foreground">admin@asiaplus.co.th</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
}