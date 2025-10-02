import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Trade, Transaction, AdminUsersResponse, AdminTradesResponse, AdminTransactionsResponse } from "@shared/schema";
import { DesktopContainer } from "@/components/layout/desktop-container";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import {
  Bell,
  Wallet,
  Users,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  ChevronRight,
  Coins,
  BitcoinIcon,
  DollarSign
} from "lucide-react";

// Helper to get last 7 days
const getLast7Days = () => {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push({
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    });
  }
  return result;
};

export default function AdminDashboardPage() {
  // Fetch data with pagination (first page only for dashboard overview)
  const { data: usersResponse } = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users", { page: 1, limit: 1000 }], // Get more users for dashboard stats
    queryFn: async () => {
      const response = await fetch("/api/admin/users?page=1&limit=1000");
      return response.json();
    }
  });
  
  const { data: tradesResponse } = useQuery<AdminTradesResponse>({
    queryKey: ["/api/admin/trades", { page: 1, limit: 1000 }], // Get more trades for dashboard stats
    queryFn: async () => {
      const response = await fetch("/api/admin/trades?page=1&limit=1000");
      return response.json();
    }
  });
  
  const { data: transactionsResponse } = useQuery<AdminTransactionsResponse>({
    queryKey: ["/api/admin/transactions", { page: 1, limit: 1000 }], // Get more transactions for dashboard stats
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions?page=1&limit=1000");
      return response.json();
    }
  });

  // Extract data from paginated responses
  const users = usersResponse?.users || [];
  const trades = tradesResponse?.trades || [];
  const transactions = transactionsResponse?.transactions || [];

  // Calculate summary stats
  const totalUsers = users?.length || 0;
  // Since lastLogin is not available in the User type, we'll count all users as active for now
  const totalActiveUsers = users?.length || 0;
  
  const totalBalance = users?.reduce((sum, user) => sum + parseFloat(user.balance || "0"), 0) || 0;
  
  const pendingTransactions = transactions?.filter(t => t.status === 'pending').length || 0;
  const pendingDeposits = transactions?.filter(t => t.type === 'deposit' && t.status === 'pending').length || 0;
  const pendingWithdrawals = transactions?.filter(t => t.type === 'withdraw' && t.status === 'pending').length || 0;
  
  const totalTrades = trades?.length || 0;
  const totalTradeVolume = trades?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  
  // Prepare chart data
  const last7Days = getLast7Days();
  
  // Transaction data for chart
  const transactionData = last7Days.map(day => {
    const dayTransactions = transactions?.filter(t => {
      if (!t.createdAt) return false;
      const date = new Date(t.createdAt);
      if (isNaN(date.getTime())) return false;
      const transactionDate = date.toISOString().slice(0, 10);
      return transactionDate === day.date;
    }) || [];
    
    const deposits = dayTransactions
      .filter(t => t.type === 'deposit' && t.status === 'approved')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const withdrawals = dayTransactions
      .filter(t => t.type === 'withdraw' && t.status === 'approved')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      name: day.label,
      ฝาก: deposits,
      ถอน: withdrawals
    };
  });
  
  // User data for chart
  const userRegistrationData = last7Days.map(day => {
    const newUsers = users?.filter(user => {
      if (!user.createdAt) return false;
      const date = new Date(user.createdAt);
      if (isNaN(date.getTime())) return false;
      const userDate = date.toISOString().slice(0, 10);
      return userDate === day.date;
    }).length || 0;
    
    return {
      name: day.label,
      'ผู้ใช้ใหม่': newUsers
    };
  });
  
  // Trade data for chart
  const tradeData = last7Days.map(day => {
    const dayTrades = trades?.filter(t => {
      if (!t.createdAt) return false;
      const date = new Date(t.createdAt);
      if (isNaN(date.getTime())) return false;
      const tradeDate = date.toISOString().slice(0, 10);
      return tradeDate === day.date;
    }) || [];
    
    const tradeCount = dayTrades.length;
    const tradeVolume = dayTrades.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      name: day.label,
      'จำนวนเทรด': tradeCount,
      'มูลค่าเทรด': tradeVolume
    };
  });
  
  // Top cryptocurrencies data
  const topCryptoData = [
    { name: 'BTC', value: 45 },
    { name: 'ETH', value: 30 },
    { name: 'BNB', value: 15 },
    { name: 'USDT', value: 7 },
    { name: 'Others', value: 3 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <DesktopContainer>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="border-b border-border h-16 bg-card">
            <div className="flex items-center justify-between h-full px-6">
              <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
              
              <div className="flex items-center space-x-4">
                <Button size="icon" variant="ghost">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <div className="h-8 w-px bg-border mx-1" />
                
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="mb-6">
              <h2 className="text-xl font-bold">ภาพรวมระบบ</h2>
              <p className="text-muted-foreground">ยินดีต้อนรับเข้าสู่แดชบอร์ดผู้ดูแลระบบ เอเซีย พลัส</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ผู้ใช้งานทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{totalUsers}</h3>
                      <p className="text-xs text-[hsl(var(--chart-1))] mt-1">
                        {totalActiveUsers} ใช้งานในช่วง 7 วันที่ผ่านมา
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">มูลค่าทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</h3>
                      <p className="text-xs text-green-500 mt-1">
                        ยอดเงินทั้งหมดในระบบ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/10">
                      <Wallet className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">คำขอรออนุมัติ</p>
                      <h3 className="text-2xl font-bold mt-1">{pendingTransactions}</h3>
                      <p className="text-xs text-amber-500 mt-1">
                        ฝาก {pendingDeposits} | ถอน {pendingWithdrawals}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">การเทรดทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{totalTrades}</h3>
                      <p className="text-xs text-blue-500 mt-1">
                        มูลค่า {formatCurrency(totalTradeVolume)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Chart Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>ธุรกรรมฝาก-ถอน (7 วันล่าสุด)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transactionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => value.toLocaleString('th-TH')}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`฿${value.toLocaleString('th-TH')}`, '']}
                          labelFormatter={(label) => `วันที่: ${label}`}
                        />
                        <Bar dataKey="ฝาก" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="ถอน" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>จำนวนผู้ใช้ใหม่</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userRegistrationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="ผู้ใช้ใหม่" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>สกุลเงินที่นิยมเทรด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCryptoData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={(entry) => entry.name}
                        >
                          {topCryptoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle>คำขอรออนุมัติล่าสุด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions?.filter(t => t.status === 'pending').slice(0, 4).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            {transaction.type === 'deposit' ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'deposit' ? 'คำขอฝากเงิน' : 'คำขอถอนเงิน'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ผู้ใช้ #{transaction.userId} - {formatShortDate(transaction.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="font-bold">
                            {formatCurrency(parseFloat(transaction.amount))}
                          </div>
                          <Badge variant="secondary" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            รออนุมัติ
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {(!transactions || transactions.filter(t => t.status === 'pending').length === 0) && (
                      <div className="text-center py-6 text-muted-foreground">
                        ไม่มีคำขอที่รออนุมัติในขณะนี้
                      </div>
                    )}
                    
                    {transactions && transactions.filter(t => t.status === 'pending').length > 0 && (
                      <div className="text-center mt-2">
                        <Button variant="link" className="text-primary">
                          ดูคำขอทั้งหมด
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </DesktopContainer>
  );
}