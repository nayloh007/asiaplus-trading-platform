import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Trade, Transaction } from "@shared/schema";
import { DesktopContainer } from "@/components/layout/desktop-container";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import {
  Search,
  Bell,
  Download,
  Calendar,
  FileBarChart,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Users,
  TrendingUp
} from "lucide-react";

// Helper function to generate dates for the past N days
const getPastDays = (days: number) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push({
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    });
  }
  return result;
};

export default function AdminReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("last7days");
  const [chartType, setChartType] = useState("bar");
  
  // Fetch data
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/admin/trades"],
  });
  
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
  });

  // Calculate metrics based on date range
  const pastDays = dateRange === "last7days" ? 7 : dateRange === "last30days" ? 30 : 90;
  const dateList = getPastDays(pastDays);
  
  // Prepare transaction data for charts
  const getTransactionData = () => {
    const data = dateList.map(day => {
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
        ถอน: withdrawals,
        สุทธิ: deposits - withdrawals
      };
    });
    
    return data;
  };
  
  // Prepare trade data for charts
  const getTradeData = () => {
    const data = dateList.map(day => {
      const dayTrades = trades?.filter(t => {
        if (!t.createdAt) return false;
        const date = new Date(t.createdAt);
        if (isNaN(date.getTime())) return false;
        const tradeDate = date.toISOString().slice(0, 10);
        return tradeDate === day.date;
      }) || [];
      
      const upTrades = dayTrades.filter(t => t.direction === 'up');
      const downTrades = dayTrades.filter(t => t.direction === 'down');
      
      const volume = dayTrades.reduce((sum, t) => sum + (parseFloat(t.amount) * parseFloat(t.entryPrice)), 0);
      
      return {
        name: day.label,
        มูลค่าการเทรด: volume,
        ขึ้น: upTrades.length,
        ลง: downTrades.length,
        จำนวนการเทรด: dayTrades.length
      };
    });
    
    return data;
  };
  
  // Prepare user growth data
  const getUserGrowthData = () => {
    if (!users) return [];
    
    // Sort users by creation date
    const sortedUsers = [...users].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Count users by date
    const usersByDate = dateList.map(day => {
      const count = sortedUsers.filter(user => {
        if (!user.createdAt) return false;
        const date = new Date(user.createdAt);
        if (isNaN(date.getTime())) return false;
        const userDate = date.toISOString().slice(0, 10);
        return userDate <= day.date;
      }).length;
      
      return {
        name: day.label,
        ผู้ใช้: count
      };
    });
    
    return usersByDate;
  };
  
  // Prepare data for pie chart
  const getTradeDistributionData = () => {
    if (!trades) return [];
    
    const cryptoTrades: Record<string, number> = {};
    
    trades.forEach(trade => {
      const crypto = trade.cryptoId;
      const amount = parseFloat(trade.amount) * parseFloat(trade.entryPrice);
      
      if (cryptoTrades[crypto]) {
        cryptoTrades[crypto] += amount;
      } else {
        cryptoTrades[crypto] = amount;
      }
    });
    
    return Object.entries(cryptoTrades).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));
  };
  
  // Data for charts
  const transactionData = getTransactionData();
  const tradeData = getTradeData();
  const userGrowthData = getUserGrowthData();
  const tradeDistributionData = getTradeDistributionData();
  
  // Calculate summary metrics
  const totalUsers = users?.length || 0;
  const newUsers = users?.filter(
    u => new Date(u.createdAt) > new Date(Date.now() - (pastDays * 24 * 60 * 60 * 1000))
  ).length || 0;
  
  const totalTrades = trades?.length || 0;
  const totalTradeVolume = trades?.reduce(
    (sum, t) => sum + (parseFloat(t.amount) * parseFloat(t.entryPrice)), 0
  ) || 0;
  
  const totalDeposits = transactions?.filter(
    t => t.type === 'deposit' && t.status === 'approved'
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  
  const totalWithdrawals = transactions?.filter(
    t => t.type === 'withdraw' && t.status === 'approved'
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  // Colors for charts
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
              <h1 className="text-2xl font-bold">รายงานและวิเคราะห์</h1>
              
              <div className="flex items-center space-x-4">
                <div className="h-8 w-px bg-border mx-1" />
                
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {/* Page Header with Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">ภาพรวมและข้อมูลสถิติ</h2>
                <p className="text-muted-foreground">รายงานสถิติและการวิเคราะห์ข้อมูลของระบบ</p>
              </div>
              
              <div className="flex space-x-3 items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="เลือกช่วงเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last7days">7 วันล่าสุด</SelectItem>
                      <SelectItem value="last30days">30 วันล่าสุด</SelectItem>
                      <SelectItem value="last90days">90 วันล่าสุด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="h-9">
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออกรายงาน
                </Button>
              </div>
            </div>
            
            {/* Dashboard Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{totalUsers}</h3>
                      <p className="text-xs text-green-500 mt-1">
                        +{newUsers} ผู้ใช้ใหม่ (ใน {pastDays} วัน)
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">มูลค่าการเทรด</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalTradeVolume)}</h3>
                      <p className="text-xs text-blue-500 mt-1">
                        {totalTrades} รายการเทรด
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ยอดฝากเงิน</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalDeposits)}</h3>
                      <p className="text-xs text-green-500 mt-1">
                        ทั้งหมดในระบบ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/10">
                      <BarChartIcon className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ยอดถอนเงิน</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalWithdrawals)}</h3>
                      <p className="text-xs text-orange-500 mt-1">
                        ทั้งหมดในระบบ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-500/10">
                      <LineChartIcon className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Charts */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>ธุรกรรมฝาก-ถอน</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant={chartType === "bar" ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setChartType("bar")}
                      >
                        <BarChartIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={chartType === "line" ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setChartType("line")}
                      >
                        <LineChartIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
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
                          <Legend />
                          <Bar dataKey="ฝาก" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                          <Bar dataKey="ถอน" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      ) : (
                        <LineChart data={transactionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis 
                            tickFormatter={(value) => value.toLocaleString('th-TH')}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`฿${value.toLocaleString('th-TH')}`, '']}
                            labelFormatter={(label) => `วันที่: ${label}`}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="ฝาก" stroke="#10b981" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="ถอน" stroke="#ef4444" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="สุทธิ" stroke="#3b82f6" activeDot={{ r: 8 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>การเติบโตของผู้ใช้</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [value.toString(), 'จำนวนผู้ใช้']}
                        />
                        <Line type="monotone" dataKey="ผู้ใช้" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>มูลค่าการเทรด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tradeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          stroke="#8884d8"
                          tickFormatter={(value) => value.toLocaleString('th-TH')}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#82ca9d"
                        />
                        <Tooltip 
                          formatter={(value: number, name) => {
                            if (name === "มูลค่าการเทรด") {
                              return [`฿${value.toLocaleString('th-TH')}`, name];
                            }
                            return [value, name];
                          }}
                          labelFormatter={(label) => `วันที่: ${label}`}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="มูลค่าการเทรด" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="จำนวนการเทรด" stroke="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>การกระจายตัวของสกุลเงินดิจิทัล</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={tradeDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={(entry) => entry.name}
                        >
                          {tradeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`฿${value.toLocaleString('th-TH')}`, '']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
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